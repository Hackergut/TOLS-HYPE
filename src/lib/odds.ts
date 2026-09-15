export type OddsFormat = "decimal" | "american" | "fractional" | "hongkong" | "malay" | "indonesian";

export const ODDS_FORMATS: { id: OddsFormat; label: string }[] = [
  { id: "decimal", label: "Dec" },
  { id: "american", label: "US" },
  { id: "fractional", label: "Frac" },
  { id: "hongkong", label: "HK" },
  { id: "malay", label: "MY" },
  { id: "indonesian", label: "ID" },
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

export function toHongKong(decimal: number): string {
  return Math.max(decimal - 1, 0).toFixed(2);
}

export function toMalay(decimal: number): string {
  if (decimal >= 2) return `-${(1 / (decimal - 1)).toFixed(2)}`;
  return (decimal - 1).toFixed(2);
}

export function toIndonesian(decimal: number): string {
  if (decimal >= 2) return `+${(decimal - 1).toFixed(2)}`;
  return `-${(1 / (decimal - 1)).toFixed(2)}`;
}

export function formatOdds(decimal: number, format: OddsFormat): string {
  switch (format) {
    case "american":
      return toAmerican(decimal);
    case "fractional":
      return toFractional(decimal);
    case "hongkong":
      return toHongKong(decimal);
    case "malay":
      return toMalay(decimal);
    case "indonesian":
      return toIndonesian(decimal);
    default:
      return decimal.toFixed(2);
  }
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

/** Number of k-combinations of n items — C(n, k). */
export function combosCount(n: number, k: number): number {
  if (k <= 0 || k > n) return 0;
  let r = 1;
  for (let i = 1; i <= k; i++) r = (r * (n - k + i)) / i;
  return Math.round(r);
}

/** All k-combinations of indexes [0..n) — used by system bets (n ≤ 6). */
export function systemCombos(n: number, k: number): number[][] {
  if (k <= 0 || k >= n) return [];
  const res: number[][] = [];
  const idx = Array.from({ length: k }, (_, i) => i);
  for (;;) {
    res.push([...idx]);
    let p = k - 1;
    while (p >= 0 && idx[p] === n - k + p) p--;
    if (p < 0) break;
    idx[p] = idx[p]! + 1;
    for (let j = p + 1; j < k; j++) idx[j] = idx[j - 1]! + 1;
  }
  return res;
}