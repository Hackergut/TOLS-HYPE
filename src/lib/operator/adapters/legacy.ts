import type { AggregatorAdapter } from "@/lib/operator/adapter";
import { aggregatorFetch, asGames } from "@/lib/operator/http";
import { operatorServer } from "@/lib/operator/env.server";
import type { SeamlessRequest } from "@/lib/operator/types";

/**
 * Restyle an old platform: keep its game catalog + wallet callbacks,
 * map old player/game ids onto TOLS originals and the SQL ledger.
 * Set LEGACY_GAME_MAP as JSON {"old-slot-12":"pulse-slots"}.
 */
function remapGame(id: string) {
  const raw = operatorServer().legacyGameMap;
  if (!raw) return id;
  try {
    const map = JSON.parse(raw) as Record<string, string>;
    return map[id] ?? id;
  } catch {
    return id;
  }
}

export const legacyAdapter: AggregatorAdapter = {
  id: "legacy",
  label: "Legacy restyle",
  async listGames() {
    try {
      return asGames(await aggregatorFetch("/api/games")).map((g) => ({
        ...g,
        id: remapGame(g.id),
      }));
    } catch {
      return [];
    }
  },
  async launch(req) {
    const cfg = operatorServer();
    const payload = (await aggregatorFetch("/api/startGame", {
      operator: cfg.aggregatorOperatorId,
      game: req.gameId,
      player: req.userId,
      currency: req.currency,
    })) as { iframe?: string; url?: string; html?: string };
    if (payload.url || payload.iframe) return { url: payload.url ?? payload.iframe };
    if (payload.html) return { html: payload.html };
    return { error: "Legacy platform returned no game URL" };
  },
  parseWallet(body) {
    if (!body || typeof body !== "object") return null;
    const o = body as Record<string, unknown>;
    const raw = String(o.type ?? o.action ?? o.method ?? "").toLowerCase();
    const map: Record<string, SeamlessRequest["action"]> = {
      getbalance: "balance",
      balance: "balance",
      debit: "bet",
      bet: "bet",
      credit: "win",
      win: "win",
      rollback: "rollback",
      cancel: "rollback",
    };
    const action = map[raw.replace(/[\s_-]/g, "")];
    if (!action) return null;
    const cents = o.amount_cents ?? o.amountCents;
    const amount =
      cents != null ? Number(cents) / 100 : o.amount != null ? Number(o.amount) : undefined;
    return {
      action,
      userId: String(o.playerId ?? o.player_id ?? o.uid ?? o.userId ?? ""),
      currency: String(o.currency ?? "USDT"),
      amount,
      txnId: o.transactionId != null ? String(o.transactionId) : o.tid != null ? String(o.tid) : undefined,
      gameId: remapGame(String(o.gameId ?? o.game_id ?? o.game ?? "")),
      roundId: o.roundId != null ? String(o.roundId) : undefined,
    };
  },
};
