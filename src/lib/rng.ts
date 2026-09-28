import { crashPointFromFloat, pickWeighted, pickWeightedInt, shuffleInt } from "@/lib/fair";

/** House-edge crash point, Bustabit-style. Instant 1.00x with probability = edge. */
export function crashPoint(edge = 0.04, u = Math.random()): number {
  return crashPointFromFloat(u, edge);
}

const CRASH_GROWTH = 0.08;

export function crashMultiplierAt(elapsedMs: number, growth = CRASH_GROWTH): number {
  const t = Math.max(0, elapsedMs) / 1000;
  return Math.floor(100 * Math.exp(growth * t)) / 100;
}

export function crashElapsedFor(multiplier: number, growth = CRASH_GROWTH): number {
  if (multiplier <= 1) return 0;
  return (Math.log(multiplier) / growth) * 1000;
}

export function newRoundId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `r_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 10)}`;
}

export const ROULETTE_REDS = new Set([
  1, 3, 5, 7, 9, 12, 14, 16, 18, 19, 21, 23, 25, 27, 30, 32, 34, 36,
]);

/** European wheel order, clockwise from 0. */
export const EURO_WHEEL = [
  0, 32, 15, 19, 4, 21, 2, 25, 17, 34, 6, 27, 13, 36, 11, 30, 8, 23, 10, 5, 24, 16, 33, 1, 20, 14,
  31, 9, 22, 18, 29, 7, 28, 12, 35, 3, 26,
];

export function rouletteColor(n: number): "red" | "black" | "green" {
  if (n === 0) return "green";
  return ROULETTE_REDS.has(n) ? "red" : "black";
}

/** Inclusive-stake multiplier. 0 = miss. Even money = 2×, dozen = 3×, straight/0 = 36×. */
export function rouletteMultiplier(number: number, choice: string): number {
  const color = rouletteColor(number);
  if (choice === "red" || choice === "black") return color === choice ? 2 : 0;
  if (choice === "green") return number === 0 ? 36 : 0;
  if (choice === "odd") return number > 0 && number % 2 === 1 ? 2 : 0;
  if (choice === "even") return number > 0 && number % 2 === 0 ? 2 : 0;
  if (choice === "low") return number >= 1 && number <= 18 ? 2 : 0;
  if (choice === "high") return number >= 19 && number <= 36 ? 2 : 0;
  if (choice === "dozen1") return number >= 1 && number <= 12 ? 3 : 0;
  if (choice === "dozen2") return number >= 13 && number <= 24 ? 3 : 0;
  if (choice === "dozen3") return number >= 25 && number <= 36 ? 3 : 0;
  const n = Number(choice);
  if (Number.isInteger(n) && n >= 0 && n <= 36) return n === number ? 36 : 0;
  return 0;
}

export const SLOT_SYMBOLS = ["7", "BAR", "A", "K", "Q", "J", "◆"] as const;
export type SlotSymbol = (typeof SLOT_SYMBOLS)[number];

export const SLOT_WEIGHTS = [4, 6, 10, 12, 14, 16, 18];

export function spinReel(u = Math.random()): SlotSymbol {
  return SLOT_SYMBOLS[pickWeighted(u, [...SLOT_WEIGHTS])]!;
}

export function spinReelInt(draw: (rangeMax: number) => number): SlotSymbol {
  return SLOT_SYMBOLS[pickWeightedInt(draw, [...SLOT_WEIGHTS])]!;
}

export function slotsPayout(reels: [SlotSymbol, SlotSymbol, SlotSymbol], bet: number): number {
  const [a, b, c] = reels;
  if (a === b && b === c) {
    if (a === "7") return bet * 25;
    if (a === "BAR") return bet * 12;
    if (a === "◆") return bet * 8;
    return bet * 5;
  }
  if (a === b || b === c || a === c) return bet * 1.5;
  return 0;
}

const RANKS = ["A", "2", "3", "4", "5", "6", "7", "8", "9", "10", "J", "Q", "K"] as const;
const SUITS = ["♠", "♥", "♦", "♣"] as const;
export type Rank = (typeof RANKS)[number];
export type Suit = (typeof SUITS)[number];
export type PlayingCard = { rank: Rank; suit: Suit };

export function orderedShoe(decks = 4): PlayingCard[] {
  const cards: PlayingCard[] = [];
  for (let d = 0; d < decks; d += 1) {
    for (const suit of SUITS) {
      for (const rank of RANKS) cards.push({ rank, suit });
    }
  }
  return cards;
}

export function shuffleWith(cards: PlayingCard[], floats: number[]): PlayingCard[] {
  const out = cards.slice();
  let k = 0;
  for (let i = out.length - 1; i > 0; i -= 1) {
    const u = floats[k % floats.length] ?? 0.5;
    k += 1;
    const j = Math.floor(u * (i + 1));
    const tmp = out[i]!;
    out[i] = out[j]!;
    out[j] = tmp;
  }
  return out;
}

export function freshShoe(
  decks = 6,
  entropy?: number[] | { int: (rangeMax: number) => number },
): PlayingCard[] {
  const cards = orderedShoe(decks);
  if (entropy && typeof entropy === "object" && "int" in entropy) {
    return shuffleInt(cards, (n) => entropy.int(n));
  }
  if (Array.isArray(entropy) && entropy.length) return shuffleWith(cards, entropy);
  for (let i = cards.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    const tmp = cards[i]!;
    cards[i] = cards[j]!;
    cards[j] = tmp;
  }
  return cards;
}

export function handValue(cards: PlayingCard[]): { total: number; soft: boolean } {
  let total = 0;
  let aces = 0;
  for (const c of cards) {
    if (c.rank === "A") {
      aces += 1;
      total += 11;
    } else if (c.rank === "K" || c.rank === "Q" || c.rank === "J") {
      total += 10;
    } else {
      total += Number(c.rank);
    }
  }
  while (total > 21 && aces > 0) {
    total -= 10;
    aces -= 1;
  }
  return { total, soft: aces > 0 };
}

export function isBlackjack(cards: PlayingCard[]): boolean {
  return cards.length === 2 && handValue(cards).total === 21;
}
