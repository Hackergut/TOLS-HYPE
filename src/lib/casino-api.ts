import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { authMiddleware } from "@/lib/auth/middleware";
import { getSql } from "@/lib/db";
import {
  CURRENCIES,
  CURRENCY_META,
  type Currency,
  getGame,
} from "./games-catalog";
import { asNumber } from "./format";
import { takeFair } from "@/lib/fair.server";
import { crashPointFromFloat, diceRoll, pickIndex, uniquePicks } from "@/lib/fair";
import { limboFromFloat, plinkoBucket, plinkoMultipliers, towerBombs, towerMultiplier, TOWER_SETUPS, type TowerMode, type TowerPattern } from "@/lib/originals";
import { liveCrashRound, liveCrazyRound } from "@/lib/live-table";
import { poolMultiplier, simulateBreak, type PoolDiff } from "@/lib/pool-physics";
import { crazyRound, type CrazyBetSpot } from "@/lib/crazy-tols";
import { oddsFor, orderFromFloats } from "@/games/horse-race/game/rtp";
import {
  credit,
  debit,
  ensureWallets,
  readWallet,
  snapshotBalances,
} from "@/lib/wallet.server";
import { pushBridgeEvent, pushSettledBet } from "@/lib/governance/bridge";
import { comboOdds, systemCombos, vigPrice } from "@/lib/odds";
import { resolveOutcome, type MarketKind } from "@/lib/sports-book";
import {
  crashElapsedFor,
  crashMultiplierAt,
  freshShoe,
  handValue,
  isBlackjack,
  newRoundId,
  rouletteColor,
  slotsPayout,
  spinReel,
  type PlayingCard,
  type SlotSymbol,
} from "./rng";

const currencySchema = z.enum(CURRENCIES);

function parseCurrency(value: string): Currency {
  if ((CURRENCIES as readonly string[]).includes(value)) return value as Currency;
  return "USDT";
}

export type WalletSnapshot = {
  balances: Record<Currency, number>;
  wagered: number;
  transactions: {
    id: number;
    type: string;
    amount: number;
    currency: Currency;
    status: string;
    gameId: string | null;
    note: string | null;
    createdAt: string;
  }[];
};

export const getWallet = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .handler(async ({ context }) => {
    return readWallet(context.userId);
  });

export const cashier = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator(
    z.object({
      action: z.enum(["deposit", "withdraw"]),
      currency: currencySchema,
      amount: z.number().positive(),
    }),
  )
  .handler(async ({ context, data }) => {
    await ensureWallets(context.userId);
    const cap = data.currency === "USDT" ? 5000 : data.currency === "ETH" ? 5 : 0.5;
    if (data.amount > cap) throw new Error(`Max ${data.action} is ${cap} ${data.currency}`);
    if (data.action === "deposit") {
      await credit(context.userId, data.currency, data.amount, "deposit");
      void pushBridgeEvent("casino.deposit_confirmed", {
        userId: context.userId,
        amount: data.amount,
        currency: data.currency,
      });
    } else {
      await debit(context.userId, data.currency, data.amount, "withdrawal");
      void pushBridgeEvent("casino.withdrawal_pending", {
        userId: context.userId,
        amount: data.amount,
        currency: data.currency,
      });
    }
    return { balances: await snapshotBalances(context.userId) };
  });

function assertBet(currency: Currency, amount: number) {
  if (amount === 0) return;
  const meta = CURRENCY_META[currency];
  if (amount < meta.minBet) throw new Error(`Minimum bet is ${meta.minBet} ${currency}`);
  if (amount > meta.maxBet) throw new Error(`Maximum bet is ${meta.maxBet} ${currency}`);
}

export type CrazyDetail = {
  wheelIndex: number;
  segment: string;
  segmentLabel: string;
  win: boolean;
  multiplier: number;
  topSlot: { segment: string; multiplier: number } | null;
  bonus:
    | { kind: "coinflip"; blue: number; red: number; side: "blue" | "red" }
    | { kind: "pachinko"; slot: number; value: number; doubles: number }
    | { kind: "cashhunt"; cell: number; value: number }
    | { kind: "crazy"; wheelIndex: number; value: number; doubles: number }
    | null;
};

export type PlayResult = {
  payout: number;
  multiplier: number;
  detail: {
    roll?: number;
    over?: boolean;
    number?: number;
    color?: string;
    reels?: string[];
    crazy?: CrazyDetail;
  };
  balances: Record<Currency, number>;
  fair?: { serverHash: string; clientSeed: string; nonce: number };
};

async function snapshot(userId: string): Promise<Record<Currency, number>> {
  return snapshotBalances(userId);
}

