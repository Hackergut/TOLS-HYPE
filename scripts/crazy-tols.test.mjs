import { test } from "node:test";
import assert from "node:assert/strict";
import { crazyRound, CRAZY_WHEEL, CRAZY_BET_SPOTS } from "../src/lib/crazy-tols.ts";

// Wheel composition — official 54 segments.
test("crazy wheel has the official 54-segment composition", () => {
  assert.equal(CRAZY_WHEEL.length, 54);
  const counts = {};
  for (const s of CRAZY_WHEEL) counts[s.type] = (counts[s.type] ?? 0) + 1;
  assert.deepEqual(counts, { "1": 21, "2": 13, "5": 7, "10": 4, coinflip: 4, cashhunt: 2, pachinko: 2, crazy: 1 });
});

test("crazy bet spots cover all eight wheel types", () => {
  const spotIds = new Set(CRAZY_BET_SPOTS.map((s) => s.id));
  const wheelTypes = new Set(CRAZY_WHEEL.map((s) => s.type));
  assert.deepEqual([...spotIds].sort(), [...wheelTypes].sort());
});

// Deterministic round: floats → result shape.
test("crazyRound resolves a number segment deterministically", () => {
  // floats chosen so wheel index 0 ("1") is hit and top slot misses the spot.
  const f = [0.001, 0.95, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5];
  const r = crazyRound(f, "1");
  assert.equal(r.wheelIndex, 0);
  assert.equal(r.segment, "1");
  assert.equal(r.win, true);
  assert.equal(r.multiplier, 2); // 1 + 1×1 (top slot missed "1")
});

test("crazyRound resolves a bonus segment with top slot boost", () => {
  // wheel index 35 = "crazy" segment, top slot lands crazy ×5 (range index 6).
  const idx35 = 35 / 54 + 0.001;
  const topSeg = 7 / 8 + 0.01; // SPOT_TYPES[7] = "crazy"
  const topMult = 6.5 / 10; // TOP_SLOT_RANGES.crazy[6] = 5
  const f = [idx35, topSeg, topMult, 0.001, 0.999, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5];
  const r = crazyRound(f, "crazy");
  assert.equal(r.segment, "crazy");
  assert.equal(r.win, true);
  assert.equal(r.topSlot?.segment, "crazy");
  assert.equal(r.topSlot?.multiplier, 5);
  // bonus wheel stop 0 = 10, no doubles → profit 10×5 = 50, return 51.
  assert.equal(r.bonus?.kind, "crazy");
  assert.equal(r.multiplier, 51);
});

// Calibration: per-spot RTP within 1.5 points of the classic targets.
test("crazy per-spot RTP stays within calibration band (400k rounds, splitmix64)", () => {
  let s = 0x9e3779b97f4a7c15n;
  const u = () => {
    s = (s + 0x9e3779b97f4a7c15n) & 0xffffffffffffffffn;
    let z = s;
    z = ((z ^ (z >> 30n)) * 0xbf58476d1ce4e5b9n) & 0xffffffffffffffffn;
    z = ((z ^ (z >> 27n)) * 0x94d049bb133111ebn) & 0xffffffffffffffffn;
    z = z ^ (z >> 31n);
    return Number(z) / 18446744073709551616;
  };
  const targets = {
    "1": 96.08,
    "2": 95.95,
    "5": 95.78,
    "10": 95.73,
    coinflip: 95.7,
    cashhunt: 95.27,
    pachinko: 94.33,
    crazy: 94.41,
  };
  const N = 400_000;
  for (const spot of Object.keys(targets)) {
    let ret = 0;
    for (let i = 0; i < N; i++) {
      const f = Array.from({ length: 16 }, () => u());
      const r = crazyRound(f, spot);
      if (r.win) ret += r.multiplier;
    }
    const rtp = (ret / N) * 100;
    const target = targets[spot];
    assert.ok(
      Math.abs(rtp - target) < 1.5,
      `spot ${spot}: RTP ${rtp.toFixed(2)}% drifted from target ${target}%`,
    );
    // House edge must exist on every spot (no player-positive game).
    assert.ok(rtp < 100, `spot ${spot}: RTP ${rtp}% must stay under 100%`);
  }
});
test("crazy wheel uses HYPE skin fills (no classic Evolution blue/gold)", () => {
  const colors = new Set(CRAZY_WHEEL.map((s) => s.color));
  assert.equal(colors.has("#1d63ff"), false);
  assert.equal(colors.has("#e8b84a"), false);
  assert.ok(colors.has("#904bf9"), "primary purple present");
  assert.ok(colors.has("#ea2fd4"), "vip pink on crazy segment");
});
