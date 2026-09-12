import type { Currency } from "./games-catalog";
import { getExplorerUrl } from "./onchain/config";

export function asNumber(value: string | number | null | undefined): number {
  if (typeof value === "number") return Number.isFinite(value) ? value : 0;
  if (typeof value === "string") {
    const n = Number(value);
    return Number.isFinite(n) ? n : 0;
  }
  return 0;
}

export function formatMoney(amount: string | number, currency: Currency): string {
  const n = asNumber(amount);
  const digits = currency === "USDT" ? 2 : currency === "ETH" ? 5 : 6;
  return n.toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: digits,
  });
}

export function formatMultiplier(n: number): string {
  return `${n.toFixed(2)}x`;
}

export function shortAddress(address: string): string {
  if (address.length < 12) return address;
  return `${address.slice(0, 6)}…${address.slice(-4)}`;
}

export function mockAddressFromUserId(userId: string): string {
  let hash = 0;
  for (let i = 0; i < userId.length; i += 1) {
    hash = (hash * 31 + userId.charCodeAt(i)) >>> 0;
  }
  const hex = (hash.toString(16) + "c0ffeevegas").padEnd(40, "a");
  return `0x${hex.slice(0, 40)}`;
}

/** Ethereum mainnet for ETH/USDT display; BTC has no EVM explorer. */
export function chainIdForCurrency(currency: Currency): number | null {
  if (currency === "SOL" || currency === "BTC") return null;
  return 1;
}

export function explorerAddressUrl(address: string, chainId = 1): string | null {
  const base = getExplorerUrl(chainId);
  if (!base || !address.startsWith("0x")) return null;
  return `${base.replace(/\/$/, "")}/address/${address}`;
}
