/** HMAC-SHA256 commit-reveal helpers. Discrete outcomes use rejection sampling. */

export type FairProof = {
  serverHash: string;
  clientSeed: string;
  nonce: number;
};

const U64 = 1n << 64n;
const UNIT_SHIFT = 11n;
const UNIT_DENOM = 2 ** 53;
const MAX_TRIES = 1_000_000;
const MAX_RANGE = 2 ** 32;

export type BlockSource = (counter: number) => Uint8Array;

export function u64FromBytes(bytes: Uint8Array, offset = 0): bigint {
  let v = 0n;
  for (let i = 0; i < 8; i += 1) {
    v = (v << 8n) | BigInt(bytes[offset + i] ?? 0);
  }
  return v;
}

/** Uniform [0, 1) from 53 mantissa bits. No discrete modulo, so no rejection. */
export function unitFromU64(u: bigint): number {
  return Number(u >> UNIT_SHIFT) / UNIT_DENOM;
}

/**
 * Map a u64 into `[0, rangeMax)` without modulo bias.
 * Returns `null` when the sample must be rejected and redrawn.
 */
export function tryUnbiasedInt(u: bigint, rangeMax: number): number | null {
  if (!Number.isInteger(rangeMax) || rangeMax <= 0 || rangeMax > MAX_RANGE) {
    throw new Error(`rangeMax must be an integer in 1..${MAX_RANGE}`);
  }
  const n = BigInt(rangeMax);
  const limit = (U64 / n) * n;
  if (u >= limit) return null;
  return Number(u % n);
}

export function deriveUnbiasedInt(
  blocks: BlockSource,
  rangeMax: number,
  startCounter = 0,
  maxTries = MAX_TRIES,
): { value: number; counter: number; tries: number } {
  for (let t = 0; t < maxTries; t += 1) {
    const counter = startCounter + t;
    const value = tryUnbiasedInt(u64FromBytes(blocks(counter)), rangeMax);
    if (value !== null) return { value, counter, tries: t + 1 };
  }
  throw new Error(`rejection sampling failed after ${maxTries} draws`);
}

export function deriveUnit(
  blocks: BlockSource,
  startCounter = 0,
): { value: number; counter: number } {
  const counter = startCounter;
  return { value: unitFromU64(u64FromBytes(blocks(counter))), counter };
}

/** Dice pip in 0.00..99.99 from an unbiased int in 0..9999. */
export function diceFromInt(n: number): number {
  return n / 100;
}

export function pickWeightedInt(draw: (rangeMax: number) => number, weights: number[]): number {
  const total = weights.reduce((a, b) => a + b, 0);
  if (total <= 0) throw new Error("weights must sum to > 0");
  let r = draw(total);
  for (let i = 0; i < weights.length; i += 1) {
    if (r < weights[i]!) return i;
    r -= weights[i]!;
  }
  return weights.length - 1;
}

/** Sample `count` distinct values from `[offset, offset+max)`. */
export function uniquePicksInt(
  draw: (rangeMax: number) => number,
  count: number,
  max: number,
  offset = 1,
): number[] {
  const remaining = Array.from({ length: max }, (_, i) => i + offset);
  const out: number[] = [];
  while (out.length < count && remaining.length > 0) {
    const j = draw(remaining.length);
    out.push(remaining.splice(j, 1)[0]!);
  }
  return out;
}

export function shuffleInt<T>(items: T[], draw: (rangeMax: number) => number): T[] {
  const out = items.slice();
  for (let i = out.length - 1; i > 0; i -= 1) {
    const j = draw(i + 1);
    const tmp = out[i]!;
    out[i] = out[j]!;
    out[j] = tmp;
  }
  return out;
}

/* ── legacy float helpers (biased for discrete N that do not divide 2^32) ── */

export function bytesToFloat(bytes: Uint8Array, offset = 0): number {
  const i =
    ((bytes[offset] ?? 0) << 24) |
    ((bytes[offset + 1] ?? 0) << 16) |
    ((bytes[offset + 2] ?? 0) << 8) |
    (bytes[offset + 3] ?? 0);
  return (i >>> 0) / 0x1_0000_0000;
}

export function floatsFromDigest(digest: Uint8Array, count: number): number[] {
  const out: number[] = [];
  for (let i = 0; i < count; i += 1) {
    const offset = (i * 4) % (digest.length - 3);
    out.push(bytesToFloat(digest, offset));
  }
  return out;
}

export function diceRoll(u: number): number {
  return diceFromInt(Math.min(9999, Math.floor(u * 10000)));
}

export function crashPointFromFloat(u: number, edge = 0.04): number {
  if (u < edge) return 1;
  const raw = (1 - edge) / (1 - u);
  return Math.max(1, Math.floor(raw * 100) / 100);
}

export function pickIndex(u: number, size: number): number {
  return Math.min(size - 1, Math.floor(u * size));
}

export function pickWeighted(u: number, weights: number[]): number {
  const total = weights.reduce((a, b) => a + b, 0);
  let r = u * total;
  for (let i = 0; i < weights.length; i += 1) {
    r -= weights[i]!;
    if (r <= 0) return i;
  }
  return weights.length - 1;
}

export function uniquePicks(floats: number[], count: number, max: number, offset = 0): number[] {
  const out: number[] = [];
  let i = 0;
  while (out.length < count && i < floats.length * 8) {
    const u = floats[i % floats.length]!;
    const n = 1 + Math.floor(((u + i * 0.6180339887) % 1) * max);
    if (!out.includes(n)) out.push(n);
    i += 1;
  }
  return out;
}
