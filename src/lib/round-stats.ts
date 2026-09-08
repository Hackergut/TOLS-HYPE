import type { FairProof } from "@/lib/fair";
import type { RoundView } from "@/lib/bet-history";

export type RoundSnap = {
  win: boolean;
  label: string;
  stake?: number;
  payout?: number;
  multiplier?: number;
  replay?: () => void;
  fair?: FairProof | null;
  view?: RoundView | null;
};

export type RoundRecord = {
  win: boolean;
  label: string;
  stake: number;
  payout: number;
  multiplier: number;
  at: number;
};

export type RoundAnalysis = {
  plays: number;
  wins: number;
  losses: number;
  winRate: number;
  last10Rate: number;
  streakKind: "W" | "L" | "-";
  streak: number;
  bestWinStreak: number;
  volume: number;
  returned: number;
  net: number;
  bestMult: number;
  biggestWin: number;
  lastLabel: string | null;
  heat: "hot" | "cold" | "even";
  recent: RoundRecord[];
};

const KEY = (id: string) => `tols-rounds:${id}`;
const MAX = 80;

export function loadRounds(id: string): RoundRecord[] {
  if (typeof window === "undefined" || !id) return [];
  try {
    const raw = window.localStorage.getItem(KEY(id));
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function saveRounds(id: string, rounds: RoundRecord[]) {
  window.localStorage.setItem(KEY(id), JSON.stringify(rounds.slice(0, MAX)));
}

export function appendRound(id: string, snap: RoundSnap, existing: RoundRecord[]): RoundRecord[] {
  const rec: RoundRecord = {
    win: snap.win,
    label: snap.label,
    stake: snap.stake ?? 0,
    payout: snap.payout ?? (snap.win ? snap.stake ?? 0 : 0),
    multiplier: snap.multiplier ?? (snap.stake && snap.payout ? snap.payout / snap.stake : snap.win ? 1 : 0),
    at: Date.now(),
  };
  const next = [rec, ...existing].slice(0, MAX);
  saveRounds(id, next);
  return next;
}

export function analyzeRounds(rounds: RoundRecord[]): RoundAnalysis {
  const plays = rounds.length;
  const wins = rounds.filter((r) => r.win).length;
  const losses = plays - wins;
  const winRate = plays ? Math.round((wins / plays) * 100) : 0;
  const last10 = rounds.slice(0, 10);
  const last10Rate = last10.length
    ? Math.round((last10.filter((r) => r.win).length / last10.length) * 100)
    : 0;

  let streakKind: "W" | "L" | "-" = "-";
  let streak = 0;
  if (rounds[0]) {
    streakKind = rounds[0].win ? "W" : "L";
    for (const r of rounds) {
      if ((streakKind === "W") !== r.win) break;
      streak += 1;
    }
  }

  let bestWinStreak = 0;
  let run = 0;
  for (const r of [...rounds].reverse()) {
    if (r.win) {
      run += 1;
      if (run > bestWinStreak) bestWinStreak = run;
    } else run = 0;
  }

  const volume = rounds.reduce((s, r) => s + r.stake, 0);
  const returned = rounds.reduce((s, r) => s + r.payout, 0);
  const net = returned - volume;
  const bestMult = rounds.reduce((m, r) => Math.max(m, r.multiplier), 0);
  const biggestWin = rounds.reduce((m, r) => Math.max(m, r.payout), 0);

  let heat: "hot" | "cold" | "even" = "even";
  if (last10.length >= 5) {
    if (last10Rate >= 60) heat = "hot";
    else if (last10Rate <= 30) heat = "cold";
  }

  return {
    plays,
    wins,
    losses,
    winRate,
    last10Rate,
    streakKind,
    streak,
    bestWinStreak,
    volume,
    returned,
    net,
    bestMult,
    biggestWin,
    lastLabel: rounds[0]?.label ?? null,
    heat,
    recent: rounds.slice(0, 20),
  };
}
