/**
 * TOLS Originals kernel — same model as Shuffle / Goated house games.
 *
 * HMAC-SHA256 (server seed + client seed + nonce) → floats.
 * House edge is baked into the price, not the RNG:
 *   multiplier = RTP / P(win)     RTP = 0.99
 */

export const ORIGINALS_RTP = 0.99;
export const ORIGINALS_EDGE = 0.01;

/** Inclusive-stake payout. chance is 0–100. */
export function payoutFromChance(chancePercent: number): number {
  const c = Math.min(99, Math.max(0.01, chancePercent));
  return ORIGINALS_RTP * 100 / c;
}

/** Shuffle/Goated dice: 10,001 outcomes 0.00 … 100.00 */
export function diceFromFloat(u: number): number {
  return Math.floor(Math.min(0.999999, Math.max(0, u)) * 10001) / 100;
}

/**
 * Mines step: each safe reveal multiplies by RTP / P(next is safe).
 * P(safe) = (tiles left − mines) / tiles left.
 */
export function minesMultiplier(revealed: number, mineCount: number, size = 25): number {
  let m = 1;
  for (let i = 0; i < revealed; i += 1) {
    const remaining = size - i;
    const safe = remaining - mineCount;
    if (safe <= 0 || remaining <= 0) return 0;
    m *= ORIGINALS_RTP * (remaining / safe);
  }
  return Math.floor(m * 100) / 100;
}

/** Hi-Lo: Ace = 1 … King = 13. Same-rank wins. Unlimited deck. */
export function hiloChance(rank: number, pick: "higher" | "lower"): number {
  const r = Math.min(13, Math.max(1, rank));
  return pick === "higher" ? (14 - r) / 13 : r / 13;
}

export function hiloStep(rank: number, pick: "higher" | "lower"): number {
  return ORIGINALS_RTP / hiloChance(rank, pick);
}

/** Limbo / Crash-style 1/x curve with RTP in the numerator. */
export function limboFromFloat(u: number, max = 2 ** 24): number {
  const f = Math.min(0.999999, Math.max(0, u));
  const raw = (ORIGINALS_RTP * max) / (max * f + 1);
  return Math.floor(raw * 100) / 100;
}