export const playInstant = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator(
    z.object({
      gameId: z.string(),
      currency: currencySchema,
      amount: z.number().min(0),
      choice: z.string().optional(),
      target: z.number().min(0.01).max(1_000_000).optional(),
      rows: z.union([z.literal(8), z.literal(12), z.literal(16)]).optional(),
      risk: z.enum(["low", "medium", "high"]).optional(),
    }),
  )
  .handler(async ({ context, data }): Promise<PlayResult> => {
    const game = getGame(data.gameId);
    if (!game) throw new Error("Unknown game");
    assertBet(data.currency, data.amount);
    await ensureWallets(context.userId);
    if (data.amount > 0) {
      await debit(context.userId, data.currency, data.amount, "bet", game.id, game.title);
    }
    const fair = await takeFair(context.userId, 16);
    const u = fair.floats;

    let payout = 0;
    let multiplier = 0;
    const detail: PlayResult["detail"] = {};

    if (game.kind === "dice") {
      const roll = diceRoll(u[0]!);
      const over = data.choice === "over";
      // The payout table (99/chance) is only honest for chance 2..98. Clamp the
      // TARGET, not the chance: clamping the chance while comparing the raw
      // target let e.g. target=1_000_000 pay 99/98 with an always-true win
      // check (EV > 100%, guaranteed-money exploit).
      const target = Math.min(98, Math.max(2, data.target ?? 50));
      const chance = over ? 100 - target : target;
      const multiplierWin = 99 / chance;
      const win = over ? roll >= target : roll < target;
      multiplier = win ? multiplierWin : 0;
      payout = win ? data.amount * multiplierWin : 0;
      detail.roll = roll;
      detail.over = over;
    } else if (game.kind === "roulette") {
      const number = pickIndex(u[0]!, 37);
      const color = rouletteColor(number);
      const choice = data.choice ?? "red";
      if (choice === "red" || choice === "black") {
        const win = color === choice;
        multiplier = win ? 2 : 0;
        payout = win ? data.amount * 2 : 0;
      } else if (choice === "green") {
        const win = number === 0;
        multiplier = win ? 36 : 0;
        payout = win ? data.amount * 36 : 0;
      } else {
        const n = Number(choice);
        const win = n === number;
        multiplier = win ? 36 : 0;
        payout = win ? data.amount * 36 : 0;
      }
      detail.number = number;
      detail.color = color;
    } else if (game.kind === "slots") {
      const reels: [SlotSymbol, SlotSymbol, SlotSymbol] = [
        spinReel(u[0]),
        spinReel(u[1]),
        spinReel(u[2]),
      ];
      payout = slotsPayout(reels, data.amount);
      multiplier = payout > 0 ? payout / data.amount : 0;
      detail.reels = reels;
    } else if (game.kind === "limbo") {
      const crash = limboFromFloat(u[0]!);
      const target = Math.max(1.01, data.target ?? 2);
      const win = crash >= target;
      multiplier = win ? target : 0;
      payout = win ? data.amount * target : 0;
      detail.roll = crash;
    } else if (game.kind === "plinko") {
      const rows = (data.rows ?? 8) as 8 | 12 | 16;
      const risk = data.risk ?? "medium";
      const table = plinkoMultipliers(rows, risk);
      const bucket = plinkoBucket(u, rows);
      const m = table[Math.min(bucket, table.length - 1)] ?? 0;
      multiplier = m;
      payout = data.amount * m;
      detail.number = bucket;
      detail.roll = m;
    } else if (game.kind === "crazy") {
      const result = crazyRound(u, (data.choice ?? "1") as CrazyBetSpot);
      multiplier = result.win ? result.multiplier : 0;
      payout = result.win ? data.amount * result.multiplier : 0;
      detail.crazy = {
        wheelIndex: result.wheelIndex,
        segment: result.segment,
        segmentLabel: result.segmentLabel,
        win: result.win,
        multiplier: result.multiplier,
        topSlot: result.topSlot,
        bonus: result.bonus,
      };
    } else if (game.kind === "crash") {
      throw new Error("Use startCrash for this game");
    } else if (game.kind === "blackjack") {
      throw new Error("Use dealBlackjack for this game");
    } else if (game.kind === "mines" || game.kind === "keno" || game.kind === "hilo" || game.kind === "pool" || game.kind === "tower" || game.kind === "horse") {
      throw new Error("Use the dedicated play function for this game");
    }

    if (payout > 0 && data.amount > 0) {
      await credit(context.userId, data.currency, payout, "win", game.id, game.title);
    }
    if (data.amount > 0) {
      void pushSettledBet({
        userId: context.userId,
        game: game.id,
        amount: data.amount,
        payout,
        multiplier,
        won: payout > 0,
      });
    }
    return { payout, multiplier, detail, balances: await snapshot(context.userId), fair };
  });

export const placeSportBet = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator(
    z.object({
      amount: z.number().min(0),
      currency: currencySchema,
      mode: z.enum(["single", "combo", "system"]),
      systemK: z.number().int().min(2).max(6).optional(),
      legs: z
        .array(
          z.object({
            eventId: z.string(),
            market: z.enum(["ml", "spread", "total", "btts", "dc", "oe", "dnb", "cs"]),
            selection: z.string(),
          }),
        )
        .min(1)
        .max(12),
    }),
  )
  .handler(async ({ context, data }) => {
    assertBet(data.currency, data.amount);
    await ensureWallets(context.userId);
    const resolved = data.legs.map((leg) => {
      const o = resolveOutcome(leg.eventId, leg.market as MarketKind, leg.selection);
      if (!o) throw new Error("Market closed");
      return o;
    });

    if (data.mode === "system") {
      const k = Math.min(data.systemK ?? 2, resolved.length - 1);
      if (k < 2 || resolved.length <= k) throw new Error("System needs more legs");
      const combos = systemCombos(resolved.length, k);
      const fair = await takeFair(context.userId, combos.length);
      const stakeEach = data.amount / combos.length;
      let payout = 0;
      let hits = 0;
      await debit(context.userId, data.currency, data.amount, "bet", resolved[0]!.eventId, `sports-system-${k}-${resolved.length}`);
      for (let c = 0; c < combos.length; c++) {
        const combo = combos[c]!;
        const price = comboOdds(combo.map((i) => resolved[i]!.odds));
        if (fair.floats[c]! < vigPrice(price)) {
          hits += 1;
          const won = stakeEach * price;
          payout += won;
        }
      }
      if (payout > 0) {
        await credit(context.userId, data.currency, payout, "win", resolved[0]!.eventId, `sports-system-${k}-${resolved.length}`);
      }
      if (data.amount > 0) {
        void pushSettledBet({
          userId: context.userId,
          game: "sports-system",
          amount: data.amount,
          payout,
          multiplier: data.amount > 0 ? payout / data.amount : 0,
          won: payout > 0,
        });
      }
      return {
        mode: "system" as const,
        price: null as number | null,
        systemK: k,
        combos: combos.length,
        hits,
        payout,
        balances: await snapshot(context.userId),
      };
    }

    const fair = await takeFair(context.userId, data.mode === "combo" ? 1 : resolved.length);

    if (data.mode === "combo") {
      const price = comboOdds(resolved.map((o) => o.odds));
      await debit(context.userId, data.currency, data.amount, "bet", resolved[0]!.eventId, "sports-acca");
      const win = fair.floats[0]! < vigPrice(price);
      const payout = win ? data.amount * price : 0;
      if (payout > 0) {
        await credit(context.userId, data.currency, payout, "win", resolved[0]!.eventId, "sports-acca");
      }
      return {
        mode: "combo" as const,
        price,
        hits: win ? resolved.length : 0,
        payout,
        balances: await snapshot(context.userId),
      };
    }

    let hits = 0;
    let payout = 0;
    for (let i = 0; i < resolved.length; i++) {
      const o = resolved[i]!;
      await debit(context.userId, data.currency, data.amount, "bet", o.eventId, o.marketLabel);
      const win = fair.floats[i]! < vigPrice(o.odds);
      if (win) {
        hits += 1;
        const won = data.amount * o.odds;
        payout += won;
        await credit(context.userId, data.currency, won, "win", o.eventId, o.marketLabel);
      }
    }
    return {
      mode: "single" as const,
      price: null as number | null,
      hits,
      payout,
      balances: await snapshot(context.userId),
    };
  });

