import { SPOTS, TOP_SLOT_MULTIS, TOP_SLOT_SPOT_WEIGHTS, WHEEL, type SpotId } from "./constants";

export const MATH_VERSION = "CRAZYTOLS-DEMO-1.1";
export const EXPECTED_SEGMENTS: Record<SpotId, number> = {
  one: 21, two: 13, five: 7, ten: 4,
  coinflip: 4, pachinko: 2, cashhunt: 2, crazytime: 1,
};

export type NumberRtp = {
  spot: SpotId;
  hits: number;
  probability: number;
  baseRtp: number;
  topSlotRtp: number;
};

export type MathAudit = {
  version: string;
  passed: boolean;
  errors: string[];
  segments: Record<SpotId, number>;
  topSlotMean: number;
  numberRtp: NumberRtp[];
};

export function auditMath(): MathAudit {
  const errors: string[] = [];
  const segments = Object.fromEntries(Object.keys(EXPECTED_SEGMENTS).map((key) => [key, 0])) as Record<SpotId, number>;
  for (const spot of WHEEL) segments[spot] += 1;
  if (WHEEL.length !== 54) errors.push(`Expected 54 segments, found ${WHEEL.length}.`);
  for (const spot of Object.keys(EXPECTED_SEGMENTS) as SpotId[]) {
    if (segments[spot] !== EXPECTED_SEGMENTS[spot]) errors.push(`${spot}: expected ${EXPECTED_SEGMENTS[spot]}, found ${segments[spot]}.`);
  }
  if (!TOP_SLOT_MULTIS.length || TOP_SLOT_MULTIS.some((value) => !Number.isSafeInteger(value) || value < 1)) errors.push("Top Slot multipliers are invalid.");
  const topWeightTotal = Object.values(TOP_SLOT_SPOT_WEIGHTS).reduce((sum, value) => sum + value, 0);
  if (topWeightTotal !== 100) errors.push(`Top Slot spot weights must total 100, found ${topWeightTotal}.`);
  const topSlotMean = TOP_SLOT_MULTIS.reduce((sum, value) => sum + value, 0) / TOP_SLOT_MULTIS.length;
  const numberRtp = (["one", "two", "five", "ten"] as SpotId[]).map((spot) => {
    const pays = SPOTS[spot].pays!;
    const probability = segments[spot] / WHEEL.length;
    // Current settlement returns stake + profit. Top Slot only selects numbers,
    // using the exact integer weights from the versioned math manifest.
    const baseRtp = probability * (pays + 1);
    const topProbability = TOP_SLOT_SPOT_WEIGHTS[spot as keyof typeof TOP_SLOT_SPOT_WEIGHTS] / 100;
    const topFactor = 1 + topProbability * (topSlotMean - 1);
    const topSlotRtp = probability * (1 + pays * topFactor);
    return { spot, hits: segments[spot], probability, baseRtp, topSlotRtp };
  });
  for (const row of numberRtp) {
    if (row.topSlotRtp < 0.94 || row.topSlotRtp > 0.99) errors.push(`${row.spot}: Top Slot RTP ${(row.topSlotRtp * 100).toFixed(6)}% is outside the approved demo band.`);
  }
  return { version: MATH_VERSION, passed: errors.length === 0, errors, segments, topSlotMean, numberRtp };
}

// Deterministic wheel-frequency smoke test. This validates the sampler, not a certification.
export function simulateWheel(spins = 250_000, seed = 0x4352415a) {
  if (!Number.isSafeInteger(spins) || spins < 1 || spins > 5_000_000) throw new Error("Simulation spins must be between 1 and 5,000,000.");
  let state = seed >>> 0 || 1;
  const counts = Object.fromEntries(Object.keys(EXPECTED_SEGMENTS).map((key) => [key, 0])) as Record<SpotId, number>;
  for (let index = 0; index < spins; index++) {
    state ^= state << 13;
    state ^= state >>> 17;
    state ^= state << 5;
    counts[WHEEL[(state >>> 0) % WHEEL.length]] += 1;
  }
  let maxDeviation = 0;
  for (const spot of Object.keys(EXPECTED_SEGMENTS) as SpotId[]) {
    const expected = EXPECTED_SEGMENTS[spot] / WHEEL.length;
    maxDeviation = Math.max(maxDeviation, Math.abs(counts[spot] / spins - expected));
  }
  return { spins, seed: seed >>> 0, counts, maxDeviation, passed: maxDeviation < 0.005 };
}

export const MATH_AUDIT = auditMath();
if (!MATH_AUDIT.passed) throw new Error(`Invalid CRAZYTOLS math model: ${MATH_AUDIT.errors.join(" ")}`);