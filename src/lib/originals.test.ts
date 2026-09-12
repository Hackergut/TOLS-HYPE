import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  ORIGINALS_EDGE,
  ORIGINALS_RTP,
  diceFromFloat,
  hiloChance,
  hiloStep,
  minesMultiplier,
  payoutFromChance,
} from "./originals.ts";

describe("originals kernel (Shuffle/Goated)", () => {
  it("bakes 1% edge into every dice price", () => {
    assert.equal(ORIGINALS_EDGE, 0.01);
    assert.equal(payoutFromChance(50), 1.98);
    assert.equal(payoutFromChance(25), 3.96);
    assert.equal(payoutFromChance(1), 99);
  });

  it("maps dice floats onto 0.00..100.00", () => {
    assert.equal(diceFromFloat(0), 0);
    assert.equal(diceFromFloat(0.0001), 1 / 100);
    assert.equal(diceFromFloat(0.999999), 100);
  });

  it("prices a 9 as Goated (higher 38.46%, lower 69.23%)", () => {
    assert.ok(Math.abs(hiloChance(9, "higher") - 5 / 13) < 1e-12);
    assert.ok(Math.abs(hiloChance(9, "lower") - 9 / 13) < 1e-12);
    const hi = hiloStep(9, "higher");
    assert.ok(Math.abs(hi - ORIGINALS_RTP / (5 / 13)) < 1e-12);
  });

  it("compounds mines with RTP on each gem", () => {
    const first = minesMultiplier(1, 3, 25);
    assert.equal(first, Math.floor(ORIGINALS_RTP * (25 / 22) * 100) / 100);
  });
});
