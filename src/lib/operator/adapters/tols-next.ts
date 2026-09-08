import type { AggregatorAdapter } from "@/lib/operator/adapter";
import { operatorServer } from "@/lib/operator/env.server";
import type { RemoteGame, SeamlessRequest } from "@/lib/operator/types";

/**
 * Talks to the live Next.js casino (Hackergut/tols-casino-next).
 * Lobby, Flexrix launch, vendor wallet, deposits stay on that API.
 */
async function casino(path: string, init?: RequestInit) {
  const base = operatorServer().casinoOrigin;
  const res = await fetch(`${base}${path}`, {
    ...init,
    headers: { "content-type": "application/json", ...(init?.headers ?? {}) },
  });
  if (!res.ok) throw new Error(`Casino ${res.status} ${path}`);
  return res.json() as Promise<unknown>;
}

export const tolsNextAdapter: AggregatorAdapter = {
  id: "tols-next",
  label: "tols-casino-next (live)",
  async listGames() {
    try {
      const data = await casino("/api/games-lobby");
      const rows = Array.isArray(data)
        ? data
        : ((data as { games?: unknown[]; originals?: unknown[]; flexrix?: unknown[] }).games ??
          (data as { originals?: unknown[] }).originals ??
          []);
      return (rows as Record<string, unknown>[]).map((g) => ({
        id: String(g.id ?? g.slug ?? g.uuid ?? ""),
        title: String(g.title ?? g.name ?? g.id),
        provider: String(g.provider ?? g.vendor ?? "Flexrix"),
        cover: g.cover != null ? String(g.cover) : g.image != null ? String(g.image) : undefined,
        rtp: g.rtp != null ? Number(g.rtp) : undefined,
        live: Boolean(g.live),
      })) as RemoteGame[];
    } catch {
      return [];
    }
  },
  async launch(req) {
    try {
      const payload = (await casino("/api/flexrix/launch", {
        method: "POST",
        body: JSON.stringify({ gameId: req.gameId, slug: req.gameId, currency: req.currency }),
      })) as { url?: string; launchUrl?: string; error?: string };
      const url = payload.url ?? payload.launchUrl;
      if (url) return { url };
      const vendor = (await casino("/api/vendor/launch", {
        method: "POST",
        body: JSON.stringify({ gameId: req.gameId, vendor: "flexrix" }),
      })) as { url?: string; token?: string; callbackUrl?: string; error?: string };
      if (vendor.url) return { url: vendor.url };
      return { error: payload.error ?? vendor.error ?? "Launch failed on tols-casino-next" };
    } catch (err) {
      return { error: err instanceof Error ? err.message : "Casino origin unreachable" };
    }
  },
  parseWallet(body) {
    if (!body || typeof body !== "object") return null;
    const o = body as Record<string, unknown>;
    const raw = String(o.action ?? o.cmd ?? "").toLowerCase();
    const map: Record<string, SeamlessRequest["action"]> = {
      balance: "balance",
      bet: "bet",
      debit: "bet",
      win: "win",
      credit: "win",
      rollback: "rollback",
      refund: "rollback",
    };
    const action = map[raw];
    if (!action) return null;
    return {
      action,
      userId: String(o.userId ?? o.player_id ?? o.playerId ?? ""),
      currency: String(o.currency ?? "USDT"),
      amount: o.amount != null ? Number(o.amount) : undefined,
      txnId: String(o.txId ?? o.txnId ?? o.transactionId ?? o.transaction_id ?? ""),
      gameId: o.gameId != null ? String(o.gameId) : o.game_uuid != null ? String(o.game_uuid) : undefined,
      roundId: o.roundId != null ? String(o.roundId) : undefined,
    };
  },
};
