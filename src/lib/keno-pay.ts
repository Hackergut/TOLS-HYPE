export const KENO_PAY: Record<number, number[]> = {
  1: [0, 3.8],
  2: [0, 1.8, 4.6],
  3: [0, 1, 3, 10],
  4: [0, 0.7, 1.8, 5, 22],
  5: [0, 0.4, 1.4, 3.2, 12, 48],
  6: [0, 0, 1.1, 2.4, 8, 28, 90],
  7: [0, 0, 0.8, 1.8, 5, 16, 50, 200],
  8: [0, 0, 0.5, 1.4, 3.5, 10, 30, 100, 400],
  9: [0, 0, 0.4, 1.1, 2.5, 7, 20, 60, 250, 800],
  10: [0, 0, 0.3, 0.9, 2, 5, 14, 40, 150, 500, 1200],
};

export const KENO_RISK = { classic: 1, low: 0.7, normie: 1.25, degen: 1.7 } as const;
export type KenoRisk = keyof typeof KENO_RISK;

export function kenoMultiplier(picks: number, hits: number, risk: KenoRisk): number {
  const table = KENO_PAY[picks] ?? [0];
  return (table[hits] ?? 0) * KENO_RISK[risk];
}

export function formatKenoX(n: number) {
  if (n <= 0) return "0×";
  if (n >= 100) return `${Math.round(n)}×`;
  if (n >= 10) return `${n.toFixed(1)}×`;
  return `${n.toFixed(2)}×`;
}