type CrashPayload = {
  crashAt: number;
  startedAt: number;
};

export const startCrash = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator(
    z.object({
      gameId: z.string(),
      currency: currencySchema,
      amount: z.number().min(0),
    }),
  )
  .handler(async ({ context, data }) => {
    const game = getGame(data.gameId);
    if (!game || game.kind !== "crash") throw new Error("Not a crash game");
    assertBet(data.currency, data.amount);
    await ensureWallets(context.userId);
    const live = liveCrashRound(Date.now(), game.id, game.edge);
    if (live.phase === "crashed" || (live.phase === "running" && live.elapsed > 2500)) {
      throw new Error("Round already flying");
    }
    if (data.amount > 0) {
      await debit(context.userId, data.currency, data.amount, "bet", game.id, game.title);
    }
    const id = newRoundId();
    const payload: CrashPayload = {
      crashAt: live.crashAt,
      startedAt: live.startedAt,
    };
    const sql = await getSql();
    await sql`
      insert into game_rounds (id, user_id, game_id, status, bet_amount, currency, payload)
      values (${id}, ${context.userId}, ${game.id}, 'open', ${data.amount}, ${data.currency}, ${JSON.stringify(payload)})
    `;
    return { roundId: id, startedAt: payload.startedAt };
  });

export const cashOutCrash = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator(z.object({ roundId: z.string() }))
  .handler(async ({ context, data }) => {
    const sql = await getSql();
    const rows = await sql<{
      id: string;
      user_id: string;
      game_id: string;
      status: string;
      bet_amount: string;
      currency: string;
      payload: string;
    }>`
      select id, user_id, game_id, status, bet_amount, currency, payload
      from game_rounds
      where id = ${data.roundId} and user_id = ${context.userId}
    `;
    const round = rows[0];
    if (!round) throw new Error("Round not found");
    if (round.status !== "open") throw new Error("Round already settled");
    const payload = JSON.parse(round.payload) as CrashPayload;
    const elapsed = Date.now() - payload.startedAt;
    const current = crashMultiplierAt(elapsed);
    const crashed = current >= payload.crashAt;
    const bet = asNumber(round.bet_amount);
    const currency = parseCurrency(round.currency);
    let payout = 0;
    let multiplier = 0;
    // Claim the settle atomically (returns a row only when we win the flip) so
    // two concurrent cash-outs can never both credit the payout.
    const claimed = await sql<{ ok: number }>`
      update game_rounds set status = 'settled', payload = ${JSON.stringify({
        ...payload,
        cashedAt: current,
        crashed,
      })}
      where id = ${round.id} and user_id = ${context.userId} and status = 'open'
      returning 1 as ok
    `;
    if (claimed.length === 0) throw new Error("Round already settled");
    if (!crashed) {
      multiplier = current;
      payout = bet * current;
      await credit(context.userId, currency, payout, "win", round.game_id, "crash cash out");
    }
    if (bet > 0) {
      void pushSettledBet({
        userId: context.userId,
        game: round.game_id,
        amount: bet,
        payout,
        multiplier,
        won: payout > 0,
      });
    }
    return {
      crashed,
      crashAt: payload.crashAt,
      multiplier,
      payout,
      balances: await snapshot(context.userId),
    };
  });

export const peekCrash = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator(z.object({ roundId: z.string() }))
  .handler(async ({ context, data }) => {
    const sql = await getSql();
    const rows = await sql<{
      payload: string;
      status: string;
      bet_amount: string;
      game_id: string;
      user_id: string;
    }>`
      select payload, status, bet_amount, game_id, user_id from game_rounds
      where id = ${data.roundId} and user_id = ${context.userId}
    `;
    const round = rows[0];
    if (!round) throw new Error("Round not found");
    const payload = JSON.parse(round.payload) as CrashPayload;
    const elapsed = Date.now() - payload.startedAt;
    const current = crashMultiplierAt(elapsed);
    if (current >= payload.crashAt) {
      if (round.status === "open") {
        const claimed = await sql<{ ok: number }>`
          update game_rounds set status = 'settled'
          where id = ${data.roundId} and user_id = ${context.userId} and status = 'open'
          returning 1 as ok
        `;
        const bet = asNumber(round.bet_amount);
        if (claimed.length > 0 && bet > 0) {
          void pushSettledBet({
            userId: round.user_id,
            game: round.game_id,
            amount: bet,
            payout: 0,
            multiplier: 0,
            won: false,
          });
        }
      }
      return { crashed: true, crashAt: payload.crashAt };
    }
    return { crashed: false, crashAt: null };
  });

export const playCrazyLive = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator(
    z.object({
      gameId: z.string(),
      currency: currencySchema,
      amount: z.number().min(0),
      spot: z.string(),
      slot: z.number().int(),
    }),
  )
  .handler(async ({ context, data }) => {
    const game = getGame(data.gameId);
    if (!game || game.kind !== "crazy") throw new Error("Not crazy tols");
    const live = liveCrazyRound(Date.now(), data.spot as "1");
    if (live.slot !== data.slot || live.phase === "result") throw new Error("Round closed");
    assertBet(data.currency, data.amount);
    await ensureWallets(context.userId);
    if (data.amount > 0) {
      await debit(context.userId, data.currency, data.amount, "bet", game.id, game.title);
    }
    const result = liveCrazyRound(Date.now(), data.spot as "1").result;
    const multiplier = result.win ? result.multiplier : 0;
    const payout = data.amount * multiplier;
    if (payout > 0 && data.amount > 0) {
      await credit(context.userId, data.currency, payout, "win", game.id, game.title);
    }
    if (data.amount > 0) {
      void pushSettledBet({
        userId: context.userId,
        game: game.id,
        amount: data.amount,
        payout,
        multiplier,
        won: payout > 0,
      });
    }
    return { result, payout, multiplier, balances: await snapshot(context.userId), slot: live.slot };
  });

