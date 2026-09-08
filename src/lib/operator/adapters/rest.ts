import type { AggregatorAdapter } from "@/lib/operator/adapter";
import { aggregatorFetch, asGames } from "@/lib/operator/http";
import { operatorServer } from "@/lib/operator/env.server";
import type { SeamlessRequest } from "@/lib/operator/types";

/** Generic REST aggregator: GET /games, POST /game/launch, wallet JSON as-is. */
export const restAdapter: AggregatorAdapter = {
  id: "rest",
  label: "Generic REST",
  async listGames() {
    return asGames(await aggregatorFetch("/games"));
  },
  async launch(req) {
    const cfg = operatorServer();
    const payload = (await aggregatorFetch("/game/launch", {
      operatorId: cfg.aggregatorOperatorId,
      gameId: req.gameId,
      userId: req.userId,
      currency: req.currency,
      language: req.language ?? "en",
      returnUrl: req.returnUrl,
    })) as { url?: string; html?: string };
    if (payload.url || payload.html) return payload;
    return { error: "Aggregator returned no launch URL" };
  },
  parseWallet(body) {
    if (!body || typeof body !== "object") return null;
    const o = body as Record<string, unknown>;
    const action = String(o.action ?? "");
    if (!["balance", "bet", "win", "rollback"].includes(action)) return null;
    return {
      action: action as SeamlessRequest["action"],
      userId: String(o.userId ?? o.user_id ?? ""),
      currency: String(o.currency ?? "USDT"),
      amount: o.amount != null ? Number(o.amount) : undefined,
      txnId: o.txnId != null ? String(o.txnId) : o.transaction_id != null ? String(o.transaction_id) : undefined,
      gameId: o.gameId != null ? String(o.gameId) : o.game_id != null ? String(o.game_id) : undefined,
      roundId: o.roundId != null ? String(o.roundId) : undefined,
    };
  },
};
