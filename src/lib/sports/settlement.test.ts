/**
 * Settlement math — the module that decides real payouts.
 *
 * Every case here is a money path: a wrong sign on a handicap pays the wrong
 * side. Fixtures use plain scores so the expectations are checkable by hand.
 */
import assert from "node:assert/strict";
import test from "node:test";
import { isTicketSettleable, settleLeg, settleTicket, ticketDetail } from "./settlement.ts";

const S = (home: number, away: number) => ({ home, away });

/* ---------------------------------------------------------------- *
 * Moneyline
 * ---------------------------------------------------------------- */

test("moneyline settles home / draw / away from the final score", () => {
  assert.equal(settleLeg({ market: "ml", selection: "home" }, S(2, 1)), "won");
  assert.equal(settleLeg({ market: "ml", selection: "home" }, S(1, 2)), "lost");
  assert.equal(settleLeg({ market: "ml", selection: "draw" }, S(1, 1)), "won");
  assert.equal(settleLeg({ market: "ml", selection: "draw" }, S(2, 1)), "lost");
  assert.equal(settleLeg({ market: "ml", selection: "away" }, S(0, 3)), "won");
  assert.equal(settleLeg({ market: "ml", selection: "away" }, S(3, 3)), "lost");
});

/* ---------------------------------------------------------------- *
 * Spread — the sign is where money leaks
 * ---------------------------------------------------------------- */

test("spread: the stored line is the handicap of THAT selection", () => {
  // Home +6.5 on a 3-point loss still covers.
  assert.equal(settleLeg({ market: "spread", selection: "home", line: 6.5 }, S(20, 23)), "won");
  assert.equal(settleLeg({ market: "spread", selection: "home", line: -6.5 }, S(20, 23)), "lost");
  // Away carries the negated line (as `outcomesFor` emits it): away won by 3,
  // so +6.5 covers and -6.5 does not.
  assert.equal(settleLeg({ market: "spread", selection: "away", line: 6.5 }, S(20, 23)), "won");
  assert.equal(settleLeg({ market: "spread", selection: "away", line: -6.5 }, S(20, 23)), "lost");
  // Winning outright but not covering.
  assert.equal(settleLeg({ market: "spread", selection: "home", line: -10.5 }, S(24, 20)), "lost");
});

test("spread landing exactly on the line is a push, not a loss", () => {
  assert.equal(settleLeg({ market: "spread", selection: "home", line: -4 }, S(24, 20)), "void");
  assert.equal(settleLeg({ market: "spread", selection: "away", line: 4 }, S(24, 20)), "void");
});

test("spread without a usable line is not decidable", () => {
  assert.equal(settleLeg({ market: "spread", selection: "home" }, S(1, 0)), null);
  assert.equal(settleLeg({ market: "spread", selection: "home", line: Number.NaN }, S(1, 0)), null);
});

/* ---------------------------------------------------------------- *
 * Totals
 * ---------------------------------------------------------------- */

test("totals settle over/under and push on the exact line", () => {
  assert.equal(settleLeg({ market: "total", selection: "over", line: 2.5 }, S(2, 1)), "won");
  assert.equal(settleLeg({ market: "total", selection: "over", line: 2.5 }, S(1, 1)), "lost");
  assert.equal(settleLeg({ market: "total", selection: "under", line: 2.5 }, S(1, 1)), "won");
  assert.equal(settleLeg({ market: "total", selection: "over", line: 3 }, S(2, 1)), "void");
  assert.equal(settleLeg({ market: "total", selection: "under", line: 3 }, S(2, 1)), "void");
});

/* ---------------------------------------------------------------- *
 * BTTS / double chance
 * ---------------------------------------------------------------- */

test("btts and double chance settle from the scoreline", () => {
  assert.equal(settleLeg({ market: "btts", selection: "yes" }, S(1, 1)), "won");
  assert.equal(settleLeg({ market: "btts", selection: "yes" }, S(2, 0)), "lost");
  assert.equal(settleLeg({ market: "btts", selection: "no" }, S(2, 0)), "won");
  assert.equal(settleLeg({ market: "dc", selection: "1x" }, S(1, 1)), "won");
  assert.equal(settleLeg({ market: "dc", selection: "1x" }, S(0, 2)), "lost");
  assert.equal(settleLeg({ market: "dc", selection: "12" }, S(1, 1)), "lost");
  assert.equal(settleLeg({ market: "dc", selection: "x2" }, S(0, 2)), "won");
});

