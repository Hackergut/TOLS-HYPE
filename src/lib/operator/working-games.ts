/**
 * Gradual provider migration. Only slugs that Next already launches
 * (flexrix-slugs.ts + featured lobby) appear on HYPE.
 * Append a slug here after launch-demo or real launch returns a URL.
 * Do not dump the 5056-title catalog.
 */

export type WorkingWave = 1;

export type WorkingGame = {
  slug: string;
  title: string;
  provider: string;
  category: "slots" | "live";
  wave: WorkingWave;
  cover?: string;
};

export const WORKING_SLOTS_WAVE_1: WorkingGame[] = [
  { slug: "vs20fruitsw", title: "Sweet Bonanza", provider: "Pragmatic Play", category: "slots", wave: 1 },
  { slug: "vs20olympgate", title: "Gates of Olympus", provider: "Pragmatic Play", category: "slots", wave: 1 },
  { slug: "vs20starlight", title: "Starlight Princess", provider: "Pragmatic Play", category: "slots", wave: 1 },
  { slug: "vs20sugarrush", title: "Sugar Rush", provider: "Pragmatic Play", category: "slots", wave: 1 },
  { slug: "vs10bbbonanza", title: "Big Bass Bonanza", provider: "Pragmatic Play", category: "slots", wave: 1 },
  { slug: "vs20doghouse", title: "The Dog House", provider: "Pragmatic Play", category: "slots", wave: 1 },
  { slug: "vs20fruitparty", title: "Fruit Party", provider: "Pragmatic Play", category: "slots", wave: 1 },
  { slug: "vs25wolfgold", title: "Wolf Gold", provider: "Pragmatic Play", category: "slots", wave: 1 },
  { slug: "vs20kraken", title: "Release the Kraken", provider: "Pragmatic Play", category: "slots", wave: 1 },
  { slug: "vs20fruitswx", title: "Sweet Bonanza 1000", provider: "Pragmatic Play", category: "slots", wave: 1 },
  { slug: "vs20olympx", title: "Gates of Olympus 1000", provider: "Pragmatic Play", category: "slots", wave: 1 },
  { slug: "vs20sugarrushx", title: "Sugar Rush 1000", provider: "Pragmatic Play", category: "slots", wave: 1 },
  { slug: "playngo-bookofdead", title: "Book of Dead", provider: "Play'n GO", category: "slots", wave: 1 },
  { slug: "playngo-reactoonz", title: "Reactoonz", provider: "Play'n GO", category: "slots", wave: 1 },
  { slug: "playngo-firejoker", title: "Fire Joker", provider: "Play'n GO", category: "slots", wave: 1 },
  { slug: "playngo-riseofolympus", title: "Rise of Olympus", provider: "Play'n GO", category: "slots", wave: 1 },
  { slug: "playngo-moonprincess", title: "Moon Princess", provider: "Play'n GO", category: "slots", wave: 1 },
  { slug: "hacksaw-le-bandit", title: "Le Bandit", provider: "Hacksaw Gaming", category: "slots", wave: 1 },
  { slug: "hacksaw-wanted-dead-or-a-wild", title: "Wanted Dead or a Wild", provider: "Hacksaw Gaming", category: "slots", wave: 1 },
  { slug: "hacksaw-chaos-crew", title: "Chaos Crew", provider: "Hacksaw Gaming", category: "slots", wave: 1 },
  { slug: "hacksaw-dork-unit", title: "Dork Unit", provider: "Hacksaw Gaming", category: "slots", wave: 1 },
  { slug: "hacksaw-rip-city", title: "Rip City", provider: "Hacksaw Gaming", category: "slots", wave: 1 },
  { slug: "hacksaw-hand-of-anubis", title: "Hand of Anubis", provider: "Hacksaw Gaming", category: "slots", wave: 1 },
  { slug: "fortune-ox", title: "Fortune Ox", provider: "PG Soft", category: "slots", wave: 1 },
];

export const WORKING_LIVE_WAVE_1: WorkingGame[] = [
  { slug: "evo-lightning-roulette", title: "Lightning Roulette", provider: "Evolution", category: "live", wave: 1 },
  { slug: "evo-immersive-roulette", title: "Immersive Roulette", provider: "Evolution", category: "live", wave: 1 },
  { slug: "evo-crazy-time", title: "Crazy Time", provider: "Evolution", category: "live", wave: 1 },
  { slug: "evo-funky-time", title: "Funky Time", provider: "Evolution", category: "live", wave: 1 },
  { slug: "evo-dream-catcher", title: "Dream Catcher", provider: "Evolution", category: "live", wave: 1 },
  { slug: "evo-monopoly-big-baller", title: "Monopoly Big Baller", provider: "Evolution", category: "live", wave: 1 },
  { slug: "evo-mega-ball", title: "Mega Ball", provider: "Evolution", category: "live", wave: 1 },
  { slug: "evo-lightning-baccarat", title: "Lightning Baccarat", provider: "Evolution", category: "live", wave: 1 },
  { slug: "spaceman", title: "Spaceman", provider: "Pragmatic Play Live", category: "live", wave: 1 },
  { slug: "casinoholdem", title: "Casino Hold'em", provider: "Evolution", category: "live", wave: 1 },
];

export const WORKING_GAMES_WAVE_1: WorkingGame[] = [
  ...WORKING_SLOTS_WAVE_1,
  ...WORKING_LIVE_WAVE_1,
];

const ALLOWED = new Set(WORKING_GAMES_WAVE_1.map((g) => g.slug));

export function normalizeLobbySlug(raw: string): string {
  return String(raw || "")
    .replace(/^flexrix-/, "")
    .trim()
    .toLowerCase();
}

export function isWorkingSlug(slug: string): boolean {
  return ALLOWED.has(normalizeLobbySlug(slug));
}

export function isLiveHubSlug(slug: string): boolean {
  const id = normalizeLobbySlug(slug);
  return id.startsWith("evo-") || WORKING_LIVE_WAVE_1.some((g) => g.slug === id);
}

export function lookupWorkingGame(slug: string): WorkingGame | undefined {
  const id = normalizeLobbySlug(slug);
  return WORKING_GAMES_WAVE_1.find((g) => g.slug === id);
}