export const playHorse = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator(
    z.object({
      gameId: z.string(),
      currency: currencySchema,
      amount: z.number().min(0),
      horseId: z.number().int().min(0).max(5),
    }),
  )
  .handler(async ({ context, data }) => {
    const game = getGame(data.gameId);
    if (!game || game.kind !== "horse") throw new Error("Not a horse race");
    assertBet(data.currency, data.amount);
    await ensureWallets(context.userId);
    if (data.amount > 0) {
      await debit(context.userId, data.currency, data.amount, "bet", game.id, game.title);
    }
    const fair = await takeFair(context.userId, 8);
    const outcome = orderFromFloats(fair.floats, 6);
    const odds = oddsFor(data.horseId);
    const win = data.amount > 0 && outcome.winnerId === data.horseId;
    const multiplier = win ? odds : 0;
    const payout = win ? data.amount * odds : 0;
    if (payout > 0) {
      await credit(context.userId, data.currency, payout, "win", game.id, game.title);
    }
    if (data.amount > 0) {
      void pushSettledBet({
        userId: context.userId,
        game: game.id,
        amount: data.amount,
        payout,
        multiplier,
        won: payout > 0,
      });
    }
    return {
      winnerId: outcome.winnerId,
      order: outcome.order,
      margins: outcome.margins,
      photoFinish: outcome.photoFinish,
      horseId: data.horseId,
      odds,
      payout,
      multiplier,
      balances: await snapshot(context.userId),
      fair: { serverHash: fair.serverHash, clientSeed: fair.clientSeed, nonce: fair.nonce },
    };
  });

type MinesPayload = {
  mines: number[];
  revealed: number[];
  mineCount: number;
  size: number;
};

function minesMultiplier(revealed: number, mineCount: number, size: number): number {
  let m = 1;
  for (let i = 0; i < revealed; i += 1) {
    const remaining = size - i;
    const safe = remaining - mineCount;
    m *= remaining / safe;
  }
  return Math.floor(m * 0.97 * 100) / 100;
}

export const startMines = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator(
    z.object({
      gameId: z.string(),
      currency: currencySchema,
      amount: z.number().min(0),
      mineCount: z.number().int().min(1).max(24).optional(),
    }),
  )
  .handler(async ({ context, data }) => {
    const game = getGame(data.gameId);
    if (!game || game.kind !== "mines") throw new Error("Not a mines game");
    assertBet(data.currency, data.amount);
    await ensureWallets(context.userId);
    await debit(context.userId, data.currency, data.amount, "bet", game.id, game.title);
    const size = 25;
    const mineCount = data.mineCount ?? 3;
    const fair = await takeFair(context.userId, 32);
    const mines: number[] = [];
    let i = 0;
    while (mines.length < mineCount && i < fair.floats.length * 4) {
      const n = pickIndex((fair.floats[i % fair.floats.length]! + i * 0.17) % 1, size);
      i += 1;
      if (!mines.includes(n)) mines.push(n);
    }
    const payload: MinesPayload = { mines, revealed: [], mineCount, size };
    const id = newRoundId();
    const sql = await getSql();
    await sql`
      insert into game_rounds (id, user_id, game_id, status, bet_amount, currency, payload)
      values (${id}, ${context.userId}, ${game.id}, 'open', ${data.amount}, ${data.currency}, ${JSON.stringify(payload)})
    `;
    return { roundId: id, size, mineCount };
  });

export const revealMine = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator(z.object({ roundId: z.string(), index: z.number().int().min(0).max(24) }))
  .handler(async ({ context, data }) => {
    const sql = await getSql();
    const rows = await sql<{
      payload: string;
      status: string;
      bet_amount: string;
      currency: string;
      game_id: string;
    }>`
      select payload, status, bet_amount, currency, game_id
      from game_rounds
      where id = ${data.roundId} and user_id = ${context.userId}
    `;
    const round = rows[0];
    if (!round || round.status !== "open") throw new Error("Round not open");
    const payload = JSON.parse(round.payload) as MinesPayload;
    if (payload.revealed.includes(data.index)) {
      return { hit: false, revealed: payload.revealed, multiplier: minesMultiplier(payload.revealed.length, payload.mineCount, payload.size), boom: false, mines: null };
    }
    const hit = payload.mines.includes(data.index);
    if (hit) {
      const settled = await sql<{ ok: number }>`
        update game_rounds set status = 'settled', payload = ${JSON.stringify({
          ...payload,
          revealed: [...payload.revealed, data.index],
        })}
        where id = ${data.roundId} and user_id = ${context.userId} and status = 'open'
        returning 1 as ok
      `;
      if (settled.length === 0) throw new Error("Round not open");
      return {
        hit: true,
        boom: true,
        revealed: [...payload.revealed, data.index],
        mines: payload.mines,
        multiplier: 0,
        payout: 0,
        balances: await snapshot(context.userId),
      };
    }
    payload.revealed.push(data.index);
    const multiplier = minesMultiplier(payload.revealed.length, payload.mineCount, payload.size);
    const updated = await sql<{ ok: number }>`
      update game_rounds set payload = ${JSON.stringify(payload)}
      where id = ${data.roundId} and user_id = ${context.userId} and status = 'open'
      returning 1 as ok
    `;
    if (updated.length === 0) throw new Error("Round not open");
    return {
      hit: false,
      boom: false,
      revealed: payload.revealed,
      mines: null,
      multiplier,
    };
  });

