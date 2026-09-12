import { loadAnimOn, loadGameSpeed, type GameSpeed } from "@/lib/game-prefs";

export type { GameSpeed };

const DELAY = {
  regular: { step: 90, spin: 1400, deal: 140, reel: 72 },
  fast: { step: 32, spin: 420, deal: 48, reel: 28 },
  instant: { step: 0, spin: 0, deal: 0, reel: 0 },
} as const;

export function effectiveSpeed(): GameSpeed {
  if (!loadAnimOn()) return "instant";
  return loadGameSpeed();
}

export function speedDelay(kind: keyof (typeof DELAY)["regular"]): number {
  return DELAY[effectiveSpeed()][kind];
}

export function sleep(ms: number) {
  if (ms <= 0) return Promise.resolve();
  return new Promise<void>((r) => window.setTimeout(r, ms));
}

export function poolFrameMs() {
  const s = effectiveSpeed();
  if (s === "instant") return 0;
  return s === "fast" ? 1000 / 96 : 1000 / 60;
}