/* ---------------------------------------------------------------- *
 * Undecidable inputs must never guess
 * ---------------------------------------------------------------- */

test("unknown market, unknown selection and malformed scores are undecidable", () => {
  assert.equal(settleLeg({ market: "telepathy", selection: "home" }, S(1, 0)), null);
  assert.equal(settleLeg({ market: "ml", selection: "coinflip" }, S(1, 0)), null);
  assert.equal(settleLeg({ market: "ml", selection: "home" }, null), null);
  assert.equal(settleLeg({ market: "ml", selection: "home" }, undefined), null);
  assert.equal(settleLeg({ market: "ml", selection: "home" }, { home: Number.NaN, away: 1 }), null);
});

/* ---------------------------------------------------------------- *
 * Tickets
 * ---------------------------------------------------------------- */

function legs() {
  return [
    { eventId: "a", market: "ml" as const, selection: "home", odds: 2 },
    { eventId: "b", market: "ml" as const, selection: "away", odds: 3 },
  ];
}

test("a single-leg ticket pays stake x odds when it wins", () => {
  const scores = new Map([["a", S(2, 1)]]);
  assert.deepEqual(settleTicket([legs()[0]!], scores, 10), { status: "won", payout: 20 });
  assert.deepEqual(settleTicket([legs()[0]!], new Map([["a", S(0, 2)]]), 10), { status: "lost", payout: 0 });
});

test("an accumulator pays the product of the legs", () => {
  const scores = new Map([
    ["a", S(2, 1)],
    ["b", S(1, 4)],
  ]);
  assert.deepEqual(settleTicket(legs(), scores, 10), { status: "won", payout: 60 });
});

test("one losing leg sinks the whole accumulator", () => {
  const scores = new Map([
    ["a", S(2, 1)],
    ["b", S(3, 0)],
  ]);
  assert.deepEqual(settleTicket(legs(), scores, 10), { status: "lost", payout: 0 });
});

test("a missing score keeps the ticket pending instead of guessing", () => {
  const scores = new Map([["a", S(2, 1)]]);
  assert.deepEqual(settleTicket(legs(), scores, 10), { status: "pending", payout: 0 });
  assert.equal(isTicketSettleable(legs(), scores), false);
});

test("every leg void returns the stake", () => {
  const push = [
    { eventId: "a", market: "total" as const, selection: "over", odds: 1.9, line: 3 },
    { eventId: "b", market: "total" as const, selection: "under", odds: 1.9, line: 2 },
  ];
  const scores = new Map([
    ["a", S(2, 1)],
    ["b", S(1, 1)],
  ]);
  assert.deepEqual(settleTicket(push, scores, 10), { status: "void", payout: 10 });
});

test("a void leg is dropped and the price recalculated, not counted as a loss", () => {
  const mixed = [
    { eventId: "a", market: "ml" as const, selection: "home", odds: 2 },
    { eventId: "b", market: "total" as const, selection: "over", odds: 1.9, line: 3 },
  ];
  const scores = new Map([
    ["a", S(2, 1)],
    ["b", S(2, 1)], // exactly 3 → push
  ]);
  assert.deepEqual(settleTicket(mixed, scores, 10), { status: "won", payout: 20 });
});

test("a leg with a non-sellable price stays pending rather than paying", () => {
  const bad = [{ eventId: "a", market: "ml" as const, selection: "home", odds: 1 }];
  assert.deepEqual(settleTicket(bad, new Map([["a", S(1, 0)]]), 10), { status: "pending", payout: 0 });
});

test("settlement accepts a score lookup function as well as a map", () => {
  const byFn = (id: string) => (id === "a" ? S(2, 1) : null);
  assert.deepEqual(settleTicket([legs()[0]!], byFn, 10), { status: "won", payout: 20 });
});

test("ticketDetail records every leg against its score", () => {
  const scores = new Map<string, { home: number; away: number } | null>([["a", S(2, 1)]]);
  const detail = ticketDetail(
    [
      { eventId: "a", market: "ml", selection: "home" },
      { eventId: "b", market: "total", selection: "over", line: 2.5 },
    ],
    scores,
  );
  assert.equal(detail, "ml:home@2-1=won total:over(2.5)@n/a=?");
});
