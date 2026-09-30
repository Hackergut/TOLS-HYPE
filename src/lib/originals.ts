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

/** Right-bounce path. Bucket index is how many times the chip went right. */
export function plinkoPath(floats: number[], rows: number): number[] {
  return Array.from({ length: rows }, (_, i) => ((floats[i] ?? 0) >= 0.5 ? 1 : 0));
}

export function plinkoBucket(floats: number[], rows: number): number {
  return plinkoPath(floats, rows).reduce((sum, step) => sum + step, 0);
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

/** Tower floors. Easy → master changes columns and bombs. Patterns only move the bombs. */
export const TOWER_ROWS = 9;
export const TOWER_COLS = 3;

export const TOWER_SETUPS = {
  easy: { cols: 4, bombs: 1, rows: 9 },
  medium: { cols: 3, bombs: 1, rows: 9 },
  hard: { cols: 2, bombs: 1, rows: 9 },
  expert: { cols: 3, bombs: 2, rows: 8 },
  master: { cols: 4, bombs: 3, rows: 8 },
} as const;

export type TowerMode = keyof typeof TOWER_SETUPS;
export type TowerPattern = "classic" | "snake" | "mirror" | "edges";

export function towerStepMult(cols = TOWER_COLS, bombs = 1): number {
  const safe = Math.max(1, cols - bombs) / cols;
  return Math.floor((ORIGINALS_RTP / safe) * 100) / 100;
}

export function towerMultiplier(safeRows: number, cols = TOWER_COLS, bombs = 1): number {
  const s = towerStepMult(cols, bombs);
  let m = 1;
  for (let i = 0; i < safeRows; i += 1) m *= s;
  return Math.floor(m * 100) / 100;
}

/** Provably placed bombs. The shape is fixed, the rotation comes from the seed. */
export function towerBombs(
  floats: number[],
  cols: number,
  bombs: number,
  rows: number,
  pattern: TowerPattern,
): number[][] {
  const grid: number[][] = [];
  const shift = Math.floor((floats[0] ?? 0.5) * cols);
  for (let r = 0; r < rows; r += 1) {
    const picked: number[] = [];
    const take = (c: number) => {
      const col = ((c % cols) + cols) % cols;
      if (!picked.includes(col) && picked.length < bombs) picked.push(col);
    };
    if (pattern === "snake") {
      for (let b = 0; b < bombs; b += 1) take(shift + r + b);
    } else if (pattern === "mirror") {
      const edge = r % 2 === 0 ? 0 : cols - 1;
      take(shift + edge);
      if (bombs > 1) take(shift + (cols - 1 - edge));
      let k = 0;
      while (picked.length < bombs && k < cols) {
        take(shift + Math.floor(cols / 2) + (k % 2 === 0 ? k / 2 : -Math.ceil(k / 2)));
        k += 1;
      }
    } else if (pattern === "edges") {
      const order = [0, cols - 1, 1, Math.max(0, cols - 2)];
      for (let b = 0; b < bombs; b += 1) take(shift + order[b % order.length]!);
    } else {
      let fi = r;
      let guard = 0;
      while (picked.length < bombs && guard < cols * 3) {
        const u = floats[fi] ?? floats[fi % Math.max(1, floats.length)] ?? 0.5;
        take(Math.floor(u * cols) + guard);
        fi += rows;
        guard += 1;
      }
    }
    while (picked.length < bombs) take(picked.length);
    grid.push(picked);
  }
  return grid;
}
