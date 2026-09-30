import type { CatalogGame } from "@/lib/games-catalog";
import { GAMES, isHouseOriginal } from "@/lib/games-catalog";

const TABLE_KIND = new Set(["roulette", "blackjack"]);
const TABLE_TITLE = /blackjack|roulette|baccarat|poker|sic\s*bo|andar|teen\s*patti|blackjack|show\s*game/i;

export function uniqueGames(games: CatalogGame[]): CatalogGame[] {
  const seen = new Set<string>();
  const out: CatalogGame[] = [];
  for (const g of games) {
    if (seen.has(g.id)) continue;
    seen.add(g.id);
    out.push(g);
  }
  return out;
}

export function lobbyPool(remote: CatalogGame[]): CatalogGame[] {
  return uniqueGames([...GAMES, ...remote]);
}

export function sectionByCategory(pool: CatalogGame[], category: CatalogGame["category"]): CatalogGame[] {
  return pool.filter((g) => g.category === category);
}

export function sectionOriginals(pool: CatalogGame[]): CatalogGame[] {
  return pool.filter(isHouseOriginal);
}

export function sectionLiveShow(pool: CatalogGame[]): CatalogGame[] {
  return pool.filter((g) => g.live || g.category === "live");
}

export function sectionTableGames(pool: CatalogGame[]): CatalogGame[] {
  return pool.filter(
    (g) =>
      g.category === "table" ||
      TABLE_KIND.has(g.kind) ||
      TABLE_TITLE.test(g.title) ||
      TABLE_TITLE.test(g.provider),
  );
}

export function sectionSlots(pool: CatalogGame[]): CatalogGame[] {
  return pool.filter((g) => g.category === "slots" || g.kind === "slots" || g.kind === "crazy");
}

export function sectionCrash(pool: CatalogGame[]): CatalogGame[] {
  return pool.filter((g) => g.category === "crash" || g.kind === "crash" || g.kind === "limbo");
}

export function sectionMostPlayed(pool: CatalogGame[], limit = 18): CatalogGame[] {
  return [...pool]
    .sort((a, b) => {
      const pa = a.players ?? (a.hot ? 400 : 0);
      const pb = b.players ?? (b.hot ? 400 : 0);
      if (pb !== pa) return pb - pa;
      if (Number(b.hot) !== Number(a.hot)) return Number(b.hot) - Number(a.hot);
      return a.title.localeCompare(b.title);
    })
    .slice(0, limit);
}

export function sectionNew(pool: CatalogGame[], limit = 18): CatalogGame[] {
  const flagged = pool.filter((g) => g.isNew);
  if (flagged.length >= 8) return flagged.slice(0, limit);
  const rest = pool.filter((g) => !g.isNew && !g.live);
  return uniqueGames([...flagged, ...rest]).slice(0, limit);
}
