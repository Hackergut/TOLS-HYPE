import { crazyRound, type CrazyBetSpot } from "@/lib/crazy-tols";
import { crashPointFromFloat } from "@/lib/fair";
import { crashElapsedFor, crashMultiplierAt } from "@/lib/rng";

/** Shared wall-clock so every client sees the same crash / crazy round. */
const GENESIS = Date.UTC(2026, 0, 1);
const BET_MS = 6000;
const GAP_MS = 2800;

export function crashGrowth(gameId: string): number {
  return gameId === "orbit-crash" ? 0.045 : 0.08;
}

function u32(seed: string): number {
  let h = 2166136261;
  for (let i = 0; i < seed.length; i += 1) {
    h ^= seed.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

export function liveFloat(seed: string): number {
  return u32(seed) / 4294967296;
}

export function liveFloats(seed: string, count: number): number[] {
  return Array.from({ length: count }, (_, i) => liveFloat(`${seed}:${i}`));
}

export type LiveCrash = {
  phase: "betting" | "running" | "crashed";
  n: number;
  crashAt: number;
  startedAt: number;
  left: number;
  elapsed: number;
  display: number;
};

type Cursor = { n: number; t: number };
const cursors = new Map<string, Cursor>();

export function liveCrashRound(now: number, gameId: string, edge = 0.04, growth = crashGrowth(gameId)): LiveCrash {
  const key = `${gameId}:${edge}:${growth}`;
  let cur = cursors.get(key) ?? { n: 0, t: GENESIS };
  if (cur.t > now + 1000) cur = { n: 0, t: GENESIS };
  for (let guard = 0; guard < 4_000_000; guard += 1) {
    const crashAt = crashPointFromFloat(liveFloat(`${gameId}:crash:${cur.n}`), edge);
    const flight = Math.min(crashElapsedFor(crashAt, growth), 90_000);
    const end = cur.t + BET_MS + flight + GAP_MS;
    if (now < end) {
      cursors.set(key, cur);
      const startedAt = cur.t + BET_MS;
      if (now < startedAt) {
        return { phase: "betting", n: cur.n, crashAt, startedAt, left: startedAt - now, elapsed: 0, display: 1 };
      }
      const elapsed = now - startedAt;
      const display = crashMultiplierAt(elapsed, growth);
      if (display >= crashAt || elapsed >= flight) {
        return { phase: "crashed", n: cur.n, crashAt, startedAt, left: 0, elapsed, display: crashAt };
      }
      return { phase: "running", n: cur.n, crashAt, startedAt, left: 0, elapsed, display };
    }
    cur = { n: cur.n + 1, t: end };
  }
  return { phase: "betting", n: 0, crashAt: 1, startedAt: now, left: BET_MS, elapsed: 0, display: 1 };
}

const CRAZY_CYCLE = 14_000;
const CRAZY_BET = 8_000;

export function liveCrazyRound(now: number, spot: CrazyBetSpot = "1") {
  const slot = Math.floor((now - GENESIS) / CRAZY_CYCLE);
  const into = (now - GENESIS) % CRAZY_CYCLE;
  const floats = liveFloats(`crazy-tols:${slot}`, 16);
  const result = crazyRound(floats, spot);
  const phase = into < CRAZY_BET ? "betting" : into < CRAZY_BET + 3500 ? "spin" : "result";
  return {
    slot,
    phase: phase as "betting" | "spin" | "result",
    left: Math.max(0, CRAZY_BET - into),
    result,
    floats,
  };
}
