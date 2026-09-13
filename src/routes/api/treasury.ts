import { createFileRoute } from "@tanstack/react-router";
import { pushSolanaLedger } from "@/lib/governance/solana-ledger";
import { treasuryAddresses } from "@/lib/treasury.server";

export const Route = createFileRoute("/api/treasury")({
  server: {
    handlers: {
      GET: async () => {
        const book = await pushSolanaLedger();
        return Response.json({
          ok: book.sol != null,
          chain: "solana",
          addresses: treasuryAddresses(),
          sol: book.sol,
          lamports: book.solLamports,
          rpc: book.rpc,
          ready: Boolean(book.addresses.SOL) && book.sol != null,
        });
      },
    },
  },
});
