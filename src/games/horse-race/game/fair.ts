/**
 * Provably-fair primitives — synchronous SHA-256 + HMAC-SHA256.
 *
 * Same scheme used by Stake/Rollbit-style originals:
 *   1. Server picks `serverSeed`, publishes `SHA256(serverSeed)` BEFORE the round.
 *   2. Player controls `clientSeed`; `nonce` increments each round.
 *   3. Outcome floats = HMAC_SHA256(serverSeed, `${clientSeed}:${nonce}:${cursor}`).
 *   4. After the round the server reveals `serverSeed`; anyone can verify the
 *      hash matches and recompute the exact same outcome.
 *
 * Everything here is deterministic and dependency-free.
 */

const K = new Uint32Array([
  0x428a2f98, 0x71374491, 0xb5c0fbcf, 0xe9b5dba5, 0x3956c25b, 0x59f111f1, 0x923f82a4, 0xab1c5ed5,
  0xd807aa98, 0x12835b01, 0x243185be, 0x550c7dc3, 0x72be5d74, 0x80deb1fe, 0x9bdc06a7, 0xc19bf174,
  0xe49b69c1, 0xefbe4786, 0x0fc19dc6, 0x240ca1cc, 0x2de92c6f, 0x4a7484aa, 0x5cb0a9dc, 0x76f988da,
  0x983e5152, 0xa831c66d, 0xb00327c8, 0xbf597fc7, 0xc6e00bf3, 0xd5a79147, 0x06ca6351, 0x14292967,
  0x27b70a85, 0x2e1b2138, 0x4d2c6dfc, 0x53380d13, 0x650a7354, 0x766a0abb, 0x81c2c92e, 0x92722c85,
  0xa2bfe8a1, 0xa81a664b, 0xc24b8b70, 0xc76c51a3, 0xd192e819, 0xd6990624, 0xf40e3585, 0x106aa070,
  0x19a4c116, 0x1e376c08, 0x2748774c, 0x34b0bcb5, 0x391c0cb3, 0x4ed8aa4a, 0x5b9cca4f, 0x682e6ff3,
  0x748f82ee, 0x78a5636f, 0x84c87814, 0x8cc70208, 0x90befffa, 0xa4506ceb, 0xbef9a3f7, 0xc67178f2,
]);

function rotr(x: number, n: number) {
  return (x >>> n) | (x << (32 - n));
}

/** SHA-256 over bytes → 32-byte digest. */
export function sha256Bytes(msg: Uint8Array): Uint8Array<ArrayBuffer> {
  const h = new Uint32Array([
    0x6a09e667, 0xbb67ae85, 0x3c6ef372, 0xa54ff53a, 0x510e527f, 0x9b05688c, 0x1f83d9ab, 0x5be0cd19,
  ]);

  const len = msg.length;
  const bitLen = len * 8;
  const withOne = len + 1;
  const total = withOne + ((56 - (withOne % 64)) + 64) % 64 + 8;
  const buf = new Uint8Array(total);
  buf.set(msg);
  buf[len] = 0x80;
  // 64-bit big-endian length (high word is 0 for our sizes)
  const dv = new DataView(buf.buffer);
  dv.setUint32(total - 8, Math.floor(bitLen / 0x100000000), false);
  dv.setUint32(total - 4, bitLen >>> 0, false);

  const w = new Uint32Array(64);
  for (let off = 0; off < total; off += 64) {
    for (let i = 0; i < 16; i++) w[i] = dv.getUint32(off + i * 4, false);
    for (let i = 16; i < 64; i++) {
      const s0 = rotr(w[i - 15], 7) ^ rotr(w[i - 15], 18) ^ (w[i - 15] >>> 3);
      const s1 = rotr(w[i - 2], 17) ^ rotr(w[i - 2], 19) ^ (w[i - 2] >>> 10);
      w[i] = (w[i - 16] + s0 + w[i - 7] + s1) >>> 0;
    }
    let [a, b, c, d, e, f, g, hh] = h;
    for (let i = 0; i < 64; i++) {
      const S1 = rotr(e, 6) ^ rotr(e, 11) ^ rotr(e, 25);
      const ch = (e & f) ^ (~e & g);
      const t1 = (hh + S1 + ch + K[i] + w[i]) >>> 0;
      const S0 = rotr(a, 2) ^ rotr(a, 13) ^ rotr(a, 22);
      const maj = (a & b) ^ (a & c) ^ (b & c);
      const t2 = (S0 + maj) >>> 0;
      hh = g; g = f; f = e;
      e = (d + t1) >>> 0;
      d = c; c = b; b = a;
      a = (t1 + t2) >>> 0;
    }
    h[0] = (h[0] + a) >>> 0; h[1] = (h[1] + b) >>> 0;
    h[2] = (h[2] + c) >>> 0; h[3] = (h[3] + d) >>> 0;
    h[4] = (h[4] + e) >>> 0; h[5] = (h[5] + f) >>> 0;
    h[6] = (h[6] + g) >>> 0; h[7] = (h[7] + hh) >>> 0;
  }

  const out = new Uint8Array(32);
  const odv = new DataView(out.buffer);
  for (let i = 0; i < 8; i++) odv.setUint32(i * 4, h[i], false);
  return out;
}

