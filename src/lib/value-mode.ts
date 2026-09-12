import { useCallback, useSyncExternalStore } from "react";
import type { Currency } from "@/lib/games-catalog";

export type ValueMode = "crypto" | "usd";

const KEY = "tols-value-mode";

/** Display rates for play-money → USD. */
export const USD_RATE: Record<Currency, number> = {
  SOL: 140,
  USDT: 1,
  BTC: 97_450,
  ETH: 3_420,
};

let mode: ValueMode = "crypto";
const listeners = new Set<() => void>();

function read(): ValueMode {
  if (typeof window === "undefined") return "crypto";
  return window.localStorage.getItem(KEY) === "usd" ? "usd" : "crypto";
}

if (typeof window !== "undefined") mode = read();

export function getValueMode(): ValueMode {
  return mode;
}

export function setValueMode(next: ValueMode) {
  mode = next;
  if (typeof window !== "undefined") window.localStorage.setItem(KEY, next);
  listeners.forEach((l) => l());
}

export function useValueMode() {
  const current = useSyncExternalStore(
    (cb) => {
      listeners.add(cb);
      return () => listeners.delete(cb);
    },
    () => mode,
    () => "crypto" as ValueMode,
  );
  const set = useCallback((next: ValueMode) => setValueMode(next), []);
  return [current, set] as const;
}

export function toUsd(amount: number, currency: Currency): number {
  return amount * USD_RATE[currency];
}

export function formatUsd(amount: number): string {
  return amount.toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}
