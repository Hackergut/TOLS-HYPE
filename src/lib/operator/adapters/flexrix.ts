import type { AggregatorAdapter } from "@/lib/operator/adapter";
import { operatorServer } from "@/lib/operator/env.server";
import type { SeamlessRequest } from "@/lib/operator/types";
import { tolsNextAdapter } from "@/lib/operator/adapters/tols-next";

/** Flexrix hub — launch/list go through tols-casino-next which already signs HMAC-SHA1. */
export const flexrixAdapter: AggregatorAdapter = {
  id: "flexrix",
  label: "Flexrix (via tols-casino-next)",
  listGames: () => tolsNextAdapter.listGames(),
  launch: (req) => tolsNextAdapter.launch(req),
  parseWallet(body) {
    const parsed = tolsNextAdapter.parseWallet(body);
    if (parsed) return parsed;
    if (!body || typeof body !== "object") return null;
    const o = body as Record<string, unknown>;
    const raw = String(o.action ?? o.type ?? "").toLowerCase();
    const map: Record<string, SeamlessRequest["action"]> = {
      play: "bet",
      bet: "bet",
      win: "win",
      refund: "rollback",
    };
    const action = map[raw];
    if (!action && operatorServer().flexrixKey) return null;
    if (!action) return null;
    return {
      action,
      userId: String(o.user_id ?? o.player_id ?? ""),
      currency: String(o.currency ?? "USDT"),
      amount: o.amount != null ? Number(o.amount) : undefined,
      txnId: o.transaction_id != null ? String(o.transaction_id) : undefined,
      gameId: o.game_id != null ? String(o.game_id) : undefined,
    };
  },
};