const enc = (s: string): Uint8Array<ArrayBuffer> => {
  const u = new TextEncoder().encode(s);
  const out = new Uint8Array(new ArrayBuffer(u.length));
  out.set(u);
  return out;
};
const hex = (b: Uint8Array): string =>
  Array.from(b, (x) => x.toString(16).padStart(2, "0")).join("");

/** SHA-256 of a UTF-8 string → hex. */
export function sha256(s: string): string {
  return hex(sha256Bytes(enc(s)));
}

/** HMAC-SHA256(key, message) → 32 bytes. */
export function hmacSha256Bytes(key: string, message: string): Uint8Array<ArrayBuffer> {
  const block = 64;
  let k: Uint8Array<ArrayBuffer> = enc(key);
  if (k.length > block) k = sha256Bytes(k);
  const pad = new Uint8Array(block);
  pad.set(k);

  const inner = new Uint8Array(block + message.length);
  const outer = new Uint8Array(block + 32);
  const m = enc(message);
  for (let i = 0; i < block; i++) {
    inner[i] = pad[i] ^ 0x36;
    outer[i] = pad[i] ^ 0x5c;
  }
  inner.set(m, block);
  outer.set(sha256Bytes(inner), block);
  return sha256Bytes(outer);
}

export function hmacSha256(key: string, message: string): string {
  return hex(hmacSha256Bytes(key, message));
}

/**
 * Deterministic float stream in [0,1).
 * Each `cursor` yields an independent uniform float from 4 fresh bytes.
 */
export function fairFloats(
  serverSeed: string,
  clientSeed: string,
  nonce: number,
  count: number,
): number[] {
  const out: number[] = [];
  let cursor = 0;
  while (out.length < count) {
    const digest = hmacSha256Bytes(serverSeed, `${clientSeed}:${nonce}:${cursor}`);
    // 8 floats per digest (4 bytes each)
    for (let i = 0; i + 3 < 32 && out.length < count; i += 4) {
      const v =
        ((digest[i] << 24) >>> 0) +
        (digest[i + 1] << 16) +
        (digest[i + 2] << 8) +
        digest[i + 3];
      out.push(v / 0x100000000);
    }
    cursor++;
  }
  return out;
}

/** Cryptographically-random hex seed. */
export function randomSeed(bytes = 32): string {
  const b = new Uint8Array(bytes);
  if (typeof crypto !== "undefined" && crypto.getRandomValues) crypto.getRandomValues(b);
  else for (let i = 0; i < bytes; i++) b[i] = Math.floor(Math.random() * 256);
  return hex(b);
}

/** Short, human-friendly client seed. */
export function randomClientSeed(): string {
  const words = ["derby", "lime", "fluo", "chip", "turbo", "photo", "rail", "silk", "gate", "hoof"];
  const w = words[Math.floor(Math.random() * words.length)];
  return `${w}-${randomSeed(3)}`;
}
