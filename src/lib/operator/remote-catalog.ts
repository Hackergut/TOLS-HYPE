import type { CatalogGame, GameCategory } from "@/lib/games-catalog";
import type { RemoteGame } from "@/lib/operator/types";

export function remoteToCatalog(g: RemoteGame): CatalogGame {
  const live = Boolean(g.live);
  const raw = String(g.category ?? "").toLowerCase();
  const category: GameCategory = live ? "live" : raw === "table" ? "table" : raw === "originals" ? "originals" : "slots";
  const rtp = g.rtp != null && Number.isFinite(g.rtp) ? g.rtp : 96;
  return {
    id: g.id,
    title: g.title,
    provider: g.provider,
    category,
    kind: "iframe",
    live,
    hot: Boolean(g.featured),
    isNew: Boolean(g.isNew),
    original: false,
    edge: Math.max(0, (100 - rtp) / 100),
    rtp,
    blurb: g.provider,
    cover: g.cover || "/brand/games/slots.jpg",
    cta: live ? "Join" : "Play",
  };
}
