export type OddsFormat = "decimal" | "american" | "fractional";

export const ODDS_FORMATS: { id: OddsFormat; label: string }[] = [
  { id: "decimal", label: "Dec" },
  { id: "american", label: "US" },
  { id: "fractional", label: "Frac" },
];

function gcd(a: number, b: number): number {
  a = Math.abs(a);
  b = Math.abs(b);
  while (b) {
    const t = b;
    b = a % b;
    a = t;
  }
  return a || 1;
}

export function toAmerican(decimal: number): string {
  if (decimal >= 2) return `+${Math.round((decimal - 1) * 100)}`;
  const v = Math.round(-100 / (decimal - 1));
  return `${v}`;
}

export function toFractional(decimal: number): string {
  const profit = Math.max(decimal - 1, 0.01);
  let den = 20;
  let num = Math.round(profit * den);
  if (num < 1) num = 1;
  const g = gcd(num, den);
  return `${num / g}/${den / g}`;
}

export function formatOdds(decimal: number, format: OddsFormat): string {
  if (format === "american") return toAmerican(decimal);
  if (format === "fractional") return toFractional(decimal);
  return decimal.toFixed(2);
}

export function impliedProb(decimal: number): number {
  return 1 / decimal;
}

export function comboOdds(odds: number[]): number {
  return odds.reduce((acc, n) => acc * n, 1);
}

export function vigPrice(odds: number, edge = 0.04): number {
  return Math.min(1, Math.max(0, (1 / odds) * (1 - edge)));
}
