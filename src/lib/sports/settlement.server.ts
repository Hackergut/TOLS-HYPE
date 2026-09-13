/**
 * Sport ticket lifecycle (server-only): open tickets, and settling them from
 * the vendor's final scores.
 *
 * Invariants this file is responsible for:
 *
 *   1. **A ticket is claimed before it is paid.** The payout UPDATE is guarded
 *      by `status = 'pending'` and returns the row it changed; only the caller
 *      that actually flipped the row credits the wallet. Two settlement passes
 *      racing the same ticket cannot both pay.
 *   2. **Only a completed vendor score settles anything.** A missing score, an
 *      in-play game or an unmappable market leaves the ticket pending — the
 *      pure layer returns `null` and this layer treats that as "not yet".
 *   3. **Scores are fetched per sport key**, at most one call per distinct key
 *      among open tickets, through the cached client (1 credit each, 60s TTL).
 */
import { randomBytes } from "node:crypto";
import { getSql } from "@/lib/db";
import { credit, ensureWallets } from "@/lib/wallet.server";
import { getScores } from "@/lib/sports/odds-api.server";
import { mapScoreEvent } from "@/lib/sports/odds-api";
import { settleTicket, ticketDetail, type FinalScore, type SettledLeg } from "./settlement.ts";

export type TicketStatus = "pending" | "won" | "lost" | "void";

export type SportTicket = {
  id: string;
  currency: string;
  stake: number;
  mode: "single" | "combo";
  price: number;
  legs: SettledLeg[];
  status: TicketStatus;
  payout: number;
  detail: string | null;
  placedAt: number;
  settledAt: number | null;
};

type TicketRow = {
  id: string;
  user_id: string;
  currency: string;
  stake: number;
  mode: string;
  price: number;
  legs: string;
  status: string;
  payout: number;
  detail: string | null;
  placed_at: string;
  settled_at: string | null;
};

function newTicketId() {
  return `sb_${Date.now().toString(36)}_${randomBytes(6).toString("hex")}`;
}

function parseLegs(raw: string): SettledLeg[] {
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as SettledLeg[]) : [];
  } catch {
    return [];
  }
}

function toTicket(row: TicketRow): SportTicket {
  return {
    id: row.id,
    currency: row.currency,
    stake: Number(row.stake),
    mode: row.mode === "combo" ? "combo" : "single",
    price: Number(row.price),
    legs: parseLegs(row.legs),
    status: (row.status as TicketStatus) ?? "pending",
    payout: Number(row.payout),
    detail: row.detail,
    placedAt: new Date(row.placed_at).getTime(),
    settledAt: row.settled_at ? new Date(row.settled_at).getTime() : null,
  };
}

/* ------------------------------------------------------------------ *
 * Placement
 * ------------------------------------------------------------------ */

export async function createSportTicket(input: {
  userId: string;
  currency: string;
  stake: number;
  mode: "single" | "combo";
  price: number;
  legs: SettledLeg[];
}): Promise<string> {
  const sql = await getSql();
  const id = newTicketId();
  await sql`
    insert into sport_bets (id, user_id, currency, stake, mode, price, legs, status, payout, placed_at)
    values (${id}, ${input.userId}, ${input.currency}, ${input.stake}, ${input.mode},
            ${input.price}, ${JSON.stringify(input.legs)}, 'pending', 0, now())
  `;
  return id;
}

export async function listSportTickets(userId: string, limit = 50): Promise<SportTicket[]> {
  const sql = await getSql();
  const rows = await sql<TicketRow>`
    select id, user_id, currency, stake, mode, price, legs, status, payout, detail, placed_at, settled_at
    from sport_bets
    where user_id = ${userId}
    order by placed_at desc
    limit ${Math.min(200, Math.max(1, limit))}
  `;
  return rows.map(toTicket);
}

