import { useSyncExternalStore } from "react";
import type { FairProof } from "@/lib/fair";
import type { GameKind } from "@/lib/games-catalog";

export type SnapCard = { rank: string | number; suit: string };

export type RoundView =
  | { kind: "dice"; roll: number; over?: boolean; target?: number }
  | { kind: "roulette"; number: number; color: string }
  | { kind: "slots"; reels: string[] }
  | { kind: "crash"; crashAt?: number; cashAt?: number }
  | { kind: "mines"; boom?: boolean; multiplier?: number; revealed?: number[]; mines?: number[] }
  | { kind: "keno"; hits: number; picks?: number; selected?: number[]; drawn?: number[] }
  | { kind: "hilo"; label: string; pick?: "higher" | "lower"; prev?: number; next?: number; prevSuit?: string; nextSuit?: string }
  | { kind: "blackjack"; outcome: string; playerTotal?: number; dealerTotal?: number; player?: SnapCard[]; dealer?: SnapCard[] }
  | { kind: "pool"; balls: number; scratch?: boolean; pocketed?: number[] };

export type BetRound = {
  id: string;
  gameId: string;
  title: string;
  kind: GameKind | string;
  win: boolean;
  label: string;
  stake: number;
  payout: number;
  multiplier: number;
  currency: string;
  fair: FairProof | null;
  view: RoundView | null;
  at: number;
};

const KEY = "tols-bets";
const MAX = 200;
const listeners = new Set<() => void>();
let cache: BetRound[] | null = null;

function read(): BetRound[] {
  if (cache) return cache;
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    cache = Array.isArray(parsed) ? parsed : [];
  } catch {
    cache = [];
  }
  return cache;
}

function write(next: BetRound[]) {
  cache = next.slice(0, MAX);
  if (typeof window !== "undefined") window.localStorage.setItem(KEY, JSON.stringify(cache));
  listeners.forEach((l) => l());
}

export function loadBets(): BetRound[] {
  return read();
}

export function loadBetsFor(gameId: string): BetRound[] {
  return read().filter((r) => r.gameId === gameId);
}

export function getBet(id: string): BetRound | undefined {
  return read().find((r) => r.id === id);
}

export function recordBet(round: BetRound) {
  write([round, ...read().filter((r) => r.id !== round.id)]);
}

export function newBetId() {
  return `r_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

export function useBetHistory(gameId?: string) {
  const all = useSyncExternalStore(
    (cb) => {
      listeners.add(cb);
      return () => listeners.delete(cb);
    },
    read,
    () => [],
  );
  return gameId ? all.filter((r) => r.gameId === gameId) : all;
}

export function shortHash(hash: string, chars = 8): string {
  return hash.replace(/[^0-9a-f]/gi, "").slice(0, chars).toLowerCase();
}

export function shareText(r: BetRound) {
  const result = r.win ? "WIN" : "LOSE";
  const tag = r.fair ? `#${shortHash(r.fair.serverHash)}` : "";
  const nonce = r.fair ? `n${r.fair.nonce}` : "";
  return [`TOLS ${r.title} ${result} ${r.label}`, r.stake ? `${r.stake} ${r.currency} → ${r.payout} ${r.currency}` : null, tag, nonce]
    .filter(Boolean)
    .join(" · ");
}

type ChatPayload = { user: string; text: string; round?: BetRound };
const chatListeners = new Set<(msg: ChatPayload) => void>();

export function subscribeChatShare(fn: (msg: ChatPayload) => void) {
  chatListeners.add(fn);
  return () => {
    chatListeners.delete(fn);
  };
}

export function shareBetToChat(user: string, round: BetRound) {
  const tag = round.fair ? `#${shortHash(round.fair.serverHash)}` : "";
  const text = `${round.win ? "W" : "L"} ${round.title} · ${round.label}${tag ? ` ${tag}` : ""}`;
  chatListeners.forEach((fn) => fn({ user, text, round }));
}
