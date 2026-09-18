/**
 * Derby Rush — TOLS Original horse race kernel.
 *
 * Same house-math model as every other TOLS Original: the payout is derived
 * from a declared win probability so the RTP is exact by construction.
 *
 *   TRUE_P[i]  — declared win probability of runner i (sums to 1).
 *   odds[i]    = RTP / TRUE_P[i]          (stake returned, e.g. 3.00x)
 *   RTP[i]     = TRUE_P[i] * odds[i]  ≡ 0.96  per runner
 *
 * The winner is drawn from TRUE_P using the server's provably-fair float
 * stream, then the full finishing order is derived without replacement.
 * The client canvas animates the race to the scripted order, so the finish
 * the player sees always equals the published maths — never the physics.
 */

export const DERBY_RTP = 0.96;
export const DERBY_EDGE = 1 - DERBY_RTP;

/** Declared win probability per runner (index = horse id). */
export const DERBY_TRUE_P: number[] = [0.32, 0.24, 0.18, 0.13, 0.085, 0.045];

/** Runner-up shape: how strongly favourites also fill 2nd/3rd place. */
const PLACE_BIAS = 0.75;

export interface DerbyHorsePalette {
  coat: string;
  coatLight: string;
  coatDark: string;
  mane: string;
  silk: string;
  silkDark: string;
  cap: string;
  cloth: string;
}

export interface DerbyHorse {
  id: number;
  name: string;
  color: string;
  odds: number;
  palette: DerbyHorsePalette;
}

export const DERBY_HORSES: DerbyHorse[] = [
  {
    id: 0,
    name: "Crimson Bolt",
    color: "#e63946",
    odds: 3.0,
    palette: {
      coat: "#e63946", coatLight: "#ff7b85", coatDark: "#8a1c27", mane: "#1a0c0e",
      silk: "#ffffff", silkDark: "#c9d1dd", cap: "#e63946", cloth: "#ffffff",
    },
  },
  {
    id: 1,
    name: "Azure Rocket",
    color: "#3d7bff",
    odds: 4.0,
    palette: {
      coat: "#3d7bff", coatLight: "#7fb0ff", coatDark: "#1e3f9c", mane: "#0a1533",
      silk: "#ffd23f", silkDark: "#d1a417", cap: "#1e3f9c", cloth: "#ffd23f",
    },
  },
  {
    id: 2,
    name: "Lime Ghost",
    color: "#00ffbd",
    odds: 5.33,
    palette: {
      coat: "#00ffbd", coatLight: "#8dffe4", coatDark: "#009c73", mane: "#053a2c",
      silk: "#0d0d10", silkDark: "#000000", cap: "#00ffbd", cloth: "#0d0d10",
    },
  },
  {
    id: 3,
    name: "Solar Flare",
    color: "#ffb703",
    odds: 7.38,
    palette: {
      coat: "#ffb703", coatLight: "#ffe08a", coatDark: "#b36a00", mane: "#3a2400",
      silk: "#904bf9", silkDark: "#5e2bb5", cap: "#ffb703", cloth: "#904bf9",
    },
  },
  {
    id: 4,
    name: "Fluo Phantom",
    color: "#904bf9",
    odds: 11.29,
    palette: {
      coat: "#904bf9", coatLight: "#c39dff", coatDark: "#4b2394", mane: "#1c0529",
      silk: "#00ffbd", silkDark: "#009c73", cap: "#ffffff", cloth: "#00ffbd",
    },
  },
  {
    id: 5,
    name: "Silver Whale",
    color: "#f4f4f5",
    odds: 21.33,
    palette: {
      coat: "#f4f4f5", coatLight: "#ffffff", coatDark: "#9ea0a8", mane: "#2a2a30",
      silk: "#e63946", silkDark: "#8a1c27", cap: "#0d0d10", cloth: "#e63946",
    },
  },
];

// Authoritative paytable — never let the advertised odds drift from the maths.
for (const h of DERBY_HORSES) {
  h.odds = derbyOdds(h.id);
}

export function derbyOdds(horseId: number): number {
  const p = DERBY_TRUE_P[horseId];
  return Math.round((DERBY_RTP / p) * 100) / 100;
}

export function derbyWinChance(horseId: number): number {
  return DERBY_TRUE_P[horseId];
}

/** Exact per-runner RTP after odds rounding. */
export function derbyRtp(horseId: number): number {
  return DERBY_TRUE_P[horseId] * derbyOdds(horseId);
}

export interface DerbyOutcome {
  /** Finish order, first place first. */
  order: number[];
  winnerId: number;
  /** Normalised margins (0 = winner, 1 = spread to the back of the field). */
  margins: number[];
  photoFinish: boolean;
}

function pickWeighted(weights: number[], r: number): number {
  const total = weights.reduce((a, b) => a + b, 0);
  const x = r * total;
  let acc = 0;
  for (let i = 0; i < weights.length; i += 1) {
    acc += weights[i]!;
    if (x < acc) return i;
  }
  return weights.length - 1;
}

/**
 * Derive the full finishing order from the provably-fair stream.
 * First place is drawn from TRUE_P exactly (guarantees the RTP); the rest use
 * the same weights (softened by PLACE_BIAS) without replacement.
 *
 * Consumes `runners + 1` floats.
 */
export function derbyOutcome(floats: number[]): DerbyOutcome {
  const runners = DERBY_TRUE_P.length;
  const pool = Array.from({ length: runners }, (_, i) => i);
  const weights = pool.map((i) => DERBY_TRUE_P[i]!);
  const order: number[] = [];

  for (let place = 0; place < runners; place += 1) {
    const w = weights.map((x) => (place === 0 ? x : Math.pow(x, PLACE_BIAS)));
    const k = pickWeighted(w, floats[place] ?? Math.random());
    order.push(pool[k]!);
    pool.splice(k, 1);
    weights.splice(k, 1);
  }

  const tight = floats[runners] ?? Math.random();
  const photoFinish = tight < 0.18;
  const spread = photoFinish ? 0.1 + tight : 0.35 + tight * 0.65;
  const margins = order.map((_, i) => (i === 0 ? 0 : spread * (i / runners) + tight * 0.05 * i));

  return { order, winnerId: order[0]!, margins, photoFinish };
}

export interface DerbyPayRow {
  horseId: number;
  name: string;
  chance: number;
  odds: number;
  rtp: number;
  edge: number;
}

export function derbyPaytable(): DerbyPayRow[] {
  return DERBY_HORSES.map((h) => ({
    horseId: h.id,
    name: h.name,
    chance: DERBY_TRUE_P[h.id]!,
    odds: derbyOdds(h.id),
    rtp: derbyRtp(h.id),
    edge: 1 - derbyRtp(h.id),
  }));
}
