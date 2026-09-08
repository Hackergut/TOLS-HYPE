import { crashPointFromFloat, pickWeighted } from "@/lib/fair";

/** House-edge crash point, Bustabit-style. Instant 1.00x with probability = edge. */
export function crashPoint(edge = 0.04, u = Math.random()): number {
  return crashPointFromFloat(u, edge);
}

const CRASH_GROWTH = 0.08;

export function crashMultiplierAt(elapsedMs: number): number {
  const t = Math.max(0, elapsedMs) / 1000;
  return Math.floor(100 * Math.exp(CRASH_GROWTH * t)) / 100;
}

export function crashElapsedFor(multiplier: number): number {
  if (multiplier <= 1) return 0;
  return (Math.log(multiplier) / CRASH_GROWTH) * 1000;
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

export function rouletteColor(n: number): "red" | "black" | "green" {
  if (n === 0) return "green";
  return ROULETTE_REDS.has(n) ? "red" : "black";
}

export const SLOT_SYMBOLS = ["7", "BAR", "A", "K", "Q", "J", "◆"] as const;
export type SlotSymbol = (typeof SLOT_SYMBOLS)[number];

export const SLOT_WEIGHTS = [4, 6, 10, 12, 14, 16, 18];

export function spinReel(u = Math.random()): SlotSymbol {
  return SLOT_SYMBOLS[pickWeighted(u, [...SLOT_WEIGHTS])]!;
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

export function freshShoe(decks = 6, floats?: number[]): PlayingCard[] {
  const cards = orderedShoe(decks);
  if (floats?.length) return shuffleWith(cards, floats);
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
