import { createHmac, createHash, randomBytes } from "node:crypto";
import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { authMiddleware } from "@/lib/auth/middleware";
import { getSql } from "@/lib/db";
import { CURRENCIES, type Currency, getGame } from "@/lib/games-catalog";
import { asNumber } from "@/lib/format";
import { crashPointFromFloat, unitFromU64, u64FromBytes } from "@/lib/fair";
import { crashElapsedFor, crashMultiplierAt, newRoundId } from "@/lib/rng";
import { crashGrowth } from "@/lib/live-table";
import { crazyRound, type CrazyBetSpot } from "@/lib/crazy-tols";
import { oddsFor, orderFromFloats } from "@/games/horse-race/game/rtp";
import { credit, debit, ensureWallets, snapshotBalances } from "@/lib/wallet.server";
import { pushSettledBet } from "@/lib/governance/bridge";

const currencySchema = z.enum(CURRENCIES);

export type LiveOutcome = {
  crashAt?: number;
  wheelIndex?: number;
  segment?: string;
  segmentLabel?: string;
  topSlot?: { segment: string; multiplier: number } | null;
  bonus?: {
    kind: string;
    blue?: number;
    red?: number;
    side?: string;
    slot?: number;
    value?: number;
    doubles?: number;
    cell?: number;
    wheelIndex?: number;
  } | null;
  profitMultiplier?: number;
  winnerId?: number;
  order?: number[];
  margins?: number[];
  photoFinish?: boolean;
};

export type LivePhase = "betting" | "locked" | "running" | "result";

export type LiveTapeBet = {
  name: string;
  amount: number;
  currency: string;
  pick: string;
  status: string;
  cashMult: number | null;
  payout: number | null;
  mine: boolean;
};

export type LiveSnap = {
  gameId: string;
  n: number;
  phase: LivePhase;
  hash: string;
  seed: string | null;
  opensAt: number;
  locksAt: number;
  startsAt: number;
  revealAt: number;
  endsAt: number;
  serverNow: number;
  left: number;
  outcome: LiveOutcome | null;
  bets: LiveTapeBet[];
  you: { status: string; amount: number; payout: number | null; cashMult: number | null; pick: string } | null;
  history: { n: number; label: string }[];
};

type Kind = "crash" | "crazy" | "horse";

type RoundRow = {
  game_id: string;
  n: number;
  seed: string;
  hash: string;
  opens_at: string | number;
  locks_at: string | number;
  starts_at: string | number;
  reveal_at: string | number;
  ends_at: string | number;
  outcome: string;
  settled: boolean;
};

function num(v: string | number): number {
  return typeof v === "number" ? v : Number(v);
}

function settledOf(v: unknown) {
  return v === true || v === 1 || v === "t" || v === "true";
}

function kindOf(gameId: string): Kind {
  const game = getGame(gameId);
  if (!game) throw new Error("Unknown game");
  if (game.kind === "crash" || game.kind === "crazy" || game.kind === "horse") return game.kind;
  throw new Error("Not a live table");
}

function floatsFromSeed(seed: string, count: number): number[] {
  return Array.from({ length: count }, (_, i) => {
    const block = new Uint8Array(createHmac("sha256", seed).update(`live:${i}`).digest());
    return unitFromU64(u64FromBytes(block));
  });
}

function hashSeed(seed: string) {
  return createHash("sha256").update(seed).digest("hex");
}

function buildOutcome(gameId: string, kind: Kind, seed: string) {
  const floats = floatsFromSeed(seed, 16);
  if (kind === "crash") {
    const game = getGame(gameId);
    const edge = game?.edge ?? 0.04;
    const growth = crashGrowth(gameId);
    const crashAt = crashPointFromFloat(floats[0] ?? 0.5, edge);
    const flight = Math.min(Math.max(crashElapsedFor(crashAt, growth), 400), 90_000);
    return { floats, crashAt, growth, edge, flight };
  }
  if (kind === "crazy") {
    const drawn = crazyRound(floats, "1");
    return {
      floats,
      wheelIndex: drawn.wheelIndex,
      segment: drawn.segment,
      segmentLabel: drawn.segmentLabel,
      topSlot: drawn.topSlot,
      bonus: drawn.bonus,
      profitMultiplier: drawn.profitMultiplier,
    };
  }
  const race = orderFromFloats(floats, 6);
  return {
    floats,
    winnerId: race.winnerId,
    order: race.order,
    margins: race.margins,
    photoFinish: race.photoFinish,
  };
}

