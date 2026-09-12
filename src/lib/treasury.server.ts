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
  return trim("SOL_RPC_URL") ?? "https://api.mainnet-beta.solana.com";
}

export async function readSolTreasury(): Promise<TreasuryBook> {
  const addresses = treasuryAddresses();
  const pubkey = addresses.SOL;
  const rpc = solRpc();
  if (!pubkey) {
    return { chain: "solana", addresses, solLamports: null, sol: null, rpc };
  }
  try {
    const res = await fetch(rpc, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        jsonrpc: "2.0",
        id: 1,
        method: "getBalance",
        params: [pubkey],
      }),
      signal: AbortSignal.timeout(10_000),
    });
    const json = (await res.json()) as { result?: { value?: number } };
    const lamports = json.result?.value ?? null;
    return {
      chain: "solana",
      addresses,
      solLamports: lamports,
      sol: lamports == null ? null : lamports / 1_000_000_000,
      rpc,
    };
  } catch {
    return { chain: "solana", addresses, solLamports: null, sol: null, rpc };
  }
}