export const cashOutMines = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator(z.object({ roundId: z.string() }))
  .handler(async ({ context, data }) => {
    const sql = await getSql();
    const rows = await sql<{
      payload: string;
      status: string;
      bet_amount: string;
      currency: string;
      game_id: string;
    }>`
      select payload, status, bet_amount, currency, game_id
      from game_rounds
      where id = ${data.roundId} and user_id = ${context.userId}
    `;
    const round = rows[0];
    if (!round || round.status !== "open") throw new Error("Round not open");
    const payload = JSON.parse(round.payload) as MinesPayload;
    if (payload.revealed.length === 0) throw new Error("Reveal a tile first");
    // Claim the settle atomically before crediting — concurrent cash-outs must
    // not both pay out.
    const claimed = await sql<{ ok: number }>`
      update game_rounds set status = 'settled', payload = ${JSON.stringify({ ...payload, cashed: true })}
      where id = ${data.roundId} and user_id = ${context.userId} and status = 'open'
      returning 1 as ok
    `;
    if (claimed.length === 0) throw new Error("Round already settled");
    const multiplier = minesMultiplier(payload.revealed.length, payload.mineCount, payload.size);
    const payout = asNumber(round.bet_amount) * multiplier;
    await credit(
      context.userId,
      parseCurrency(round.currency),
      payout,
      "win",
      round.game_id,
      "mines cash out",
    );
    return {
      multiplier,
      payout,
      mines: payload.mines,
      balances: await snapshot(context.userId),
    };
  });

type BjPayload = {
  shoe: PlayingCard[];
  player: PlayingCard[];
  dealer: PlayingCard[];
};

export const dealBlackjack = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator(
    z.object({
      gameId: z.string(),
      currency: currencySchema,
      amount: z.number().min(0),
    }),
  )
  .handler(async ({ context, data }) => {
    const game = getGame(data.gameId);
    if (!game || game.kind !== "blackjack") throw new Error("Not blackjack");
    assertBet(data.currency, data.amount);
    await ensureWallets(context.userId);
    await debit(context.userId, data.currency, data.amount, "bet", game.id, game.title);
    const fair = await takeFair(context.userId, 80);
    const shoe = freshShoe(4, fair.floats);
    const player = [shoe.pop()!, shoe.pop()!];
    const dealer = [shoe.pop()!, shoe.pop()!];
    const payload: BjPayload = { shoe, player, dealer };
    const id = newRoundId();
    const sql = await getSql();

    const playerBj = isBlackjack(player);
    const dealerBj = isBlackjack(dealer);
    if (playerBj || dealerBj) {
      let payout = 0;
      let outcome: "blackjack" | "lose" | "push" = "lose";
      if (playerBj && dealerBj) {
        payout = data.amount;
        outcome = "push";
      } else if (playerBj) {
        payout = data.amount * 2.5;
        outcome = "blackjack";
      }
      if (payout > 0) {
        await credit(context.userId, data.currency, payout, "win", game.id, outcome);
      }
      await sql`
        insert into game_rounds (id, user_id, game_id, status, bet_amount, currency, payload)
        values (${id}, ${context.userId}, ${game.id}, 'settled', ${data.amount}, ${data.currency}, ${JSON.stringify(payload)})
      `;
      return {
        roundId: id,
        player,
        dealer,
        status: "settled" as const,
        outcome,
        payout,
        playerTotal: handValue(player).total,
        dealerTotal: handValue(dealer).total,
        holeHidden: false,
        balances: await snapshot(context.userId),
      };
    }

    await sql`
      insert into game_rounds (id, user_id, game_id, status, bet_amount, currency, payload)
      values (${id}, ${context.userId}, ${game.id}, 'open', ${data.amount}, ${data.currency}, ${JSON.stringify(payload)})
    `;
    return {
      roundId: id,
      player,
      dealer: [dealer[0]!],
      holeHidden: true,
      status: "open" as const,
      outcome: null,
      payout: 0,
      playerTotal: handValue(player).total,
      dealerTotal: handValue([dealer[0]!]).total,
      balances: await snapshot(context.userId),
    };
  });

export const blackjackAction = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator(z.object({ roundId: z.string(), action: z.enum(["hit", "stand", "double"]) }))
  .handler(async ({ context, data }) => {
    const sql = await getSql();
    // Claim the round exclusively for this action: concurrent hit/stand/double
    // requests (or a settle) fail the claim instead of interleaving — without
    // it, racing "double"+"stand" could double-debit AND double-settle.
    // `lockedAt` (written atomically with the claim) makes a lock left behind
    // by a crashed server reclaimable: blackjack actions take well under a
    // second, so a lock older than the TTL means its owner is gone.
    const nowMs = Date.now();
    const LOCK_STALE_MS = 2 * 60 * 1000;
    const claim = await sql<{ ok: number }>`
      update game_rounds set status = 'locked', payload = (payload::jsonb || jsonb_build_object('lockedAt', ${nowMs}::bigint))::text
      where id = ${data.roundId} and user_id = ${context.userId}
        and (
          status = 'open'
          or (status = 'locked' and coalesce((payload::jsonb->>'lockedAt')::bigint, 0) < ${nowMs - LOCK_STALE_MS})
        )
      returning 1 as ok
    `;
    if (claim.length === 0) throw new Error("Round not open");
    const release = () =>
      sql`
        update game_rounds set status = 'open'
        where id = ${data.roundId} and user_id = ${context.userId} and status = 'locked'
      `;
    try {
      const rows = await sql<{
        payload: string;
        status: string;
        bet_amount: string;
        currency: string;
        game_id: string;
      }>`
        select payload, status, bet_amount, currency, game_id
        from game_rounds
        where id = ${data.roundId} and user_id = ${context.userId}
      `;
      const round = rows[0];
      if (!round) throw new Error("Round not open");
      const payload = JSON.parse(round.payload) as BjPayload;
      let bet = asNumber(round.bet_amount);
      const currency = parseCurrency(round.currency);

      const settle = async (outcome: string, payout: number) => {
        if (payout > 0) {
          await credit(context.userId, currency, payout, "win", round.game_id, outcome);
        }
        await sql`
          update game_rounds set status = 'settled', payload = ${JSON.stringify(payload)}
          where id = ${data.roundId} and user_id = ${context.userId} and status = 'locked'
        `;
        return {
          player: payload.player,
          dealer: payload.dealer,
          holeHidden: false,
          status: "settled" as const,
          outcome,
          payout,
          playerTotal: handValue(payload.player).total,
          dealerTotal: handValue(payload.dealer).total,
          balances: await snapshot(context.userId),
        };
      };

      if (data.action === "double") {
        if (payload.player.length !== 2) throw new Error("Double only on first two cards");
        // On insufficient balance this throws and the outer catch releases.
        await debit(context.userId, currency, bet, "bet", round.game_id, "double");
        bet *= 2;
        payload.player.push(payload.shoe.pop()!);
        await sql`
          update game_rounds set bet_amount = ${bet}, payload = ${JSON.stringify(payload)}
          where id = ${data.roundId} and user_id = ${context.userId} and status = 'locked'
        `;
        if (handValue(payload.player).total > 21) return settle("bust", 0);
      } else if (data.action === "hit") {
        payload.player.push(payload.shoe.pop()!);
        const v = handValue(payload.player).total;
        if (v > 21) return settle("bust", 0);
        await sql`
          update game_rounds set payload = ${JSON.stringify(payload)}
          where id = ${data.roundId} and user_id = ${context.userId} and status = 'locked'
        `;
        await release();
        return {
          player: payload.player,
          dealer: [payload.dealer[0]!],
          holeHidden: true,
          status: "open" as const,
          outcome: null,
          payout: 0,
          playerTotal: v,
          dealerTotal: handValue([payload.dealer[0]!]).total,
          balances: await snapshot(context.userId),
        };
      }

      while (handValue(payload.dealer).total < 17) {
        payload.dealer.push(payload.shoe.pop()!);
      }
      const p = handValue(payload.player).total;
      const d = handValue(payload.dealer).total;
      if (d > 21 || p > d) return settle("win", bet * 2);
      if (p === d) return settle("push", bet);
      return settle("lose", 0);
    } catch (e) {
      // The claim must not wedge the round: release it on any failure path.
      await release().catch(() => undefined);
      throw e;
    }
  });

