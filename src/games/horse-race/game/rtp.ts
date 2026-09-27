import { fairFloats } from "./fair";

/**
 * ============================================================
 *  RTP ENGINE
 * ============================================================
 *
 * The problem with "just animate 6 horses randomly and pay fixed odds" is
 * that the real win probability is an emergent property of the physics —
 * nobody knows what it is, so the RTP is undefined and almost certainly
 * not what the paytable implies.
 *
 * This engine inverts the relationship:
 *
 *   1. TRUE_P[]  — the declared win probability of every runner (sums to 1).
 *   2. odds[i]   = TARGET_RTP / TRUE_P[i]      ← payout derived from math
 *   3. RTP[i]    = TRUE_P[i] * odds[i] ≡ TARGET_RTP  (exact, by construction)
 *
 * The winner is drawn from TRUE_P using a provably-fair float, and the
 * animation is then *choreographed* to deliver that result. So what the
 * player sees always matches the published maths.
 *
 *   House edge = 1 − RTP
 */

/** Published return to player on the base game. */
export const TARGET_RTP = 0.96;

/** House edge, derived. */
export const HOUSE_EDGE = 1 - TARGET_RTP;

/** Declared win probability per runner (index = horse id). MUST sum to 1. */
export const TRUE_P: number[] = [0.32, 0.24, 0.18, 0.13, 0.085, 0.045];

/** Runner-up shape: how strongly favourites also take 2nd/3rd place. */
const PLACE_BIAS = 0.75;

/** Payout multiplier for a runner, derived from probability + RTP. */
export function oddsFor(horseId: number): number {
  const p = TRUE_P[horseId];
  return Math.round((TARGET_RTP / p) * 100) / 100;
}

/** Exact RTP delivered by a single runner after odds rounding. */
export function rtpFor(horseId: number): number {
  return TRUE_P[horseId] * oddsFor(horseId);
}

/** Implied (fair, zero-edge) probability the paytable advertises. */
export function impliedP(horseId: number): number {
  return 1 / oddsFor(horseId);
}

/** Field-average RTP if a player bet the same stake on every runner. */
export function fieldRTP(): number {
  return TRUE_P.reduce((a, _, i) => a + rtpFor(i), 0) / TRUE_P.length;
}

/** RTP weighted by where the lobby's money actually sits. */
export function weightedRTP(stakePerHorse: number[]): number {
  const total = stakePerHorse.reduce((a, b) => a + b, 0);
  if (total <= 0) return fieldRTP();
  return stakePerHorse.reduce((a, s, i) => a + (s / total) * rtpFor(i), 0);
}

export interface RoundOutcome {
  /** Finish order, first place first. */
  order: number[];
  winnerId: number;
  /** The raw provably-fair floats consumed, for the verifier UI. */
  floats: number[];
  /** Normalised finishing margins (0 = blanket finish, 1 = strung out). */
  margins: number[];
  photoFinish: boolean;
}

/** Pick an index from `weights` using a uniform float. */
function pickWeighted(weights: number[], r: number): number {
  const total = weights.reduce((a, b) => a + b, 0);
  let acc = 0;
  const x = r * total;
  for (let i = 0; i < weights.length; i++) {
    acc += weights[i];
    if (x < acc) return i;
  }
  return weights.length - 1;
}

/**
 * Derive a full finishing order from the provably-fair stream.
 *
 * First place is drawn from TRUE_P exactly — this is what guarantees the RTP.
 * Remaining places use the same weights (softened by PLACE_BIAS) without
 * replacement, so favourites still tend to fill the frame.
 */
export function resolveRound(
  serverSeed: string,
  clientSeed: string,
  nonce: number,
  runners = TRUE_P.length,
): RoundOutcome {
  // runners floats for the order + 1 for margins
  const floats = fairFloats(serverSeed, clientSeed, nonce, runners + 1);

  const pool = Array.from({ length: runners }, (_, i) => i);
  const weights = pool.map((i) => TRUE_P[i]);
  const order: number[] = [];

  for (let place = 0; place < runners; place++) {
    const w = weights.map((x) => (place === 0 ? x : Math.pow(x, PLACE_BIAS)));
    const k = pickWeighted(w, floats[place]);
    order.push(pool[k]);
    pool.splice(k, 1);
    weights.splice(k, 1);
  }

  // Margin profile: how tight the finish is.
  const tight = floats[runners];
  const photoFinish = tight < 0.18;
  const spread = photoFinish ? 0.1 + tight : 0.35 + tight * 0.65;
  const margins = order.map((_, i) => (i === 0 ? 0 : spread * (i / runners) + tight * 0.05 * i));

  return { order, winnerId: order[0], floats, margins, photoFinish };
}

/** Everything the fairness panel needs to show. */
export interface PaytableRow {
  horseId: number;
  trueP: number;
  odds: number;
  impliedP: number;
  rtp: number;
  edge: number;
}

export function paytable(): PaytableRow[] {
  return TRUE_P.map((p, i) => ({
    horseId: i,
    trueP: p,
    odds: oddsFor(i),
    impliedP: impliedP(i),
    rtp: rtpFor(i),
    edge: 1 - rtpFor(i),
  }));
}

/** Streak bonus is a disclosed promo on top of base RTP. */
export const STREAK_STEPS: number[] = [1, 1.05, 1.1, 1.18, 1.3];

export function streakMultiplier(streak: number): number {
  return STREAK_STEPS[Math.min(streak, STREAK_STEPS.length - 1)];
}

/** Effective RTP once the streak promo is applied to a runner. */
export function effectiveRTP(horseId: number, streak: number): number {
  return rtpFor(horseId) * streakMultiplier(streak);
}

/**
 * Monte-Carlo self-test: verifies the seeded resolver really converges on
 * TRUE_P. Used by the in-game "Verify" button.
 */
export function simulateRTP(
  serverSeed: string,
  clientSeed: string,
  rounds: number,
): { wins: number[]; freq: number[]; rtp: number } {
  const wins = new Array(TRUE_P.length).fill(0);
  for (let n = 0; n < rounds; n++) {
    wins[resolveRound(serverSeed, clientSeed, n).winnerId]++;
  }
  const freq = wins.map((w) => w / rounds);
  // RTP of a flat 1-unit bet spread evenly across all runners
  const rtp = freq.reduce((a, f, i) => a + f * oddsFor(i), 0) / TRUE_P.length;
  return { wins, freq, rtp };
}
