import type { CatalogGame } from "@/lib/games-catalog";

/**
 * Provider metadata for the studio lobby: slugs, display names, curated
 * original logos (self-hosted), and premium ranking for shelf order.
 *
 * Resolution: curated original → hub logo → monogram (ProviderMark).
 * Hub assets are often game thumbs, not lockups — curated wins.
 */

export function providerSlug(name: string): string {
  const slug = name
    .toLowerCase()
    .trim()
    .replace(/['’]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  return ALIAS[slug] ?? slug || "studio";
}

const ALIAS: Record<string, string> = {
  "play-n-go": "playngo",
  "play-n-go-live": "playngo",
  "red-tiger": "redtiger",
  "red-tiger-gaming": "redtiger",
  "pg-soft": "pgsoft",
  "pg-softs": "pgsoft",
  b-gaming: "bgaming",
  "b-gaming": "bgaming",
  evolution: "evolution-gaming",
  evo: "evolution-gaming",
  "pragmatic": "pragmatic-play",
  "pragmaticplay": "pragmatic-play",
  "pragmatic-live": "pragmatic-play-live",
  "spade-gaming": "spadegaming",
  "idnlive": "idn-live",
  "3oaks": "3-oaks",
  "three-oaks": "3-oaks",
  fa-chai: "fachai",
  "fa-chai": "fachai",
  "pascal-gaming": "pascal",
};

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
  bgaming: { src: "/brand/providers/bgaming.svg", tone: "dark" },
  cq9: { src: "/brand/providers/cq9.svg", tone: "dark" },
  "idn-live": { src: "/brand/providers/idn-live.svg", tone: "dark" },
  idn: { src: "/brand/providers/idn-live.svg", tone: "dark" },
  spadegaming: { src: "/brand/providers/spadegaming.svg", tone: "dark" },
  amatic: { src: "/brand/providers/amatic.svg", tone: "light" },
  rubyplay: { src: "/brand/providers/rubyplay.svg", tone: "dark" },
  pascal: { src: "/brand/providers/pascal.svg", tone: "dark" },
  fachai: { src: "/brand/providers/fachai.svg", tone: "dark" },
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
  fachai: "Fa Chai",
  rubyplay: "RubyPlay",
  spadegaming: "Spade Gaming",
  amatic: "AMATIC",
  pascal: "Pascal Gaming",
  bgaming: "BGaming",
  hacksaw: "Hacksaw Gaming",
  netent: "NetEnt",
  "relax-gaming": "Relax Gaming",
  "evolution-gaming": "Evolution",
  "pragmatic-play": "Pragmatic Play",
};

/** Lower = shown earlier on the lobby. Unknown studios fall after. */
const PREMIUM_RANK: Record<string, number> = {
  "pragmatic-play": 1,
  "pragmatic-play-live": 2,
  "evolution-gaming": 3,
  netent: 4,
  playngo: 5,
  hacksaw: 6,
  "relax-gaming": 7,
  redtiger: 8,
  yggdrasil: 9,
  pgsoft: 10,
  bgaming: 11,
  endorphina: 12,
  habanero: 13,
  cq9: 14,
  wazdan: 15,
  egt: 16,
  greentube: 17,
  amusnet: 18,
  "3-oaks": 19,
  platipus: 20,
  popok: 21,
  spadegaming: 22,
  amatic: 23,
  rubyplay: 24,
  "idn-live": 25,
  idn: 26,
  fachai: 27,
  pascal: 28,
};

export function isPremiumProvider(nameOrSlug: string): boolean {
  const slug = providerSlug(nameOrSlug);
  const rank = PREMIUM_RANK[slug];
  return rank != null && rank <= 14;
}

export function providerDisplayName(name: string): string {
  const slug = providerSlug(name);
  return DISPLAY[slug] ?? name.trim() ?? name;
}

export function providerLogoFor(name: string, hubLogo?: string | null): CuratedLogo | null {
  const curated = CURATED[providerSlug(name)];
  if (curated) return curated;
  if (hubLogo && hubLogo.length > 8) return { src: hubLogo, tone: "light" };
  return null;
}

export type ProviderGroup = {
  name: string;
  slug: string;
  logo: string | null;
  tone: "light" | "dark";
  games: CatalogGame[];
  live: number;
  premium: boolean;
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
      const logo = providerLogoFor(raw, gs.find((g) => g.providerLogo)?.providerLogo);
      return {
        name: providerDisplayName(raw),
        slug,
        logo: logo?.src ?? null,
        tone: logo?.tone ?? "light",
        games: gs,
        live: gs.filter((g) => g.live).length,
        premium: isPremiumProvider(slug),
      } satisfies ProviderGroup;
    })
    .sort((a, b) => {
      const ra = PREMIUM_RANK[a.slug] ?? 80;
      const rb = PREMIUM_RANK[b.slug] ?? 80;
      if (ra !== rb) return ra - rb;
      return b.games.length - a.games.length || a.name.localeCompare(b.name);
    });
}
