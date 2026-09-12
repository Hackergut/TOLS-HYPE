import type { AggregatorAdapter } from "@/lib/operator/adapter";
import { flexrixBase, flexrixConfigured, flexrixSign } from "@/lib/operator/flexrix-sign";
import type { LaunchResponse, RemoteGame, SeamlessRequest } from "@/lib/operator/types";

type HubGame = {
  uuid?: string;
  slug?: string;
  name?: string;
  provider?: string;
  image?: string;
  type?: string;
  rtp?: number;
};

async function hubJson<T>(path: string, init: RequestInit & { signParams?: Record<string, string | number> }): Promise<T> {
  const { headers: signed } = flexrixSign(init.signParams ?? {});
  const res = await fetch(`${flexrixBase()}${path}`, {
    method: init.method ?? "GET",
    headers: { ...signed, ...(init.headers as Record<string, string> | undefined) },
    body: init.body,
    signal: AbortSignal.timeout(15_000),
  });
  if (!res.ok) throw new Error(`Flexrix ${res.status}`);
  return (await res.json()) as T;
}

/** Flexrix hub direct — HMAC-SHA1. Does not go through tols-casino-next. */
export const flexrixAdapter: AggregatorAdapter = {
  id: "flexrix",
  label: "Flexrix hub",
  async listGames(): Promise<RemoteGame[]> {
    if (!flexrixConfigured()) return [];
    const out: RemoteGame[] = [];
    for (let page = 1; page <= 3; page++) {
      const params = { page, per_page: 50 };
      const qs = new URLSearchParams({ page: String(page), per_page: "50" }).toString();
      const data = await hubJson<{ items?: HubGame[] }>(`/v1/native/games?${qs}`, { signParams: params });
      const items = data.items ?? [];
      for (const g of items) {
        const slug = String(g.slug || g.uuid || "");
        if (!slug) continue;
        out.push({
          id: slug,
          slug,
          title: String(g.name || slug),
          provider: String(g.provider || "Flexrix"),
          cover: g.image,
          rtp: g.rtp,
          live: String(g.type || "").toLowerCase().includes("live"),
          gameType: g.type,
        });
      }
      if (items.length < 50) break;
    }
    return out;
  },
  async launch(req): Promise<LaunchResponse> {
    const slug = req.gameId.replace(/^flexrix:/, "");
    if (!slug) return { error: "Missing game slug" };
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
      currency: req.currency === "USDT" ? "USD" : req.currency,
      language: req.language ?? "en",
      balance: 0,
      return_url: req.returnUrl ?? "https://tols-plum.vercel.app/",
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