function windows(kind: Kind, opens: number, outcome: { flight?: number }) {
  if (kind === "crash") {
    const locks = opens + 7_000;
    const starts = locks + 800;
    const reveal = starts + (outcome.flight ?? 3_000);
    return { locks, starts, reveal, ends: reveal + 2_800 };
  }
  if (kind === "crazy") {
    const locks = opens + 8_000;
    const starts = locks;
    const reveal = starts + 4_000;
    return { locks, starts, reveal, ends: reveal + 3_000 };
  }
  const locks = opens + 10_000;
  const starts = locks + 2_000;
  const reveal = starts + 8_000;
  return { locks, starts, reveal, ends: reveal + 4_000 };
}

function phaseAt(row: RoundRow, now: number): LivePhase {
  if (now < num(row.locks_at)) return "betting";
  if (now < num(row.starts_at)) return "locked";
  if (now < num(row.reveal_at)) return "running";
  return "result";
}

function publicOutcome(kind: Kind, phase: LivePhase, outcome: LiveOutcome): LiveOutcome | null {
  if (kind === "crash") {
    if (phase !== "result") return null;
    return { crashAt: outcome.crashAt };
  }
  if (phase === "betting" || phase === "locked") return null;
  if (kind === "crazy") {
    return {
      wheelIndex: outcome.wheelIndex,
      segment: outcome.segment,
      segmentLabel: outcome.segmentLabel,
      topSlot: outcome.topSlot,
      bonus: outcome.bonus,
      profitMultiplier: outcome.profitMultiplier,
    };
  }
  return {
    winnerId: outcome.winnerId,
    order: outcome.order,
    margins: outcome.margins,
    photoFinish: outcome.photoFinish,
  };
}

function historyLabel(kind: Kind, outcome: Record<string, unknown>) {
  if (kind === "crash") return `${Number(outcome.crashAt).toFixed(2)}×`;
  if (kind === "crazy") return String(outcome.segmentLabel ?? "spin");
  return `#${Number(outcome.winnerId) + 1}`;
}

async function displayName(userId: string) {
  const sql = await getSql();
  const rows = await sql<{ name: string | null }>`select name from "user" where id = ${userId} limit 1`;
  return rows[0]?.name?.trim() || "player";
}

async function insertRound(gameId: string, kind: Kind, n: number, opens: number) {
  const sql = await getSql();
  const seed = randomBytes(32).toString("hex");
  const outcome = buildOutcome(gameId, kind, seed);
  const span = windows(kind, opens, outcome);
  await sql`
    insert into live_rounds (game_id, n, seed, hash, opens_at, locks_at, starts_at, reveal_at, ends_at, outcome, settled)
    values (
      ${gameId},
      ${n},
      ${seed},
      ${hashSeed(seed)},
      ${opens},
      ${span.locks},
      ${span.starts},
      ${span.reveal},
      ${span.ends},
      ${JSON.stringify(outcome)},
      false
    )
    on conflict (game_id, n) do nothing
  `;
  const rows = await sql<RoundRow>`
    select game_id, n, seed, hash, opens_at, locks_at, starts_at, reveal_at, ends_at, outcome, settled
    from live_rounds where game_id = ${gameId} and n = ${n}
  `;
  const row = rows[0];
  if (!row) throw new Error("Live round missing");
  return row;
}

