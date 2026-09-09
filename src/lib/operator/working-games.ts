import type { CatalogGame, GameCategory } from "@/lib/games-catalog";

/** Incremental Flexrix migration. Only slugs verified against live launch-demo. */
export type WorkingWave = 1 | 2;

export type WorkingTitle = {
  slug: string;
  title: string;
  provider: string;
  category: "slots" | "live";
  wave: WorkingWave;
  /** Live tables reject /api/flexrix/launch-demo with DEMO_NOT_SUPPORTED. */
  demo: boolean;
  cover: string;
  hot?: boolean;
};

const PP = (slug: string) => `https://common-static.ppgames.net/game_pic/square/200/${slug}.png`;
const SLOT = "/brand/games/slots.jpg";

export const WORKING_TITLES: WorkingTitle[] = [
  { slug: "vs20fruitsw", title: "Sweet Bonanza", provider: "Pragmatic Play", category: "slots", wave: 1, demo: true, cover: PP("vs20fruitsw"), hot: true },
  { slug: "vs20olympgate", title: "Gates of Olympus", provider: "Pragmatic Play", category: "slots", wave: 1, demo: true, cover: PP("vs20olympgate"), hot: true },
  { slug: "vs20sugarrush", title: "Sugar Rush", provider: "Pragmatic Play", category: "slots", wave: 1, demo: true, cover: PP("vs20sugarrush") },
  { slug: "vs20starlight", title: "Starlight Princess", provider: "Pragmatic Play", category: "slots", wave: 1, demo: true, cover: PP("vs20starlight") },
  { slug: "vs10bbbonanza", title: "Big Bass Bonanza", provider: "Pragmatic Play", category: "slots", wave: 1, demo: true, cover: PP("vs10bbbonanza"), hot: true },
  { slug: "vs20doghouse", title: "The Dog House", provider: "Pragmatic Play", category: "slots", wave: 1, demo: true, cover: PP("vs20doghouse") },
  { slug: "vs20fruitparty", title: "Fruit Party", provider: "Pragmatic Play", category: "slots", wave: 1, demo: true, cover: PP("vs20fruitparty") },
  { slug: "vs20fruitswx", title: "Sweet Bonanza 1000", provider: "Pragmatic Play", category: "slots", wave: 1, demo: true, cover: PP("vs20fruitswx"), hot: true },
  { slug: "vs20candvil", title: "Candy Village", provider: "Pragmatic Play", category: "slots", wave: 1, demo: true, cover: PP("vs20candvil") },
  { slug: "vs20sugrushss", title: "Sugar Rush Super Scatter", provider: "Pragmatic Play", category: "slots", wave: 1, demo: true, cover: PP("vs20sugrushss") },
  { slug: "vs25wolfgold", title: "Wolf Gold", provider: "Pragmatic Play", category: "slots", wave: 1, demo: true, cover: PP("vs25wolfgold") },
  { slug: "vs20kraken", title: "Release the Kraken", provider: "Pragmatic Play", category: "slots", wave: 1, demo: true, cover: PP("vs20kraken") },
  { slug: "vs20olympx", title: "Gates of Olympus 1000", provider: "Pragmatic Play", category: "slots", wave: 1, demo: true, cover: PP("vs20olympx") },
  { slug: "vs20sugarrushx", title: "Sugar Rush 1000", provider: "Pragmatic Play", category: "slots", wave: 1, demo: true, cover: PP("vs20sugarrushx") },
  { slug: "playngo-bookofdead", title: "Book of Dead", provider: "Play'n GO", category: "slots", wave: 1, demo: true, cover: SLOT },
  { slug: "playngo-reactoonz", title: "Reactoonz", provider: "Play'n GO", category: "slots", wave: 1, demo: true, cover: SLOT },
  { slug: "playngo-firejoker", title: "Fire Joker", provider: "Play'n GO", category: "slots", wave: 1, demo: true, cover: SLOT },
  { slug: "playngo-riseofolympus", title: "Rise of Olympus", provider: "Play'n GO", category: "slots", wave: 1, demo: true, cover: SLOT },
  { slug: "playngo-moonprincess", title: "Moon Princess", provider: "Play'n GO", category: "slots", wave: 1, demo: true, cover: SLOT },
  { slug: "hacksaw-le-bandit", title: "Le Bandit", provider: "Hacksaw Gaming", category: "slots", wave: 1, demo: true, cover: SLOT },
  { slug: "hacksaw-wanted-dead-or-a-wild", title: "Wanted Dead or a Wild", provider: "Hacksaw Gaming", category: "slots", wave: 1, demo: true, cover: SLOT },
  { slug: "hacksaw-chaos-crew", title: "Chaos Crew", provider: "Hacksaw Gaming", category: "slots", wave: 1, demo: true, cover: SLOT },
  { slug: "hacksaw-dork-unit", title: "Dork Unit", provider: "Hacksaw Gaming", category: "slots", wave: 1, demo: true, cover: SLOT },
  { slug: "hacksaw-rip-city", title: "Rip City", provider: "Hacksaw Gaming", category: "slots", wave: 1, demo: true, cover: SLOT },
  { slug: "hacksaw-hand-of-anubis", title: "Hand of Anubis", provider: "Hacksaw Gaming", category: "slots", wave: 1, demo: true, cover: SLOT },
  { slug: "hacksaw-rainbow-princess", title: "Rainbow Princess", provider: "Hacksaw Gaming", category: "slots", wave: 1, demo: true, cover: SLOT },
  { slug: "fortune-ox", title: "Fortune Ox", provider: "PG Soft", category: "slots", wave: 1, demo: true, cover: SLOT },
  { slug: "fortune-mouse", title: "Fortune Mouse", provider: "PG Soft", category: "slots", wave: 1, demo: true, cover: SLOT },
  { slug: "relax-wilddonuts", title: "Wild Donuts", provider: "Relax Gaming", category: "slots", wave: 1, demo: true, cover: SLOT },
  { slug: "ygg-7365", title: "Age of Asgard", provider: "Yggdrasil", category: "slots", wave: 1, demo: true, cover: SLOT },

  { slug: "sushi", title: "Sushi", provider: "Endorphina", category: "slots", wave: 2, demo: true, cover: SLOT },
  { slug: "jetsetter", title: "Jetsetter", provider: "Endorphina", category: "slots", wave: 2, demo: true, cover: SLOT },
  { slug: "lumber-jack", title: "Lumber Jack", provider: "Endorphina", category: "slots", wave: 2, demo: true, cover: SLOT },
  { slug: "red-cap", title: "Red Cap", provider: "Endorphina", category: "slots", wave: 2, demo: true, cover: SLOT },
  { slug: "hell-hot-40", title: "Hell Hot 40", provider: "Endorphina", category: "slots", wave: 2, demo: true, cover: SLOT },
  { slug: "voodoo-dice", title: "Voodoo Dice", provider: "Endorphina", category: "slots", wave: 2, demo: true, cover: SLOT },
  { slug: "100-zombies-dice", title: "100 Zombies Dice", provider: "Endorphina", category: "slots", wave: 2, demo: true, cover: SLOT },
  { slug: "2023-hit-slot", title: "2023 Hit Slot", provider: "Endorphina", category: "slots", wave: 2, demo: true, cover: SLOT },
  { slug: "640", title: "Kemet's Dice", provider: "Amusnet", category: "slots", wave: 2, demo: true, cover: SLOT },
  { slug: "899", title: "Rich World", provider: "Amusnet", category: "slots", wave: 2, demo: true, cover: SLOT },
  { slug: "5120", title: "100 Bulky Dice", provider: "Amusnet", category: "slots", wave: 2, demo: true, cover: SLOT },
  { slug: "sglegendofnezha", title: "Legend of Nezha", provider: "Habanero", category: "slots", wave: 2, demo: true, cover: SLOT },
  { slug: "sgnuwa", title: "Nuwa", provider: "Habanero", category: "slots", wave: 2, demo: true, cover: SLOT },
  { slug: "sgvalentinemonchy", title: "Valentine Monchy", provider: "Habanero", category: "slots", wave: 2, demo: true, cover: SLOT },
  { slug: "sgindiancashcatcher", title: "Indian Cash Catcher", provider: "Habanero", category: "slots", wave: 2, demo: true, cover: SLOT },
  { slug: "relax-boneraiders", title: "Bone Raiders", provider: "Relax Gaming", category: "slots", wave: 2, demo: true, cover: SLOT },
  { slug: "relax-9kkonginvegas", title: "9k Kong in Vegas", provider: "Relax Gaming", category: "slots", wave: 2, demo: true, cover: SLOT },
  { slug: "relax-ageofhuracan", title: "Age of Huracan", provider: "Relax Gaming", category: "slots", wave: 2, demo: true, cover: SLOT },
  { slug: "relax-krakenscove", title: "Kraken's Cove", provider: "Relax Gaming", category: "slots", wave: 2, demo: true, cover: SLOT },
  { slug: "relax-5wildbuffalo2", title: "5 Wild Buffalo 2", provider: "Relax Gaming", category: "slots", wave: 2, demo: true, cover: SLOT },
  { slug: "relax-7goldfruits", title: "7 Gold Fruits", provider: "Relax Gaming", category: "slots", wave: 2, demo: true, cover: SLOT },
  { slug: "relax-12burningbaseballs", title: "12 Burning Baseballs", provider: "Relax Gaming", category: "slots", wave: 2, demo: true, cover: SLOT },
  { slug: "relax-bigstacklumberjack", title: "Big Stack Lumberjack", provider: "Relax Gaming", category: "slots", wave: 2, demo: true, cover: SLOT },
  { slug: "relax-spaceattacksdd", title: "Space Attacks", provider: "Relax Gaming", category: "slots", wave: 2, demo: true, cover: SLOT },
  { slug: "relax-shamrockmoneypot10kways", title: "Shamrock Money Pot 10K Ways", provider: "Relax Gaming", category: "slots", wave: 2, demo: true, cover: SLOT },
  { slug: "ygg-1031", title: "TikiPop", provider: "Yggdrasil", category: "slots", wave: 2, demo: true, cover: SLOT },
  { slug: "fortune-tiger", title: "Fortune Tiger", provider: "PG Soft", category: "slots", wave: 2, demo: true, cover: SLOT, hot: true },
  { slug: "fortune-dragon", title: "Fortune Dragon", provider: "PG Soft", category: "slots", wave: 2, demo: true, cover: SLOT },
  { slug: "mahjong-ways", title: "Mahjong Ways", provider: "PG Soft", category: "slots", wave: 2, demo: true, cover: SLOT },
  { slug: "legend-of-hou-yi", title: "Legend of Hou Yi", provider: "PG Soft", category: "slots", wave: 2, demo: true, cover: SLOT },
  { slug: "muay-thai-champion", title: "Muay Thai Champion", provider: "PG Soft", category: "slots", wave: 2, demo: true, cover: SLOT },
  { slug: "rise-sun-god", title: "Rise Sun God", provider: "PG Soft", category: "slots", wave: 2, demo: true, cover: SLOT },
  { slug: "gemstones-gold", title: "Gemstones Gold", provider: "PG Soft", category: "slots", wave: 2, demo: true, cover: SLOT },

  { slug: "evo-crazy-time", title: "Crazy Time", provider: "Evolution", category: "live", wave: 1, demo: false, cover: "/brand/games/roulette.jpg", hot: true },
  { slug: "evo-lightning-roulette", title: "Lightning Roulette", provider: "Evolution", category: "live", wave: 1, demo: false, cover: "/brand/games/roulette.jpg", hot: true },
  { slug: "evo-funky-time", title: "Funky Time", provider: "Evolution", category: "live", wave: 1, demo: false, cover: "/brand/games/roulette.jpg" },
  { slug: "evo-monopoly-big-baller", title: "Monopoly Big Baller", provider: "Evolution", category: "live", wave: 1, demo: false, cover: "/brand/games/roulette.jpg" },
  { slug: "evo-dragon-tiger", title: "Dragon Tiger", provider: "Evolution", category: "live", wave: 1, demo: false, cover: "/brand/games/blackjack.jpg" },
  { slug: "evo-auto-roulette", title: "Auto-Roulette", provider: "Evolution", category: "live", wave: 1, demo: false, cover: "/brand/games/roulette.jpg" },
  { slug: "spaceman", title: "Spaceman", provider: "Pragmatic Play Live", category: "live", wave: 1, demo: false, cover: "/brand/games/crash.jpg", hot: true },
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
    players: undefined,
    edge: 0.04,
    rtp: 96,
    blurb: t.demo ? "Verified Flexrix demo launch." : "Live table — sign in to play. No demo.",
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
