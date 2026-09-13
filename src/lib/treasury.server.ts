import { env } from "@/lib/env.server";
import type { Currency } from "@/lib/games-catalog";

export type TreasuryBook = {
  chain: "solana";
  addresses: Partial<Record<Currency, string>>;
  solLamports: number | null;
  sol: number | null;
  rpc: string;
};

function trim(key: string) {
  const v = env(key)?.trim();
  return v || undefined;
}

export function treasuryAddresses(): Partial<Record<Currency, string>> {
  return {
    SOL: trim("TREASURY_SOL_ADDRESS") ?? trim("VITE_TREASURY_SOL_ADDRESS"),
    USDT: trim("TREASURY_USDT_ADDRESS") ?? trim("TREASURY_SOL_ADDRESS"),
    BTC: trim("TREASURY_BTC_ADDRESS"),
    ETH: trim("TREASURY_ETH_ADDRESS"),
  };
}

export function solRpc() {
  return trim("SOL_RPC_URL") ?? "https://solana-rpc.publicnode.com";
}

async function rpcBalance(rpc: string, pubkey: string): Promise<number | null> {
  const res = await fetch(rpc, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      jsonrpc: "2.0",
      id: 1,
      method: "getBalance",
      params: [pubkey],
    }),
    signal: AbortSignal.timeout(8_000),
  });
  const json = (await res.json()) as { result?: { value?: number } };
  return json.result?.value ?? null;
}

export async function readSolTreasury(): Promise<TreasuryBook> {
  const addresses = treasuryAddresses();
  const pubkey = addresses.SOL;
  const rpc = solRpc();
  if (!pubkey) {
    return { chain: "solana", addresses, solLamports: null, sol: null, rpc };
  }
  const fallbacks = [rpc, "https://solana-rpc.publicnode.com", "https://api.mainnet-beta.solana.com"];
  const seen = new Set<string>();
  for (const endpoint of fallbacks) {
    if (seen.has(endpoint)) continue;
    seen.add(endpoint);
    try {
      const lamports = await rpcBalance(endpoint, pubkey);
      if (lamports == null) continue;
      return {
        chain: "solana",
        addresses,
        solLamports: lamports,
        sol: lamports / 1_000_000_000,
        rpc: endpoint,
      };
    } catch {
      continue;
    }
  }
  return { chain: "solana", addresses, solLamports: null, sol: null, rpc };
}