async function settle(row: RoundRow, kind: Kind) {
  const sql = await getSql();
  const claimed = await sql<{ ok: number }>`
    update live_rounds set settled = true
    where game_id = ${row.game_id} and n = ${row.n} and settled = false
    returning 1 as ok
  `;
  if (claimed.length === 0) return;
  const outcome = JSON.parse(row.outcome) as Record<string, unknown> & { floats: number[]; crashAt?: number };
  const open = await sql<{
    id: string;
    user_id: string;
    currency: string;
    amount: string;
    pick: string;
    status: string;
  }>`
    select id, user_id, currency, amount::text, pick, status
    from live_bets
    where game_id = ${row.game_id} and n = ${row.n} and status = 'open'
  `;
  for (const bet of open) {
    const amount = asNumber(bet.amount);
    let payout = 0;
    let multiplier = 0;
    if (kind === "crazy") {
      const drawn = crazyRound(outcome.floats, bet.pick as CrazyBetSpot);
      if (drawn.win) {
        multiplier = drawn.multiplier;
        payout = amount * multiplier;
      }
    } else if (kind === "horse") {
      const horseId = Number(bet.pick);
      if (horseId === Number(outcome.winnerId)) {
        multiplier = oddsFor(horseId);
        payout = amount * multiplier;
      }
    }
    const status = payout > 0 ? "won" : "lost";
    const marked = await sql<{ ok: number }>`
      update live_bets set status = ${status}, payout = ${payout}
      where id = ${bet.id} and status = 'open'
      returning 1 as ok
    `;
    if (marked.length === 0) continue;
    const currency = bet.currency as Currency;
    if (payout > 0) await credit(bet.user_id, currency, payout, "win", row.game_id, "live settle");
    if (amount > 0) {
      void pushSettledBet({
        userId: bet.user_id,
        game: row.game_id,
        amount,
        payout,
        multiplier,
        won: payout > 0,
      });
    }
  }
}

async function tick(gameId: string, now = Date.now()): Promise<RoundRow> {
  const kind = kindOf(gameId);
  const sql = await getSql();
  let rows = await sql<RoundRow>`
    select game_id, n, seed, hash, opens_at, locks_at, starts_at, reveal_at, ends_at, outcome, settled
    from live_rounds where game_id = ${gameId}
    order by n desc
    limit 1
  `;
  let row = rows[0];
  if (!row) return insertRound(gameId, kind, 1, now);
  for (let i = 0; i < 3; i += 1) {
    if (now < num(row.ends_at)) break;
    if (!settledOf(row.settled)) await settle(row, kind);
    const nextOpen = now > num(row.ends_at) + 2_000 ? now : num(row.ends_at);
    row = await insertRound(gameId, kind, num(row.n) + 1, nextOpen);
  }
  if (phaseAt(row, now) === "result" && !settledOf(row.settled)) {
    await settle(row, kind);
    row = { ...row, settled: true };
  }
  return row;
}

async function snapshot(gameId: string, userId: string, now = Date.now()): Promise<LiveSnap> {
  const kind = kindOf(gameId);
  const row = await tick(gameId, now);
  const sql = await getSql();
  const phase = phaseAt(row, now);
  const outcome = JSON.parse(row.outcome) as LiveOutcome & { floats?: number[] };
  const bets = await sql<{
    user_id: string;
    user_name: string;
    currency: string;
    amount: string;
    pick: string;
    status: string;
    cash_mult: string | null;
    payout: string | null;
  }>`
    select user_id, user_name, currency, amount::text, pick, status, cash_mult::text, payout::text
    from live_bets
    where game_id = ${gameId} and n = ${row.n}
    order by created_at asc
    limit 24
  `;
  const past = await sql<{ n: number; outcome: string }>`
    select n, outcome from live_rounds
    where game_id = ${gameId} and settled = true and n < ${row.n}
    order by n desc
    limit 12
  `;
  const youRow = bets.find((b) => b.user_id === userId) ?? null;
  return {
    gameId,
    n: num(row.n),
    phase,
    hash: row.hash,
    seed: phase === "result" ? row.seed : null,
    opensAt: num(row.opens_at),
    locksAt: num(row.locks_at),
    startsAt: num(row.starts_at),
    revealAt: num(row.reveal_at),
    endsAt: num(row.ends_at),
    serverNow: now,
    left: Math.max(0, num(row.locks_at) - now),
    outcome: publicOutcome(kind, phase, outcome),
    bets: bets.map((b) => ({
      name: b.user_name,
      amount: asNumber(b.amount),
      currency: b.currency,
      pick: b.pick,
      status: b.status,
      cashMult: b.cash_mult == null ? null : asNumber(b.cash_mult),
      payout: b.payout == null ? null : asNumber(b.payout),
      mine: b.user_id === userId,
    })),
    you: youRow
      ? {
          status: youRow.status,
          amount: asNumber(youRow.amount),
          payout: youRow.payout == null ? null : asNumber(youRow.payout),
          cashMult: youRow.cash_mult == null ? null : asNumber(youRow.cash_mult),
          pick: youRow.pick,
        }
      : null,
    history: past.map((p) => ({
      n: num(p.n),
      label: historyLabel(kind, JSON.parse(p.outcome) as Record<string, unknown>),
    })),
  };
}

