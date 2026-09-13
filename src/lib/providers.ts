import type { CatalogGame } from "@/lib/games-catalog";

/**
 * Provider metadata for the studio lobby: slugs, display names, and the
 * curated map of original provider logos (self-hosted, visually verified).
 *
 * Resolution order per provider: hub-supplied `providerLogo` (light tile)
 * → curated file → monogram fallback (see ProviderMark).
 */

export function providerSlug(name: string): string {
  const slug = name
    .toLowerCase()
    .trim()
    .replace(/['’]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  return slug || "studio";
}

type CuratedLogo = { src: string; tone: "light" | "dark" };

const CURATED: Record<string, CuratedLogo> = {
  "pragmatic-play": { src: "/brand/providers/pragmatic-play.png", tone: "light" },
  "pragmatic-play-live": { src: "/brand/providers/pragmatic-play.png", tone: "light" },
  "evolution-gaming": { src: "/brand/providers/evolution-gaming.png", tone: "light" },
  netent: { src: "/brand/providers/netent.png", tone: "dark" },
  playngo: { src: "/brand/providers/playngo.png", tone: "light" },
  "relax-gaming": { src: "/brand/providers/relax-gaming.png", tone: "dark" },
  redtiger: { src: "/brand/providers/redtiger.png", tone: "light" },
  yggdrasil: { src: "/brand/providers/yggdrasil.png", tone: "light" },
  hacksaw: { src: "/brand/providers/hacksaw.png", tone: "dark" },
  greentube: { src: "/brand/providers/greentube.png", tone: "dark" },
  amusnet: { src: "/brand/providers/amusnet.jpg", tone: "light" },
  egt: { src: "/brand/providers/egt.png", tone: "light" },
  endorphina: { src: "/brand/providers/endorphina.png", tone: "light" },
  habanero: { src: "/brand/providers/habanero.png", tone: "light" },
  pgsoft: { src: "/brand/providers/pgsoft.jpg", tone: "light" },
  popok: { src: "/brand/providers/popok.png", tone: "light" },
  platipus: { src: "/brand/providers/platipus.png", tone: "light" },
  "3-oaks": { src: "/brand/providers/3-oaks.jpg", tone: "dark" },
  wazdan: { src: "/brand/providers/wazdan.png", tone: "dark" },
  // bgaming: monogram fallback until its original is verified.
};

const DISPLAY: Record<string, string> = {
  redtiger: "Red Tiger",
  playngo: "Play'n GO",
  greentube: "Greentube",
  yggdrasil: "Yggdrasil",
  cq9: "CQ9",
  pgsoft: "PG Soft",
  popok: "PopOK",
  "3-oaks": "3 Oaks",
  "idn-live": "IDN Live",
  idn: "IDN",
  "pragmatic-play-live": "Pragmatic Play Live",
  fachai: "FaChai",
  rubyplay: "RubyPlay",
  spagaming: "SpadeGaming",
  amatic: "AMATIC",
  pascal: "Pascal Gaming",
};

export function providerDisplayName(name: string): string {
  const slug = providerSlug(name);
  return DISPLAY[slug] ?? name.trim() ?? name;
}

export function providerLogoFor(name: string, hubLogo?: string | null): CuratedLogo | null {
  if (hubLogo && hubLogo.length > 8) return { src: hubLogo, tone: "light" };
  return CURATED[providerSlug(name)] ?? null;
}

export type ProviderGroup = {
  /** Display name (prettified hub value). */
  name: string;
  slug: string;
  logo: string | null;
  tone: "light" | "dark";
  games: CatalogGame[];
  live: number;
};

export function groupByProvider(games: CatalogGame[]): ProviderGroup[] {
  const buckets = new Map<string, CatalogGame[]>();
  for (const game of games) {
    const key = game.provider.trim() || "Studio";
    const bucket = buckets.get(key);
    if (bucket) bucket.push(game);
    else buckets.set(key, [game]);
  }
  return [...buckets.entries()]
    .map(([raw, gs]) => {
      const slug = providerSlug(raw);
      const hub = gs.find((g) => g.providerLogo)?.providerLogo;
      const curated = CURATED[slug];
      return {
        name: providerDisplayName(raw),
        slug,
        logo: hub ?? curated?.src ?? null,
        tone: curated?.tone ?? "light",
        games: gs,
        live: gs.filter((g) => g.live).length,
      } satisfies ProviderGroup;
    })
    .sort((a, b) => b.games.length - a.games.length || a.name.localeCompare(b.name));
}
