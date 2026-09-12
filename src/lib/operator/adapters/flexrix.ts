import type { AggregatorAdapter } from "@/lib/operator/adapter";
import { flexrixBase, flexrixConfigured, flexrixSign } from "@/lib/operator/flexrix-sign";
import type { LaunchResponse, RemoteGame, SeamlessRequest } from "@/lib/operator/types";
import { operatorServer } from "@/lib/operator/env.server";
import { lobbyQuota } from "@/lib/operator/lobby-quota";

type HubGame = {
  uuid?: string;
  slug?: string;
  name?: string;
  provider?: string;
  image?: string;
  type?: string;
  rtp?: number;
};

const cache = globalThis as typeof globalThis & {
  __flexrixGames__?: { at: number; games: RemoteGame[] };
};

function hubItems(data: unknown): HubGame[] {
  if (!data || typeof data !== "object") return [];
  const o = data as Record<string, unknown>;
  const nested = o.data && typeof o.data === "object" && !Array.isArray(o.data) ? (o.data as Record<string, unknown>) : null;
  const raw = o.items ?? nested?.items ?? o.games ?? o.data;
  return Array.isArray(raw) ? (raw as HubGame[]) : [];
}

async function hubJson<T>(path: string, init: RequestInit & { signParams?: Record<string, string | number> }): Promise<T> {
  const { headers: signed } = flexrixSign(init.signParams ?? {});
  const res = await fetch(`${flexrixBase()}${path}`, {
    method: init.method ?? "GET",
    headers: { ...signed, ...(init.headers as Record<string, string> | undefined) },
    body: init.body,
    signal: AbortSignal.timeout(12_000),
  });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`Flexrix ${res.status}${text.slice(0, 80) ? `: ${text.slice(0, 80)}` : ""}`);
  }
  return (await res.json()) as T;
}

function mapGame(g: HubGame): RemoteGame | null {
  const slug = String(g.slug || g.uuid || "");
  if (!slug) return null;
  const type = String(g.type || "").toLowerCase();
  const live = type.includes("live") || type === "game_show";
  const category = live ? "live" : type.includes("table") || type.includes("roulette") || type.includes("blackjack") ? "table" : "slots";
  return {
    id: slug,
    slug,
    title: String(g.name || slug),
    provider: String(g.provider || "Flexrix"),
    cover: g.image,
    rtp: g.rtp,
    live,
    category,
    gameType: g.type,
  };
}

/** Flexrix hub direct — HMAC-SHA1. Does not go through tols-casino-next. */
export const flexrixAdapter: AggregatorAdapter = {
  id: "flexrix",
  label: "Flexrix hub",
  async listGames(): Promise<RemoteGame[]> {
    if (!flexrixConfigured()) return [];
    const hit = cache.__flexrixGames__;
    if (hit && Date.now() - hit.at < 10 * 60_000) return hit.games;
    const out: RemoteGame[] = [];
    const seen = new Set<string>();
    for (let page = 1; page <= 6; page++) {
      const params = { page, per_page: 100 };
      const qs = new URLSearchParams({ page: String(page), per_page: "100" }).toString();
      const data = await hubJson<unknown>(`/v1/native/games?${qs}`, { signParams: params });
      const items = hubItems(data);
      for (const g of items) {
        const mapped = mapGame(g);
        if (!mapped || seen.has(mapped.id)) continue;
        seen.add(mapped.id);
        out.push(mapped);
      }
      if (items.length < 100) break;
    }
    const trimmed = lobbyQuota(out);
    cache.__flexrixGames__ = { at: Date.now(), games: trimmed };
    return trimmed;
  },
  async launch(req): Promise<LaunchResponse> {
    const slug = req.gameId.replace(/^flexrix:/, "");
    if (!slug) return { error: "Missing game slug" };
    const origin = operatorServer().casinoOrigin;
    const ccy = req.currency === "USDT" || req.currency === "SOL" ? "USD" : req.currency;
    if (!flexrixConfigured()) {
      const qs = new URLSearchParams({ balance: "5000", currency: "USD", lang: req.language ?? "en" });
      try {
        const res = await fetch(`${flexrixBase()}/v1/native/${encodeURIComponent(slug)}/launch-demo?${qs}`, {
          method: "POST",
          signal: AbortSignal.timeout(12_000),
        });
        const json = (await res.json()) as { url?: string };
        if (json.url) return { url: json.url };
        return { error: "Set FLEXRIX_MERCHANT_KEY + FLEXRIX_API_SECRET for real play" };
      } catch (err) {
        return { error: err instanceof Error ? err.message : "Flexrix demo failed" };
      }
    }
    const body = {
      player_id: req.userId,
      currency: ccy,
      language: req.language ?? "en",
      balance: 0,
      return_url: req.returnUrl ?? `${origin}/`,
    };
    try {
      const json = await hubJson<{ url?: string }>(`/v1/native/${encodeURIComponent(slug)}/launch`, {
        method: "POST",
        signParams: body,
        headers: { "content-type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!json.url) return { error: "Flexrix launch missing url" };
      return { url: json.url };
    } catch (err) {
      return { error: err instanceof Error ? err.message : "Flexrix launch failed" };
    }
  },
  parseWallet(body) {
    if (!body || typeof body !== "object") return null;
    const o = body as Record<string, unknown>;
    const raw = String(o.action ?? o.type ?? "").toLowerCase();
    const map: Record<string, SeamlessRequest["action"]> = {
      play: "bet",
      bet: "bet",
      win: "win",
      refund: "rollback",
      rollback: "rollback",
      balance: "balance",
    };
    const action = map[raw];
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
