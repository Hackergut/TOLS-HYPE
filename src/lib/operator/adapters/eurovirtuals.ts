import type { AggregatorAdapter } from "@/lib/operator/adapter";
import { operatorServer } from "@/lib/operator/env.server";
import type { RemoteGame, SeamlessRequest } from "@/lib/operator/types";

export const eurovirtualsAdapter: AggregatorAdapter = {
  id: "eurovirtuals",
  label: "EuroVirtuals / Betkraft",
  async listGames() {
    const cfg = operatorServer();
    if (!cfg.evBase) return [];
    try {
      const res = await fetch(`${cfg.evBase.replace(/\/$/, "")}/games`, {
        headers: cfg.evKey ? { authorization: `Bearer ${cfg.evKey}` } : {},
      });
      if (!res.ok) return [];
      const data = (await res.json()) as unknown;
      const rows = Array.isArray(data) ? data : ((data as { games?: unknown[] }).games ?? []);
      return (rows as Record<string, unknown>[]).map((g) => ({
        id: String(g.id ?? g.code ?? ""),
        title: String(g.title ?? g.name ?? ""),
        provider: String(g.provider ?? "EuroVirtuals"),
        cover: g.image != null ? String(g.image) : undefined,
      })) as RemoteGame[];
    } catch {
      return [];
    }
  },
  async launch(req) {
    const cfg = operatorServer();
    try {
      const res = await fetch(`${cfg.casinoOrigin}/api/eurovirtuals/launch`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ gameId: req.gameId, currency: req.currency, userId: req.userId }),
      });
      const payload = (await res.json()) as { url?: string; error?: string };
      return payload.url ? { url: payload.url } : { error: payload.error ?? "EV launch failed" };
    } catch (err) {
      return { error: err instanceof Error ? err.message : "EuroVirtuals unreachable" };
    }
  },
  parseWallet(body) {
    if (!body || typeof body !== "object") return null;
    const o = body as Record<string, unknown>;
    const raw = String(o.action ?? o.command ?? "").toLowerCase();
    const map: Record<string, SeamlessRequest["action"]> = {
      balance: "balance",
      bet: "bet",
      win: "win",
      rollback: "rollback",
    };
    const action = map[raw];
    if (!action) return null;
    return {
      action,
      userId: String(o.userId ?? o.player_id ?? ""),
      currency: String(o.currency ?? "USDT"),
      amount: o.amount != null ? Number(o.amount) : undefined,
      txnId: o.transactionId != null ? String(o.transactionId) : undefined,
      gameId: o.gameId != null ? String(o.gameId) : undefined,
    };
  },
};
