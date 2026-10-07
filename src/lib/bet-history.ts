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
  | { kind: "pool"; balls: number; scratch?: boolean; pocketed?: number[] }
  | { kind: "limbo"; roll: number; target: number }
  | { kind: "plinko"; bucket: number; multiplier: number }
  | { kind: "tower"; row: number; boom?: boolean }
  | { kind: "crazy"; segment: string; topSlot?: number; bonus?: string; multiplier?: number };

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

const WIN_TAGS = "tols-win-tags";

export function roundShareTag(round: BetRound): string {
  const id = round.fair ? shortHash(round.fair.serverHash, 8) : round.id.slice(-8).toLowerCase();
  return `${round.title}: ${id}`;
}

function readWinTags(): Record<string, BetRound> {
  if (typeof window === "undefined") return {};
  try {
    const raw = window.localStorage.getItem(WIN_TAGS);
    const parsed = raw ? JSON.parse(raw) : {};
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    return {};
  }
}

/** Stores the round so a pasted tag like "Keno: e6fe9026" can be shared in chat. */
export function saveWinTag(round: BetRound): string {
  const tag = roundShareTag(round);
  const id = tag.split(": ").pop()?.toLowerCase() ?? tag.toLowerCase();
  const all = readWinTags();
  all[tag.toLowerCase()] = round;
  all[id] = round;
  const keys = Object.keys(all);
  for (const key of keys.slice(0, Math.max(0, keys.length - 24))) delete all[key];
  if (typeof window !== "undefined") window.localStorage.setItem(WIN_TAGS, JSON.stringify(all));
  return tag;
}

export function winRoundForTag(text: string): BetRound | null {
  const all = readWinTags();
  const lower = text.toLowerCase();
  const keys = Object.keys(all).sort((a, b) => b.length - a.length);
  for (const key of keys) {
    if (key.length >= 6 && lower.includes(key)) return all[key] ?? null;
  }
  return null;
}

let chatDraft = "";
const draftListeners = new Set<(text: string) => void>();

export function pushChatDraft(text: string) {
  chatDraft = text;
  draftListeners.forEach((fn) => fn(text));
}

export function subscribeChatDraft(fn: (text: string) => void) {
  draftListeners.add(fn);
  if (chatDraft) fn(chatDraft);
  return () => {
    draftListeners.delete(fn);
  };
}

/** Sync copy that still works inside the preview iframe. */
export function copyText(value: string): boolean {
  try {
    const area = document.createElement("textarea");
    area.value = value;
    area.setAttribute("readonly", "");
    area.style.cssText = "position:fixed;top:0;left:0;width:2px;height:2px;padding:0;border:0;outline:none;box-shadow:none;background:transparent;";
    document.body.appendChild(area);
    area.focus();
    area.select();
    area.setSelectionRange(0, value.length);
    const ok = document.execCommand("copy");
    area.remove();
    return ok;
  } catch {
    return false;
  }
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
