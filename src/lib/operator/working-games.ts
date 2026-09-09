import type { CatalogGame, GameCategory } from "@/lib/games-catalog";
import { WORKING_LIVE_ROWS, WORKING_SLOT_ROWS, type SlotRow } from "@/lib/operator/working-titles";

export type WorkingWave = 1 | 2 | 3 | 4;

export type WorkingTitle = {
  slug: string;
  title: string;
  provider: string;
  category: "slots" | "live";
  wave: WorkingWave;
  demo: boolean;
  cover: string;
  hot?: boolean;
  isNew?: boolean;
};

function humanizeTitle(title: string, slug: string): string {
  if (/[A-Z]/.test(title) && /\s/.test(title)) return title;
  const raw =
    title === slug || /^[a-z0-9]+$/i.test(title)
      ? slug.replace(/^(relax-|hacksaw-|playngo-|popok-|fachai-|ss-|sg|gt-|yb-)/, "")
      : title;
  return raw
    .replace(/[-_]/g, " ")
    .replace(/dd$/i, "")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

function rowToTitle(row: SlotRow, live: boolean): WorkingTitle {
  return {
    slug: row.slug,
    title: humanizeTitle(row.title, row.slug),
    provider: row.provider,
    category: live || row.live ? "live" : "slots",
    wave: 4,
    demo: !(live || row.live),
    cover: row.cover,
    hot: row.hot,
    isNew: row.isNew,
  };
}

export const WORKING_TITLES: WorkingTitle[] = [
  ...WORKING_SLOT_ROWS.map((row) => rowToTitle(row, false)),
  ...WORKING_LIVE_ROWS.map((row) => rowToTitle(row, true)),
];

export const WORKING_SLUGS = new Set(WORKING_TITLES.map((t) => t.slug));

export function normalizeLobbySlug(raw: string): string {
  return raw.replace(/^flexrix-/, "").trim();
}

export function isWorkingSlug(raw: string): boolean {
  return WORKING_SLUGS.has(normalizeLobbySlug(raw));
}

export function workingToCatalog(t: WorkingTitle): CatalogGame {
  return {
    id: t.slug,
    title: t.title,
    provider: t.provider,
    category: t.category,
    kind: "iframe",
    live: t.category === "live",
    hot: t.hot,
    isNew: t.isNew,
    players: undefined,
    edge: 0.04,
    rtp: 96,
    blurb: t.demo ? t.provider : "Live table — sign in to play. No demo.",
    cover: t.cover,
    cta: t.category === "live" ? "Play" : "Spin",
  };
}

export const WORKING_GAMES: CatalogGame[] = WORKING_TITLES.map(workingToCatalog);

export function workingByCategory(category: GameCategory | "all"): CatalogGame[] {
  if (category === "all") return WORKING_GAMES;
  return WORKING_GAMES.filter((g) => g.category === category);
}

export function getWorkingGame(id: string): CatalogGame | undefined {
  const slug = normalizeLobbySlug(id);
  return WORKING_GAMES.find((g) => g.id === slug);
}
