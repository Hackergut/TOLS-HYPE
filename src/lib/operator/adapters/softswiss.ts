import type { AggregatorAdapter } from "@/lib/operator/adapter";
import { aggregatorFetch, asGames } from "@/lib/operator/http";
import { operatorServer } from "@/lib/operator/env.server";
import type { SeamlessRequest } from "@/lib/operator/types";

/** Softswiss-style casino API (games list + session launch + player callbacks). */
export const softswissAdapter: AggregatorAdapter = {
  id: "softswiss",
  label: "Softswiss-style",
  async listGames() {
    const data = await aggregatorFetch("/v2/casino/games");
    return asGames(data).map((g) => ({
      ...g,
      id: g.id,
      title: g.title,
      provider: g.provider,
    }));
  },
  async launch(req) {
    const cfg = operatorServer();
    const payload = (await aggregatorFetch(`/v2/casino/games/${encodeURIComponent(req.gameId)}/session`, {
      casino_id: cfg.aggregatorOperatorId,
      player: { id: req.userId, currency: req.currency, language: req.language ?? "en" },
      return_url: req.returnUrl,
    })) as { launch_url?: string; url?: string };
    const url = payload.launch_url ?? payload.url;
    return url ? { url } : { error: "No launch_url from Softswiss-style API" };
  },
  parseWallet(body) {
    if (!body || typeof body !== "object") return null;
    const o = body as Record<string, unknown>;
    const raw = String(o.action ?? o.cmd ?? o.command ?? "").toLowerCase();
    const map: Record<string, SeamlessRequest["action"]> = {
      balance: "balance",
      bet: "bet",
      withdraw: "bet",
      win: "win",
      deposit: "win",
      rollback: "rollback",
      refund: "rollback",
    };
    const action = map[raw];
    if (!action) return null;
    const player = (o.player as Record<string, unknown> | undefined) ?? o;
    return {
      action,
      userId: String(player.id ?? o.player_id ?? o.user_id ?? ""),
      currency: String(player.currency ?? o.currency ?? "USDT"),
      amount: o.amount != null ? Number(o.amount) : undefined,
      txnId: String(o.transaction_id ?? o.txn_id ?? o.id ?? ""),
      gameId: o.game_id != null ? String(o.game_id) : undefined,
      roundId: o.round_id != null ? String(o.round_id) : undefined,
    };
  },
};
