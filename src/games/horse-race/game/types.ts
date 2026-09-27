import { oddsFor, TRUE_P } from "./rtp";
export type Screen = "start" | "betting" | "countdown" | "racing" | "result" | "gameover";

import type { HorseArt } from "./horseArt";

export interface HorsePalette {
  coat: string;
  coatLight: string;
  coatDark: string;
  mane: string;
  silk: string;
  silkDark: string;
  cap: string;
  cloth: string;
}

export interface Horse {
  id: number;
  name: string;
  color: string;
  odds: number;
  baseSpeed: number;
  volatility: number;
  pop: number; // popularity weight for bots
  palette: HorsePalette;
  /** Vector renderer palette (reference design). Derived from `palette` at load. */
  art?: HorseArt;
}

export interface Runner {
  horse: Horse;
  x: number;
  momentum: number;
  finished: boolean;
  place: number;
}

export interface Player {
  id: string;
  name: string;
  hue: number;
  bet: number;
  horseId: number;
  potential: number;
  isYou: boolean;
  win?: boolean;
  payout?: number;
}

export interface FeedItem {
  id: number;
  kind: "join" | "win" | "bigwin";
  text: string;
  amount: number;
  horseId: number;
  ts: number;
}

export interface HighScore {
  name: string;
  score: number;
  date: number;
}

export const MIN_BET = 10;

/**
 * NOTE: `odds` on each Horse below is a placeholder — the authoritative value
 * is derived from the RTP engine (odds = RTP / P(win)) and patched in at the
 * bottom of this module so the paytable can never drift from the maths.
 */

export const HORSES: Horse[] = [
  {
    id: 0,
    name: "Crimson Bolt",
    color: "#e63946",
    odds: 2.0,
    baseSpeed: 0.00235,
    volatility: 0.20,
    pop: 30,
    palette: {
      coat: "#e63946",
      coatLight: "#ff7b85",
      coatDark: "#8a1c27",
      mane: "#1a0c0e",
      silk: "#ffffff",
      silkDark: "#c9d1dd",
      cap: "#e63946",
      cloth: "#ffffff",
    },
  },
  {
    id: 1,
    name: "Azure Rocket",
    color: "#3d7bff",
    odds: 2.8,
    baseSpeed: 0.00228,
    volatility: 0.28,
    pop: 24,
    palette: {
      coat: "#3d7bff",
      coatLight: "#7fb0ff",
      coatDark: "#1e3f9c",
      mane: "#0a1533",
      silk: "#ffd23f",
      silkDark: "#d1a417",
      cap: "#1e3f9c",
      cloth: "#ffd23f",
    },
  },
  {
    id: 2,
    name: "Lime Ghost",
    color: "#00ffbd",
    odds: 4.2,
    baseSpeed: 0.0022,
    volatility: 0.4,
    pop: 18,
    palette: {
      coat: "#00ffbd",
      coatLight: "#8dffe4",
      coatDark: "#009c73",
      mane: "#053a2c",
      silk: "#0d0d10",
      silkDark: "#000000",
      cap: "#00ffbd",
      cloth: "#0d0d10",
    },
  },
  {
    id: 3,
    name: "Solar Flare",
    color: "#ffb703",
    odds: 6.5,
    baseSpeed: 0.00212,
    volatility: 0.55,
    pop: 13,
    palette: {
      coat: "#ffb703",
      coatLight: "#ffe08a",
      coatDark: "#b36a00",
      mane: "#3a2400",
      silk: "#904bf9",
      silkDark: "#5e2bb5",
      cap: "#ffb703",
      cloth: "#904bf9",
    },
  },
  {
    id: 4,
    name: "Fluo Phantom",
    color: "#904bf9",
    odds: 11,
    baseSpeed: 0.00202,
    volatility: 0.72,
    pop: 8,
    palette: {
      coat: "#904bf9",
      coatLight: "#c39dff",
      coatDark: "#4b2394",
      mane: "#1c0529",
      silk: "#00ffbd",
      silkDark: "#009c73",
      cap: "#ffffff",
      cloth: "#00ffbd",
    },
  },
  {
    id: 5,
    name: "Silver Whale",
    color: "#f4f4f5",
    odds: 20,
    baseSpeed: 0.0019,
    volatility: 0.9,
    pop: 5,
    palette: {
      coat: "#f4f4f5",
      coatLight: "#ffffff",
      coatDark: "#9ea0a8",
      mane: "#2a2a30",
      silk: "#e63946",
      silkDark: "#8a1c27",
      cap: "#0d0d10",
      cloth: "#e63946",
    },
  },
];

export function makeRunners(): Runner[] {
  return HORSES.map((h) => ({ horse: h, x: 0, momentum: 0, finished: false, place: 0 }));
}

// ---- Authoritative paytable: derive odds + win chance from the RTP engine ----
export function artOf(h: Horse): HorseArt {
  return h.art!;
}

const SILK_PATTERNS: HorseArt["silkPattern"][] = ["stripe", "chevron", "hoop", "star", "split", "hoop"];
for (const h of HORSES) {
  h.odds = oddsFor(h.id);
  h.pop = Math.round(TRUE_P[h.id] * 100);
  h.art = {
    color: h.palette.coat,
    accent: h.palette.coatLight,
    dark: h.palette.coatDark,
    silk: h.palette.silk,
    silkPattern: SILK_PATTERNS[h.id % SILK_PATTERNS.length],
  };
}
