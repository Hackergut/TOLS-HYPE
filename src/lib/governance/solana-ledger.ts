import { pushBridgeEvent } from "@/lib/governance/bridge";
import { readSolTreasury } from "@/lib/treasury.server";

/** Push the Solana treasury snapshot to gov.tols.fun (HMAC). Failures are silent. */
export async function pushSolanaLedger() {
  const book = await readSolTreasury();
  try {
    await pushBridgeEvent("solana_ledger", {
      chain: "solana",
      treasury: book.addresses.SOL ?? null,
      sol: book.sol,
      lamports: book.solLamports,
      at: new Date().toISOString(),
    });
  } catch {
    /* tower optional */
  }
  return book;
}