/** Ops view: how much is unsettled and since when. No player data. */
export async function openTicketStats() {
  const sql = await getSql();
  const rows = await sql<{ open: number; stake: number; oldest: string | null }>`
    select count(*)::int as open, coalesce(sum(stake), 0)::float as stake, min(placed_at) as oldest
    from sport_bets where status = 'pending'
  `;
  const r = rows[0];
  return {
    open: Number(r?.open ?? 0),
    stakeAtRisk: Number(r?.stake ?? 0),
    oldestPlacedAt: r?.oldest ? new Date(r.oldest).toISOString() : null,
  };
}

/* ------------------------------------------------------------------ *
 * Settlement
 * ------------------------------------------------------------------ */

/** Final scores for the sport keys referenced by open tickets (completed only). */
async function finalScores(sportKeys: string[], now: Date): Promise<Map<string, FinalScore>> {
  const out = new Map<string, FinalScore>();
  for (const key of sportKeys) {
    const rows = await getScores(key);
    for (const row of rows) {
      const s = mapScoreEvent((row ?? {}) as Parameters<typeof mapScoreEvent>[0], now);
      if (!s || !s.completed || s.home == null || s.away == null) continue;
      out.set(s.id, { home: s.home, away: s.away });
    }
  }
  return out;
}

export type SettleSummary = {
  scanned: number;
  settled: number;
  paid: number;
  stillPending: number;
  pendingNoScore: number;
  sportKeys: number;
  errors: string[];
};

/**
 * Settle every ticket whose events now have a final score. Safe to run
 * repeatedly and concurrently: the claim is a conditional UPDATE.
 */
export async function settleSportBets(limit = 200): Promise<SettleSummary> {
  const sql = await getSql();
  const summary: SettleSummary = {
    scanned: 0,
    settled: 0,
    paid: 0,
    stillPending: 0,
    pendingNoScore: 0,
    sportKeys: 0,
    errors: [],
  };

  const rows = await sql<TicketRow>`
    select id, user_id, currency, stake, mode, price, legs, status, payout, detail, placed_at, settled_at
    from sport_bets
    where status = 'pending'
    order by placed_at asc
    limit ${Math.min(500, Math.max(1, limit))}
  `;
  summary.scanned = rows.length;
  if (!rows.length) return summary;

  const tickets = rows.map((r) => ({ row: r, ticket: toTicket(r) }));
  const keys = [...new Set(tickets.flatMap(({ ticket }) => ticket.legs.map((l) => l.sportKey).filter((k): k is string => Boolean(k))))];
  summary.sportKeys = keys.length;

  const scores = keys.length ? await finalScores(keys, new Date()) : new Map<string, FinalScore>();

  for (const { row, ticket } of tickets) {
    if (!ticket.legs.length) {
      summary.errors.push(`${ticket.id}: no legs`);
      continue;
    }
    const missing = ticket.legs.some((l) => !scores.has(l.eventId));
    const result = settleTicket(ticket.legs, scores, ticket.stake);

    if (result.status === "pending") {
      summary.stillPending += 1;
      if (missing) summary.pendingNoScore += 1;
      continue;
    }

    // Claim first: only the pass that flips the row is allowed to pay.
    const claimed = await sql<{ id: string }>`
      update sport_bets
      set status = ${result.status},
          payout = ${result.payout},
          detail = ${ticketDetail(ticket.legs, scores)},
          settled_at = now()
      where id = ${ticket.id} and status = 'pending'
      returning id
    `;
    if (!claimed.length) continue; // someone else settled it
    summary.settled += 1;

    if (result.payout <= 0) continue;
    try {
      await ensureWallets(row.user_id);
      await credit(
        row.user_id,
        ticket.currency as never,
        result.payout,
        result.status === "void" ? "refund" : "win",
        ticket.legs[0]?.eventId,
        result.status === "void" ? "sport-void" : `sport-settle:${ticket.id}`,
      );
      summary.paid += 1;
    } catch (err) {
      // The ticket is already marked settled; surface it instead of silently
      // retrying and risking a double credit on the next pass.
      summary.errors.push(`${ticket.id}: credit failed (${err instanceof Error ? err.message : String(err)})`);
    }
  }

  return summary;
}
