import assert from "node:assert/strict";
import { createHmac } from "node:crypto";
import { describe, it } from "node:test";
import {
  deriveUnbiasedInt,
  deriveUnit,
  diceFromInt,
  tryUnbiasedInt,
  uniquePicksInt,
  unitFromU64,
} from "./fair.ts";

function hmacBlock(serverSeed: string, clientSeed: string, nonce: number, counter: number): Uint8Array {
  return new Uint8Array(
    createHmac("sha256", serverSeed).update(`${clientSeed}:${nonce}:${counter}`).digest(),
  );
}

function bytes(hex: string): Uint8Array {
  return Uint8Array.from(Buffer.from(hex, "hex"));
}

describe("rejection sampling", () => {
  it("rejects u64 at or above the largest multiple of N below 2^64", () => {
    const n = 10;
    const max = (1n << 64n) - 1n;
    assert.equal(tryUnbiasedInt(max, n), null);
    assert.equal(tryUnbiasedInt(0n, n), 0);
    assert.equal(tryUnbiasedInt(9n, n), 9);
    assert.equal(tryUnbiasedInt(10n, n), 0);
  });

  it("never rejects when N is a power of two", () => {
    for (let i = 0; i < 256; i += 1) {
      const u = BigInt(i) * (1n << 56n);
      assert.notEqual(tryUnbiasedInt(u, 256), null);
    }
  });

  it("redraws until a sample falls under the limit", () => {
    const rejected = bytes("ffffffffffffffff");
    const accepted = bytes("0000000000000005");
    const blocks = (c: number) => (c === 0 ? rejected : accepted);
    const drawn = deriveUnbiasedInt(blocks, 10, 0);
    assert.equal(drawn.value, 5);
    assert.equal(drawn.counter, 1);
    assert.equal(drawn.tries, 2);
  });

  it("maps dice ints onto 0.00..99.99", () => {
    assert.equal(diceFromInt(0), 0);
    assert.equal(diceFromInt(1), 0.01);
    assert.equal(diceFromInt(9999), 99.99);
  });

  it("samples unique keno numbers in 1..40", () => {
    const drawn = uniquePicksInt(() => 0, 10, 40, 1);
    assert.equal(drawn.length, 10);
    assert.deepEqual(drawn, [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);
    assert.equal(new Set(drawn).size, 10);
  });

  it("unit interval stays in [0, 1)", () => {
    assert.equal(unitFromU64(0n), 0);
    const almost = unitFromU64((1n << 64n) - 1n);
    assert.ok(almost < 1);
    assert.ok(almost > 0.999);
  });
});

describe("HMAC transcript replay", () => {
  const server = "aa".repeat(32);
  const client = "player-seed";
  const nonce = 7;
  const blocks = (c: number) => hmacBlock(server, client, nonce, c);

  it("replays the first two unbiased ints from the same seeds", () => {
    const first = deriveUnbiasedInt(blocks, 10, 0);
    const second = deriveUnbiasedInt(blocks, 10, first.counter + 1);
    const firstAgain = deriveUnbiasedInt(blocks, 10, 0);
    const secondAgain = deriveUnbiasedInt(blocks, 10, firstAgain.counter + 1);
    assert.equal(first.value, firstAgain.value);
    assert.equal(second.value, secondAgain.value);
    assert.equal(first.counter, firstAgain.counter);
  });

  it("draws uniformly across 10 buckets (chi-square)", () => {
    const buckets = new Array(10).fill(0);
    const n = 20_000;
    let counter = 0;
    for (let i = 0; i < n; i += 1) {
      const drawn = deriveUnbiasedInt(blocks, 10, counter);
      buckets[drawn.value] += 1;
      counter = drawn.counter + 1;
    }
    const expected = n / 10;
    let chi = 0;
    for (const o of buckets) chi += (o - expected) ** 2 / expected;
    assert.ok(chi < 40, `chi-square too high: ${chi} buckets=${buckets}`);
  });

  it("unit() is replayable from the same counter", () => {
    const a = deriveUnit(blocks, 0);
    const b = deriveUnit(blocks, 0);
    assert.equal(a.value, b.value);
    assert.ok(a.value >= 0 && a.value < 1);
  });
});
