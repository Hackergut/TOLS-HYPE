/** HMAC-SHA256 commit-reveal helpers. Floats in [0, 1). */

export type FairProof = {
  serverHash: string;
  clientSeed: string;
  nonce: number;
};

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
  return Math.floor(u * 10000) / 100;
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
