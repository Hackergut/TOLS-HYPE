/**
 * Sport bet settlement — the money math, kept pure.
 *
 * A ticket settles from a **final score**, nothing else: no RNG, no house
 * re-roll. `settleLeg` answers won / lost / void for one selection, and
 * `settleTicket` combines legs the way an accumulator works (a void leg is
 * removed and the price recalculated, not treated as a loss).
 *
 * Anything this module cannot decide returns `null` — the caller must then
 * leave the ticket pending. Guessing here would pay real money on a
 * mis-mapped market, so "don't know" is always a first-class answer.
 *
 * Pure on purpose (no env, no fetch, no `@/` alias) so the shipping code is
 * what the tests load — see `settlement.test.ts`.
 */
import type { MarketKind } from "../sports-book.ts";

export type FinalScore = { home: number; away: number };

export type SettledLeg = {
  eventId: string;
  market: MarketKind | string;
  selection: string;
  odds: number;
  line?: number;
  /** Vendor sport_key, so scores can be fetched after a restart. */
  sportKey?: string;
  fixture?: string;
};

export type LegResult = "won" | "lost" | "void";

export type TicketResult =
  | { status: "pending"; payout: 0 }
  | { status: "won"; payout: number }
  | { status: "lost"; payout: 0 }
  | { status: "void"; payout: number };

function isScore(s: unknown): s is FinalScore {
  return (
    typeof s === "object" &&
    s !== null &&
    Number.isFinite((s as FinalScore).home) &&
    Number.isFinite((s as FinalScore).away)
  );
}

/**
 * Result of one selection against a final score.
 * `null` = not decidable (unknown market, missing line, malformed score).
 */
export function settleLeg(
  leg: Pick<SettledLeg, "market" | "selection" | "line">,
  score: FinalScore | null | undefined,
): LegResult | null {
  if (!isScore(score)) return null;
  const { home, away } = score;
  const sel = String(leg.selection ?? "").toLowerCase();

  switch (leg.market) {
    case "ml": {
      if (sel === "home") return home > away ? "won" : "lost";
      if (sel === "away") return away > home ? "won" : "lost";
      if (sel === "draw") return home === away ? "won" : "lost";
      return null;
    }
    case "spread": {
      // `line` is the handicap carried by THIS selection (home keeps the
      // stored line, away carries its negation — see `outcomesFor`).
      const line = leg.line;
      if (typeof line !== "number" || !Number.isFinite(line)) return null;
      if (sel === "home") {
        const margin = home + line - away;
        return margin > 0 ? "won" : margin < 0 ? "lost" : "void";
      }
      if (sel === "away") {
        const margin = away + line - home;
        return margin > 0 ? "won" : margin < 0 ? "lost" : "void";
      }
      return null;
    }
    case "total": {
      const line = leg.line;
      if (typeof line !== "number" || !Number.isFinite(line)) return null;
      const diff = home + away - line;
      if (diff === 0) return "void";
      if (sel === "over") return diff > 0 ? "won" : "lost";
      if (sel === "under") return diff < 0 ? "won" : "lost";
      return null;
    }
    case "btts": {
      const both = home > 0 && away > 0;
      if (sel === "yes") return both ? "won" : "lost";
      if (sel === "no") return both ? "lost" : "won";
      return null;
    }
    case "dc": {
      const homeWin = home > away;
      const awayWin = away > home;
      const draw = home === away;
      if (sel === "1x") return homeWin || draw ? "won" : "lost";
      if (sel === "12") return homeWin || awayWin ? "won" : "lost";
      if (sel === "x2") return awayWin || draw ? "won" : "lost";
      return null;
    }
    default:
      return null;
  }
}

/**
 * Settle a whole ticket.
 *
 *   - any leg still undecidable        → `pending` (payout 0, stake stays out)
 *   - every leg void                   → `void`, stake returned
 *   - a void leg among live ones       → dropped, price recalculated
 *   - all remaining legs won           → `won`, stake × price
 *   - any remaining leg lost           → `lost`
 */
export function settleTicket(
  legs: readonly Pick<SettledLeg, "market" | "selection" | "odds" | "line">[],
  scores: ReadonlyMap<string, FinalScore | null | undefined> | ((eventId: string) => FinalScore | null | undefined),
  stake: number,
): TicketResult {
  if (!legs.length) return { status: "pending", payout: 0 };
  const scoreOf = typeof scores === "function" ? scores : (id: string) => scores.get(id);

  const live: number[] = [];
  for (const leg of legs) {
    const eventId = (leg as SettledLeg).eventId;
    const result = settleLeg(leg, scoreOf(eventId));
    if (result === null) return { status: "pending", payout: 0 };
    if (result === "lost") return { status: "lost", payout: 0 };
    if (result === "won") {
      const odds = Number(leg.odds);
      if (!Number.isFinite(odds) || odds <= 1) return { status: "pending", payout: 0 };
      live.push(odds);
    }
    // "void" contributes nothing and does not sink the ticket.
  }

  if (!live.length) return { status: "void", payout: round2(stake) };
  const price = live.reduce((acc, o) => acc * o, 1);
  return { status: "won", payout: round2(stake * price) };
}

/** True when every leg of a ticket can be settled from the given scores. */
export function isTicketSettleable(
  legs: readonly Pick<SettledLeg, "eventId" | "market" | "selection" | "line">[],
  scores: ReadonlyMap<string, FinalScore | null | undefined>,
): boolean {
  return legs.every((leg) => settleLeg(leg, scores.get(leg.eventId)) !== null);
}

/** Human-readable settlement note stored on the ticket (`detail`). */
export function ticketDetail(
  legs: readonly Pick<SettledLeg, "eventId" | "market" | "selection" | "line">[],
  scores: ReadonlyMap<string, FinalScore | null | undefined>,
): string {
  return legs
    .map((leg) => {
      const s = scores.get((leg as SettledLeg).eventId);
      const score = isScore(s) ? `${s.home}-${s.away}` : "n/a";
      return `${leg.market}:${leg.selection}${leg.line != null ? `(${leg.line})` : ""}@${score}=${settleLeg(leg, s) ?? "?"}`;
    })
    .join(" ");
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}
