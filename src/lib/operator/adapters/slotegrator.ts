import type { AggregatorAdapter } from "@/lib/operator/adapter";
import { aggregatorFetch, asGames } from "@/lib/operator/http";
import { operatorServer } from "@/lib/operator/env.server";
import type { SeamlessRequest } from "@/lib/operator/types";

/** Slotegrator-style: POST /games, POST /games/init, callback actions. */
export const slotegratorAdapter: AggregatorAdapter = {
  id: "slotegrator",
  label: "Slotegrator-style",
  async listGames() {
    return asGames(await aggregatorFetch("/games"));
  },
  async launch(req) {
    const cfg = operatorServer();
    const payload = (await aggregatorFetch("/games/init", {
      game_uuid: req.gameId,
      player_id: req.userId,
      player_name: req.userId,
      currency: req.currency,
      session_id: `${cfg.aggregatorOperatorId ?? "tols"}_${req.userId}_${Date.now()}`,
      language: req.language ?? "en",
      return_url: req.returnUrl,
    })) as { url?: string };
    return payload.url ? { url: payload.url } : { error: "No url from Slotegrator-style API" };
  },
  parseWallet(body) {
    if (!body || typeof body !== "object") return null;
    const o = body as Record<string, unknown>;
    const raw = String(o.action ?? "").toLowerCase();
    const map: Record<string, SeamlessRequest["action"]> = {
      balance: "balance",
      bet: "bet",
      win: "win",
      refund: "rollback",
      rollback: "rollback",
    };
    const action = map[raw];
    if (!action) return null;
    return {
      action,
      userId: String(o.player_id ?? o.userId ?? ""),
      currency: String(o.currency ?? "USDT"),
      amount: o.amount != null ? Number(o.amount) : undefined,
      txnId: o.transaction_id != null ? String(o.transaction_id) : undefined,
      gameId: o.game_uuid != null ? String(o.game_uuid) : undefined,
      roundId: o.round_id != null ? String(o.round_id) : undefined,
    };
  },
};
