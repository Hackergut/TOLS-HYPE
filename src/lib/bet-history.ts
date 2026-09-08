import { useSyncExternalStore } from "react";
import type { FairProof } from "@/lib/fair";
import type { GameKind } from "@/lib/games-catalog";

export type RoundView =
  | { kind: "dice"; roll: number; over?: boolean; target?: number }
  | { kind: "roulette"; number: number; color: string }
  | { kind: "slots"; reels: string[] }
  | { kind: "crash"; crashAt?: number; cashAt?: number }
  | { kind: "mines"; boom?: boolean; multiplier?: number }
  | { kind: "keno"; hits: number }
  | { kind: "hilo"; label: string }
  | { kind: "blackjack"; outcome: string }
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

export function shareText(r: BetRound) {
  const result = r.win ? "WIN" : "LOSE";
  const lines = [
    `TOLS ${r.title} · ${result} ${r.multiplier ? `${r.multiplier.toFixed(2)}×` : ""}`.trim(),
    r.label,
    r.stake
      ? `Stake ${r.stake} ${r.currency} → ${r.payout} ${r.currency}`
      : undefined,
    r.fair ? `Hash ${r.fair.serverHash}` : undefined,
    r.fair ? `Seed ${r.fair.clientSeed} · nonce ${r.fair.nonce}` : undefined,
    `id ${r.id}`,
  ].filter(Boolean);
  return lines.join("\n");
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
  const text = `${round.win ? "W" : "L"} ${round.title} · ${round.label}`;
  chatListeners.forEach((fn) => fn({ user, text, round }));
}
