import type { CatalogGame, GameCategory } from "@/lib/games-catalog";
import { canonicalGameId, getGame } from "@/lib/games-catalog";
import type { RemoteGame } from "@/lib/operator/types";

const STUDIO_BLOCK =
  /^(crash|dice|mines|keno|hi-?lo|roulette|blackjack|limbo|plinko|wheel|coinflip|pool|slots|sevens)$/i;

export function remoteToCatalog(g: RemoteGame): CatalogGame | null {
  if (getGame(g.id) || getGame(canonicalGameId(g.id))) return null;
  const live = Boolean(g.live);
  const raw = String(g.category ?? "").toLowerCase();
  if (raw === "originals" || raw === "original") return null;
  if (/tols originals/i.test(g.provider)) return null;
  if (STUDIO_BLOCK.test(g.title.trim()) || STUDIO_BLOCK.test(g.id)) return null;
  const category: GameCategory = live ? "live" : raw === "table" ? "table" : "slots";
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