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
  return Math.max(1, Math.floor(raw * 100) / 100);
}

/** Number of right bounces → bucket index 0..rows. */
export function plinkoBucket(floats: number[], rows: number): number {
  let r = 0;
  for (let i = 0; i < rows; i += 1) r += (floats[i] ?? Math.random()) >= 0.5 ? 1 : 0;
  return r;
}

const PLINKO: Record<"low" | "medium" | "high", Record<8 | 12 | 16, number[]>> = {
  low: {
    8: [5.6, 2.1, 1.1, 1, 0.5, 1, 1.1, 2.1, 5.6],
    12: [8.9, 3, 1.4, 1.1, 1, 0.5, 0.3, 0.5, 1, 1.1, 1.4, 3, 8.9],
    16: [16, 9, 2, 1.4, 1.4, 1.2, 1.1, 1, 0.5, 1, 1.1, 1.2, 1.4, 1.4, 2, 9, 16],
  },
  medium: {
    8: [13, 3, 1.3, 0.7, 0.4, 0.7, 1.3, 3, 13],
    12: [18, 4, 1.7, 0.9, 0.7, 0.5, 0.2, 0.5, 0.7, 0.9, 1.7, 4, 18],
    16: [110, 41, 10, 5, 3, 1.5, 1, 0.5, 0.3, 0.5, 1, 1.5, 3, 5, 10, 41, 110],
  },
  high: {
    8: [29, 4, 1.5, 0.3, 0.2, 0.3, 1.5, 4, 29],
    12: [43, 7, 2, 0.6, 0.4, 0.2, 0.2, 0.2, 0.4, 0.6, 2, 7, 43],
    16: [420, 56, 18, 5, 1.9, 0.3, 0.2, 0.15, 0.1, 0.15, 0.2, 0.3, 1.9, 5, 18, 56, 420],
  },
};

export function plinkoMultipliers(rows: 8 | 12 | 16, risk: "low" | "medium" | "high"): number[] {
  return PLINKO[risk][rows];
}

/** Tower: 8 floors, 3 tiles, 1 death. Each safe step × RTP / (2/3). */
export const TOWER_ROWS = 8;
export const TOWER_COLS = 3;

export function towerStepMult(): number {
  return Math.floor((ORIGINALS_RTP / ((TOWER_COLS - 1) / TOWER_COLS)) * 100) / 100;
}

export function towerMultiplier(safeRows: number): number {
  const s = towerStepMult();
  let m = 1;
  for (let i = 0; i < safeRows; i += 1) m *= s;
  return Math.floor(m * 100) / 100;
}