const KENO_PAY: Record<number, number[]> = {
  1: [0, 3.8],
  2: [0, 1.8, 4.6],
  3: [0, 1, 3, 10],
  4: [0, 0.7, 1.8, 5, 22],
  5: [0, 0.4, 1.4, 3.2, 12, 48],
  6: [0, 0, 1.1, 2.4, 8, 28, 90],
  7: [0, 0, 0.8, 1.8, 5, 16, 50, 200],
  8: [0, 0, 0.5, 1.4, 3.5, 10, 30, 100, 400],
  9: [0, 0, 0.4, 1.1, 2.5, 7, 20, 60, 250, 800],
  10: [0, 0, 0.3, 0.9, 2, 5, 14, 40, 150, 500, 1200],
};

const RISK_MULT = { classic: 1, low: 0.7, normie: 1.25, degen: 1.7 } as const;

function drawUnique(count: number, max: number): number[] {
  const out: number[] = [];
  while (out.length < count) {
    const n = 1 + Math.floor(Math.random() * max);
    if (!out.includes(n)) out.push(n);
  }
  return out;
}

export const playKeno = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator(
    z.object({
      gameId: z.string(),
      currency: currencySchema,
      amount: z.number().min(0),
      picks: z.array(z.number().int().min(1).max(40)).min(1).max(10),
      risk: z.enum(["classic", "low", "normie", "degen"]),
    }),
  )
  .handler(async ({ context, data }) => {
    const game = getGame(data.gameId);
    if (!game || game.kind !== "keno") throw new Error("Not keno");
    const picks = [...new Set(data.picks)];
    if (picks.length < 1 || picks.length > 10) throw new Error("Pick 1–10 numbers");
    assertBet(data.currency, data.amount);
    await ensureWallets(context.userId);
    await debit(context.userId, data.currency, data.amount, "bet", game.id, game.title);
    const fair = await takeFair(context.userId, 16);
    const drawn = uniquePicks(fair.floats, 10, 40);
    const hits = picks.filter((n) => drawn.includes(n)).length;
    const table = KENO_PAY[picks.length] ?? [0];
    const base = table[hits] ?? 0;
    const multiplier = base * RISK_MULT[data.risk];
    const payout = data.amount * multiplier;
    if (payout > 0) {
      await credit(context.userId, data.currency, payout, "win", game.id, game.title);
    }
    return { drawn, hits, multiplier, payout, balances: await snapshot(context.userId) };
  });

type HiloCard = { rank: number; suit: "♠" | "♥" | "♦" | "♣" };
const HILO_SUITS: HiloCard["suit"][] = ["♠", "♥", "♦", "♣"];

function readPayload<T>(raw: unknown): T {
  if (typeof raw === "string") return JSON.parse(raw) as T;
  return raw as T;
}

function drawHilo(u0: number, u1: number): HiloCard {
  return {
    rank: 1 + pickIndex(u0, 13),
    suit: HILO_SUITS[pickIndex(u1, 4)]!,
  };
}

export const startHilo = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator(z.object({ gameId: z.string() }))
  .handler(async ({ context, data }) => {
    const game = getGame(data.gameId);
    if (!game || game.kind !== "hilo") throw new Error("Not hi-lo");
    const fair = await takeFair(context.userId, 2);
    const card = drawHilo(fair.floats[0]!, fair.floats[1]!);
    const id = newRoundId();
    const sql = await getSql();
    await sql`
      insert into game_rounds (id, user_id, game_id, status, bet_amount, currency, payload)
      values (${id}, ${context.userId}, ${game.id}, 'open', ${0}, ${"USDT"}, ${JSON.stringify({ card })})
    `;
    return { roundId: id, card };
  });

