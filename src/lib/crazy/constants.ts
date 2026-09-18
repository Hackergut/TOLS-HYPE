export type SpotId =
  | "one"
  | "two"
  | "five"
  | "ten"
  | "coinflip"
  | "pachinko"
  | "cashhunt"
  | "crazytime";

export type SpotDef = {
  id: SpotId;
  label: string;
  short: string;
  wheelText: string;
  pays: number | null; // null = bonus round
  color: string;
  color2: string;
  ink: string;
  hotkey: string;
  icon: string;
};

export const SPOTS: Record<SpotId, SpotDef> = {
  one: {
    id: "one",
    label: "1",
    short: "1",
    wheelText: "1",
    pays: 1,
    color: "#FFD84D",
    color2: "#F5A623",
    ink: "#2A1B00",
    hotkey: "Q",
    icon: "①",
  },
  two: {
    id: "two",
    label: "2",
    short: "2",
    wheelText: "2",
    pays: 2,
    color: "#2BA6FF",
    color2: "#1263D6",
    ink: "#00142E",
    hotkey: "W",
    icon: "②",
  },
  five: {
    id: "five",
    label: "5",
    short: "5",
    wheelText: "5",
    pays: 5,
    color: "#FF5FA2",
    color2: "#C31B78",
    ink: "#2B0016",
    hotkey: "E",
    icon: "⑤",
  },
  ten: {
    id: "ten",
    label: "10",
    short: "10",
    wheelText: "10",
    pays: 10,
    color: "#B478FF",
    color2: "#6E27D6",
    ink: "#18002F",
    hotkey: "R",
    icon: "⑩",
  },
  coinflip: {
    id: "coinflip",
    label: "COIN FLIP",
    short: "FLIP",
    wheelText: "COIN",
    pays: null,
    color: "#19E8FF",
    color2: "#0077B6",
    ink: "#001D26",
    hotkey: "A",
    icon: "🪙",
  },
  pachinko: {
    id: "pachinko",
    label: "PACHINKO",
    short: "PACH",
    wheelText: "PACH",
    pays: null,
    color: "#9945FF",
    color2: "#5B14B0",
    ink: "#12002B",
    hotkey: "S",
    icon: "🎯",
  },
  cashhunt: {
    id: "cashhunt",
    label: "CASH HUNT",
    short: "HUNT",
    wheelText: "HUNT",
    pays: null,
    color: "#14F195",
    color2: "#039864",
    ink: "#00281A",
    hotkey: "D",
    icon: "🔫",
  },
  crazytime: {
    id: "crazytime",
    label: "CRAZYTOLS",
    short: "CRAZY",
    wheelText: "CRAZY",
    pays: null,
    color: "#FF3D6E",
    color2: "#A5003B",
    ink: "#2B0010",
    hotkey: "F",
    icon: "🎡",
  },
};

export const SPOT_ORDER: SpotId[] = [
  "one",
  "two",
  "five",
  "ten",
  "coinflip",
  "pachinko",
  "cashhunt",
  "crazytime",
];

export const BONUS_SPOTS: SpotId[] = ["coinflip", "pachinko", "cashhunt", "crazytime"];

/** 54 segment wheel — authentic Crazy Time distribution
 *  1 x21 | 2 x13 | 5 x7 | 10 x4 | CoinFlip x4 | Pachinko x2 | CashHunt x2 | CrazyTime x1 */
export const WHEEL: SpotId[] = [
  "one", "five", "two", "one", "ten", "two", "one", "pachinko", "two",
  "one", "five", "two", "one", "coinflip", "two", "one", "five", "two",
  "one", "cashhunt", "two", "one", "ten", "two", "one", "coinflip", "two",
  "one", "five", "two", "one", "crazytime", "two", "one", "five", "two",
  "one", "coinflip", "two", "one", "ten", "one", "one", "pachinko", "five",
  "one", "one", "cashhunt", "one", "five", "ten", "one", "coinflip", "one",
];

export const CHIPS = [
  { value: 10, color: "#14F195", ring: "#0b8f5b", label: "10" },
  { value: 50, color: "#19E8FF", ring: "#0b7d94", label: "50" },
  { value: 250, color: "#9945FF", ring: "#5a1cab", label: "250" },
  { value: 1000, color: "#FF3D6E", ring: "#8f0a31", label: "1K" },
] as const;

export const START_BALANCE = 1000;
export const MIN_BET = 10;
export const BET_SECONDS = 10;

// Versioned demo math: Top Slot only boosts number bets. The weighted spot
// probabilities and multiplier mean (2.5x) keep exact number RTP in a
// controlled 94.8%-98.2% range instead of the previous over-100% profile.
export const TOP_SLOT_MULTIS = [2, 2, 2, 2, 2, 2, 2, 3, 3, 5] as const;
export const TOP_SLOT_SPOT_WEIGHTS: Readonly<Record<"one" | "two" | "five" | "ten", number>> = {
  one: 35,
  two: 33,
  five: 20,
  ten: 12,
};

export function pickTopSlotSpot(random = Math.random): SpotId {
  const roll = random() * 100;
  if (roll < 35) return "one";
  if (roll < 68) return "two";
  if (roll < 88) return "five";
  return "ten";
}

export const COLORS = {
  sol1: "#9945FF",
  sol2: "#14F195",
  cyan: "#19E8FF",
  bg: "#06060d",
  panel: "#0f0c1d",
};

export function pick<T>(arr: readonly T[]): T {
  return arr[(Math.random() * arr.length) | 0];
}

export function fmt(n: number): string {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(n >= 10_000_000 ? 0 : 2) + "M";
  if (n >= 100_000) return (n / 1000).toFixed(0) + "K";
  return Math.round(n).toLocaleString("en-US");
}

/** weighted random multiplier for the bonus rounds */
export function weightedMulti(min: number, max: number, power = 2.6): number {
  const r = Math.pow(Math.random(), power);
  const v = min + r * (max - min);
  const step = v < 20 ? 1 : v < 100 ? 5 : 25;
  return Math.max(min, Math.round(v / step) * step);
}