export const liveTable = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator(z.object({ gameId: z.string() }))
  .handler(async ({ context, data }) => snapshot(data.gameId, context.userId));

export const placeLiveBet = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator(
    z.object({
      gameId: z.string(),
      currency: currencySchema,
      amount: z.number().positive(),
      pick: z.string().max(24).default(""),
    }),
  )
  .handler(async ({ context, data }) => {
    const game = getGame(data.gameId);
    const kind = kindOf(data.gameId);
    if (!game) throw new Error("Unknown game");
    if (kind === "horse" && !/^[0-5]$/.test(data.pick)) throw new Error("Pick a horse");
    if (kind === "crazy" && !["1", "2", "5", "10", "coinflip", "cashhunt", "pachinko", "crazy"].includes(data.pick)) {
      throw new Error("Pick a spot");
    }
    const now = Date.now();
    const row = await tick(data.gameId, now);
    if (phaseAt(row, now) !== "betting") throw new Error("Round closed");
    const sql = await getSql();
    const existing = await sql<{ id: string }>`
      select id from live_bets
      where game_id = ${data.gameId} and n = ${row.n} and user_id = ${context.userId}
    `;
    if (existing.length > 0) {
      return { snap: await snapshot(data.gameId, context.userId, now), balances: await snapshotBalances(context.userId) };
    }
    await ensureWallets(context.userId);
    await debit(context.userId, data.currency, data.amount, "bet", game.id, game.title);
    const name = await displayName(context.userId);
    try {
      await sql`
        insert into live_bets (id, game_id, n, user_id, user_name, currency, amount, pick, status)
        values (
          ${newRoundId()},
          ${data.gameId},
          ${row.n},
          ${context.userId},
          ${name},
          ${data.currency},
          ${data.amount},
          ${kind === "crash" ? "" : data.pick},
          'open'
        )
      `;
    } catch (err) {
      await credit(context.userId, data.currency, data.amount, "refund", game.id, "live bet refund");
      throw err;
    }
    return { snap: await snapshot(data.gameId, context.userId), balances: await snapshotBalances(context.userId) };
  });

export const cashLive = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator(z.object({ gameId: z.string() }))
  .handler(async ({ context, data }) => {
    if (kindOf(data.gameId) !== "crash") throw new Error("Not a crash table");
    const now = Date.now();
    const row = await tick(data.gameId, now);
    const phase = phaseAt(row, now);
    const outcome = JSON.parse(row.outcome) as { crashAt: number; growth: number };
    const sql = await getSql();
    const bets = await sql<{ id: string; amount: string; currency: string; status: string }>`
      select id, amount::text, currency, status from live_bets
      where game_id = ${data.gameId} and n = ${row.n} and user_id = ${context.userId}
    `;
    const bet = bets[0];
    if (!bet || bet.status !== "open") throw new Error("No open bet");
    const elapsed = now - num(row.starts_at);
    const current = crashMultiplierAt(elapsed, outcome.growth);
    const crashed = phase !== "running" || current >= outcome.crashAt;
    const amount = asNumber(bet.amount);
    let payout = 0;
    let multiplier = 0;
    if (!crashed) {
      multiplier = current;
      payout = amount * current;
    }
    const marked = await sql<{ ok: number }>`
      update live_bets
      set status = ${crashed ? "lost" : "cashed"}, cash_mult = ${crashed ? null : multiplier}, payout = ${payout}
      where id = ${bet.id} and status = 'open'
      returning 1 as ok
    `;
    if (marked.length === 0) throw new Error("Already settled");
    if (!crashed && payout > 0) {
      await credit(context.userId, bet.currency as Currency, payout, "win", data.gameId, "crash cash out");
    }
    if (amount > 0) {
      void pushSettledBet({
        userId: context.userId,
        game: data.gameId,
        amount,
        payout,
        multiplier,
        won: payout > 0,
      });
    }
    return {
      crashed,
      crashAt: crashed ? outcome.crashAt : null,
      multiplier,
      payout,
      snap: await snapshot(data.gameId, context.userId),
      balances: await snapshotBalances(context.userId),
    };
  });