export const playHilo = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator(
    z.object({
      roundId: z.string(),
      currency: currencySchema,
      amount: z.number().min(0),
      pick: z.enum(["higher", "lower"]),
    }),
  )
  .handler(async ({ context, data }) => {
    const sql = await getSql();
    const rows = await sql<{ payload: string; status: string; game_id: string }>`
      select payload, status, game_id from game_rounds
      where id = ${data.roundId} and user_id = ${context.userId}
    `;
    const round = rows[0];
    if (!round || round.status !== "open") throw new Error("Round not open");
    const payload = readPayload<HiloPayload>(round.payload);
    if (!payload?.card) throw new Error("No card in play");
    const current = payload.card;
    const wasLive = payload.live === true;
    if (!payload.live) {
      assertBet(data.currency, data.amount);
      await ensureWallets(context.userId);
      await debit(context.userId, data.currency, data.amount, "bet", round.game_id, "hilo");
      payload.live = true;
      payload.amount = data.amount;
      payload.currency = data.currency;
      payload.multiplier = 1;
    }
    const fair = await takeFair(context.userId, 2);
    const next = drawHilo(fair.floats[0]!, fair.floats[1]!);
    const win =
      data.pick === "higher" ? next.rank >= current.rank : next.rank <= current.rank;
    const p = data.pick === "higher" ? (14 - current.rank) / 13 : current.rank / 13;
    const step = 0.99 / p;
    if (win) {
      payload.multiplier = (payload.multiplier ?? 1) * step;
      payload.card = next;
    } else {
      payload.live = false;
      payload.multiplier = 0;
      payload.card = next;
    }
    // Guard on the live state we read (fresh rounds have no live key) so a
    // concurrent cash-out flipping live=false cannot be overwritten back to
    // live=true here — that would resurrect a paid-out round.
    const updated = await sql<{ ok: number }>`
      update game_rounds
      set payload = ${JSON.stringify(payload)}, bet_amount = ${payload.amount ?? data.amount}, currency = ${payload.currency ?? data.currency}
      where id = ${data.roundId} and user_id = ${context.userId}
        and status = 'open'
        and coalesce(payload::jsonb->>'live', 'false') = ${wasLive ? "true" : "false"}
      returning 1 as ok
    `;
    if (updated.length === 0) throw new Error("Round state changed — reload");
    return {
      previous: current,
      card: next,
      win,
      live: Boolean(payload.live),
      multiplier: payload.multiplier ?? 0,
      payout: 0,
      step,
      balances: await snapshot(context.userId),
    };
  });

type HiloPayload = {
  card: HiloCard;
  live?: boolean;
  amount?: number;
  currency?: Currency;
  multiplier?: number;
};

export const cashOutHilo = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator(z.object({ roundId: z.string() }))
  .handler(async ({ context, data }) => {
    const sql = await getSql();
    const rows = await sql<{ payload: string; status: string; game_id: string; bet_amount: string; currency: string }>`
      select payload, status, game_id, bet_amount, currency from game_rounds
      where id = ${data.roundId} and user_id = ${context.userId}
    `;
    const round = rows[0];
    if (!round || round.status !== "open") throw new Error("Round not open");
    const payload = readPayload<HiloPayload>(round.payload);
    if (!payload.live) throw new Error("Nothing to cash out");
    // Flip live=false atomically (jsonb guard on the stored payload) so a
    // concurrent cash-out cannot also credit — then pay only the winner.
    const claimed = await sql<{ ok: number }>`
      update game_rounds set payload = ${JSON.stringify({
        ...payload,
        live: false,
        multiplier: 1,
      })}
      where id = ${data.roundId} and user_id = ${context.userId}
        and status = 'open' and payload::jsonb->>'live' = 'true'
      returning 1 as ok
    `;
    if (claimed.length === 0) throw new Error("Nothing to cash out");
    const multiplier = payload.multiplier ?? 1;
    const amount = payload.amount ?? asNumber(round.bet_amount);
    const currency = payload.currency ?? parseCurrency(round.currency);
    const payout = amount * multiplier;
    if (payout > 0) {
      await credit(context.userId, currency, payout, "win", round.game_id, "hilo cash out");
    }
    return { payout, multiplier, card: payload.card, balances: await snapshot(context.userId) };
  });

export const playPool = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator(
    z.object({
      gameId: z.string(),
      currency: currencySchema,
      amount: z.number().min(0),
      difficulty: z.enum(["beginner", "intermediate", "expert", "pro"]),
      power: z.number().min(0).max(1),
      aim: z.number(),
    }),
  )
  .handler(async ({ context, data }) => {
    const game = getGame(data.gameId);
    if (!game || game.kind !== "pool") throw new Error("Not pool");
    assertBet(data.currency, data.amount);
    await ensureWallets(context.userId);
    await debit(context.userId, data.currency, data.amount, "bet", game.id, game.title);
    const fair = await takeFair(context.userId, 32);
    const sim = simulateBreak({
      power: data.power,
      aimDeg: data.aim,
      floats: fair.floats,
      difficulty: data.difficulty as PoolDiff,
    });
    const multiplier = poolMultiplier(sim.balls, sim.scratch);
    const payout = data.amount * multiplier;
    if (payout > 0) {
      await credit(context.userId, data.currency, payout, "win", game.id, game.title);
    }
    if (data.amount > 0) {
      void pushSettledBet({
        userId: context.userId,
        game: game.id,
        amount: data.amount,
        payout,
        multiplier,
        won: payout > 0,
      });
    }
    return {
      balls: sim.balls,
      pocketed: sim.pocketed,
      scratch: sim.scratch,
      multiplier,
      payout,
      floats: fair.floats,
      fair: { serverHash: fair.serverHash, clientSeed: fair.clientSeed, nonce: fair.nonce },
      balances: await snapshot(context.userId),
    };
  });

export type GameWinRow = {
  id: number;
  user: string;
  payout: number;
  currency: Currency;
  multiplier: number | null;
};

export const listGameWins = createServerFn({ method: "GET" })
  .validator(
    z.object({
      gameId: z.string(),
      window: z.enum(["24h", "7d", "30d"]),
      sort: z.enum(["luckiest", "highest"]),
    }),
  )
  .handler(async ({ data }): Promise<GameWinRow[]> => {
    const sql = await getSql();
    const interval =
      data.window === "24h" ? "24 hours" : data.window === "7d" ? "7 days" : "30 days";
    const rows = await sql<{
      id: number;
      amount: string;
      currency: string;
      user_id: string;
      name: string | null;
    }>`
      select t.id, t.amount, t.currency, t.user_id, u.name
      from transactions t
      left join "user" u on u.id = t.user_id
      where t.type = 'win'
        and t.game_id = ${data.gameId}
        and t.created_at > now() - ${interval}::interval
      order by t.amount desc
      limit 10
    `;
    return rows.map((r) => ({
      id: r.id,
      user: r.name?.trim() || r.user_id.slice(0, 8),
      payout: asNumber(r.amount),
      currency: parseCurrency(r.currency),
      multiplier: null,
    }));
  });

