export const TOLS_CHAINS = [
  { id: 1, name: "Ethereum" },
  { id: 8453, name: "Base" },
  { id: 42161, name: "Arbitrum One" },
  { id: 10, name: "Optimism" },
  { id: 137, name: "Polygon" },
] as const;

export const DEFAULT_CHAIN_ID = 8453;

const KEY = "tols-chain";

export function readStoredChainId(): number {
  if (typeof window === "undefined") return DEFAULT_CHAIN_ID;
  const raw = window.localStorage.getItem(KEY);
  const n = raw ? Number(raw) : NaN;
  return TOLS_CHAINS.some((c) => c.id === n) ? n : DEFAULT_CHAIN_ID;
}

export function storeChainId(chainId: number) {
  window.localStorage.setItem(KEY, String(chainId));
}
