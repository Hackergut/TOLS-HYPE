import type { AggregatorAdapter } from "@/lib/operator/adapter";
import { operatorServer } from "@/lib/operator/env.server";
import { casinoPlayerSession } from "@/lib/operator/sso";
import type { RemoteGame, SeamlessRequest } from "@/lib/operator/types";
import { getGame } from "@/lib/games-catalog";

/**
 * Live tols-casino-next (Hackergut/tols-casino-next).
 * Lobby: GET /api/games-lobby → { success, data: [{ slug, name, imageUrl, gameType, … }] }
 * Launch: player SSO → POST /api/flexrix/launch, else GET /api/flexrix/launch-demo.
 */

type CasinoRes = { ok: boolean; status: number; json: unknown };

async function casino(path: string, init?: RequestInit): Promise<CasinoRes> {
  const base = operatorServer().casinoOrigin;
  const res = await fetch(`${base}${path}`, {
    ...init,
    headers: { "content-type": "application/json", ...(init?.headers ?? {}) },
  });
  const json = await res.json().catch(() => ({}));
  return { ok: res.ok, status: res.status, json };
}

function payload(json: unknown): Record<string, unknown> {
  if (!json || typeof json !== "object") return {};
  const o = json as Record<string, unknown>;
  if (o.data && typeof o.data === "object" && !Array.isArray(o.data)) {
    return o.data as Record<string, unknown>;
  }
  return o;
}

function rows(json: unknown): Record<string, unknown>[] {
  if (Array.isArray(json)) return json as Record<string, unknown>[];
  if (json && typeof json !== "object") return [];
  if (json && typeof json === "object") {
    const o = json as Record<string, unknown>;
    if (Array.isArray(o.data)) return o.data as Record<string, unknown>[];
    if (Array.isArray(o.games)) return o.games as Record<string, unknown>[];
    if (Array.isArray(o.originals)) return o.originals as Record<string, unknown>[];
  }
  return [];
}

function mapGame(g: Record<string, unknown>): RemoteGame | null {
  const gameType = String(g.gameType ?? g.game_type ?? "");
  if (gameType === "original") return null;
  const provider = String(g.provider ?? g.vendor ?? "Flexrix");
  if (/tols originals/i.test(provider)) return null;
  const slug = String(g.slug ?? g.id ?? g.uuid ?? "").replace(/^flexrix-/, "");
  if (!slug) return null;
  const live = Boolean(g.isLive ?? g.live) || gameType.includes("live") || String(g.category) === "live";
  const category = live ? "live" : String(g.category ?? "slots") || "slots";
  const cover = g.imageUrl ?? g.thumbnailUrl ?? g.cover ?? g.image;
  return {
    id: slug,
    slug,
    title: String(g.name ?? g.title ?? slug),
    provider,
    category,
    cover: cover != null ? String(cover) : undefined,
    rtp: g.rtp != null ? Number(g.rtp) : undefined,
    live,
    featured: Boolean(g.featured),
    isNew: Boolean(g.isNew ?? g.is_new),
    gameType: gameType || (live ? "native_live" : "native_slot"),
  };
}

function urlOf(json: unknown): string | undefined {
  const p = payload(json);
  const u = p.url ?? p.launchUrl;
  return typeof u === "string" && u ? u : undefined;
}

function errOf(json: unknown, fallback: string): string {
  const o = json && typeof json === "object" ? (json as Record<string, unknown>) : {};
  const nested = payload(json);
  return String(o.error ?? nested.error ?? fallback);
}

export const tolsNextAdapter: AggregatorAdapter = {
  id: "tols-next",
  label: "tols-casino-next (live)",
  async listGames() {
    try {
      const [featured, live] = await Promise.all([
        casino("/api/games-lobby?featured=true"),
        casino("/api/games-lobby?category=live"),
      ]);
      const seen = new Set<string>();
      const out: RemoteGame[] = [];
      for (const row of [...rows(featured.json), ...rows(live.json).slice(0, 48)]) {
        const game = mapGame(row);
        if (!game || seen.has(game.id)) continue;
        seen.add(game.id);
        out.push(game);
      }
      return out;
    } catch {
      return [];
    }
  },
  async launch(req) {
    const house = getGame(req.gameId);
    if (house && house.kind !== "iframe") {
      return { error: "Originals play on this UI" };
    }
    const slug = req.gameId.replace(/^flexrix-/, "");
    const session = await casinoPlayerSession({ userId: req.userId, email: req.email });
    const authHeaders: Record<string, string> = session ? { cookie: `tols_session=${session}` } : {};
    try {
      const real = await casino("/api/flexrix/launch", {
        method: "POST",
        headers: authHeaders,
        body: JSON.stringify({ slug, gameId: slug, currency: req.currency }),
      });
      const realUrl = urlOf(real.json);
      if (real.ok && realUrl) return { url: realUrl };

      const demo = await casino(`/api/flexrix/launch-demo?slug=${encodeURIComponent(slug)}`);
      const demoUrl = urlOf(demo.json);
      if (demo.ok && demoUrl) return { url: demoUrl };

      const vendor = await casino("/api/vendor/launch", {
        method: "POST",
        headers: authHeaders,
        body: JSON.stringify({ gameId: slug, vendor: "flexrix" }),
      });
      const vendorUrl = urlOf(vendor.json);
      if (vendor.ok && vendorUrl) return { url: vendorUrl };

      return {
        error: errOf(real.json, errOf(demo.json, `Launch failed (${real.status})`)),
      };
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
      play: "bet",
      win: "win",
      credit: "win",
      rollback: "rollback",
      refund: "rollback",
    };
    const action = map[raw];
    if (!action) return null;
    return {
      action,
      userId: String(o.userId ?? o.player_id ?? o.playerId ?? o.user_id ?? ""),
      currency: String(o.currency ?? "USDT"),
      amount: o.amount != null ? Number(o.amount) : undefined,
      txnId: String(o.txId ?? o.txnId ?? o.transactionId ?? o.transaction_id ?? ""),
      gameId: o.gameId != null ? String(o.gameId) : o.game_uuid != null ? String(o.game_uuid) : undefined,
      roundId: o.roundId != null ? String(o.roundId) : undefined,
    };
  },
};