type TowerPayload = {
  bombs: number[][];
  row: number;
  cols: number;
  rows: number;
  mode: TowerMode;
  pattern: TowerPattern;
};

export const startTower = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator(
    z.object({
      gameId: z.string(),
      currency: currencySchema,
      amount: z.number().min(0),
      mode: z.enum(["easy", "medium", "hard", "expert", "master"]).default("medium"),
      pattern: z.enum(["classic", "snake", "mirror", "edges"]).default("classic"),
    }),
  )
  .handler(async ({ context, data }) => {
    const game = getGame(data.gameId);
    if (!game || game.kind !== "tower") throw new Error("Not a tower game");
    assertBet(data.currency, data.amount);
    await ensureWallets(context.userId);
    const setup = TOWER_SETUPS[data.mode];
    if (data.amount > 0) {
      await debit(context.userId, data.currency, data.amount, "bet", game.id, game.title);
    }
    const fair = await takeFair(context.userId, setup.rows * setup.bombs + 2);
    const bombs = towerBombs(fair.floats, setup.cols, setup.bombs, setup.rows, data.pattern);
    const payload: TowerPayload = {
      bombs,
      row: 0,
      cols: setup.cols,
      rows: setup.rows,
      mode: data.mode,
      pattern: data.pattern,
    };
    const id = newRoundId();
    const sql = await getSql();
    await sql`
      insert into game_rounds (id, user_id, game_id, status, bet_amount, currency, payload)
      values (${id}, ${context.userId}, ${game.id}, 'open', ${data.amount}, ${data.currency}, ${JSON.stringify(payload)})
    `;
    return { roundId: id, rows: setup.rows, cols: setup.cols, multiplier: 1 };
  });

export const pickTower = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator(z.object({ roundId: z.string(), col: z.number().int().min(0).max(3) }))
  .handler(async ({ context, data }) => {
    const sql = await getSql();
    const rows = await sql<{
      payload: string;
      status: string;
      bet_amount: string;
      currency: string;
      game_id: string;
    }>`
      select payload, status, bet_amount, currency, game_id
      from game_rounds
      where id = ${data.roundId} and user_id = ${context.userId}
    `;
    const round = rows[0];
    if (!round || round.status !== "open") throw new Error("Round not open");
    const payload = JSON.parse(round.payload) as TowerPayload;
    const rowBombs = payload.bombs[payload.row] ?? [];
    const hit = rowBombs.includes(data.col);
    const nextRow = payload.row + 1;
    const bombsN = payload.bombs[0]?.length || 1;
    const claimed = await sql<{ ok: number }>`
      update game_rounds set status = ${hit || nextRow >= payload.rows ? "settled" : "open"}, payload = ${JSON.stringify({ ...payload, row: nextRow })}
      where id = ${data.roundId} and user_id = ${context.userId}
        and status = 'open' and payload::jsonb->>'row' = ${String(payload.row)}
      returning 1 as ok
    `;
    if (claimed.length === 0) throw new Error("Round state changed — reload");
    const amount = asNumber(round.bet_amount);
    if (hit) {
      if (amount > 0) {
        void pushSettledBet({
          userId: context.userId,
          game: round.game_id,
          amount,
          payout: 0,
          multiplier: 0,
          won: false,
        });
      }
      return { boom: true, row: payload.row, deaths: payload.bombs.map((b) => b[0] ?? 0), bombs: payload.bombs, multiplier: 0, payout: 0 };
    }
    const multiplier = towerMultiplier(nextRow, payload.cols, bombsN);
    const done = nextRow >= payload.rows;
    if (done) {
      const payout = amount * multiplier;
      if (payout > 0 && amount > 0) {
        await credit(context.userId, parseCurrency(round.currency), payout, "win", round.game_id, "Tower");
      }
      if (amount > 0) {
        void pushSettledBet({
          userId: context.userId,
          game: round.game_id,
          amount,
          payout,
          multiplier,
          won: payout > 0,
        });
      }
      return { boom: false, row: nextRow, multiplier, payout, done: true, balances: await snapshot(context.userId) };
    }
    return { boom: false, row: nextRow, multiplier, done: false };
  });

export const cashTower = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator(z.object({ roundId: z.string() }))
  .handler(async ({ context, data }) => {
    const sql = await getSql();
    const rows = await sql<{
      payload: string;
      status: string;
      bet_amount: string;
      currency: string;
      game_id: string;
    }>`
      select payload, status, bet_amount, currency, game_id
      from game_rounds
      where id = ${data.roundId} and user_id = ${context.userId}
    `;
    const round = rows[0];
    if (!round || round.status !== "open") throw new Error("Round not open");
    // Claim the settle atomically before crediting — concurrent cash-outs must
    // not both pay out.
    const claimed = await sql<{ ok: number }>`
      update game_rounds set status = 'settled'
      where id = ${data.roundId} and user_id = ${context.userId} and status = 'open'
      returning 1 as ok
    `;
    if (claimed.length === 0) throw new Error("Round already settled");
    const payload = JSON.parse(round.payload) as TowerPayload;
    const bombsN = payload.bombs[0]?.length || 1;
    const multiplier = towerMultiplier(payload.row, payload.cols, bombsN);
    const amount = asNumber(round.bet_amount);
    const payout = amount * multiplier;
    if (payout > 0 && amount > 0) {
      await credit(context.userId, parseCurrency(round.currency), payout, "win", round.game_id, "Tower");
    }
    if (amount > 0) {
      void pushSettledBet({
        userId: context.userId,
        game: round.game_id,
        amount,
        payout,
        multiplier,
        won: payout > 0,
      });
    }
    return { payout, multiplier, balances: await snapshot(context.userId) };
  });


