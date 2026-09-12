export const CURRENCIES = ["SOL", "USDT", "BTC", "ETH"] as const;
export type Currency = (typeof CURRENCIES)[number];

export const CURRENCY_META: Record<
  Currency,
  { label: string; symbol: string; minBet: number; maxBet: number }
> = {
  SOL: { label: "Solana", symbol: "◎", minBet: 0.01, maxBet: 50 },
  USDT: { label: "Tether", symbol: "₮", minBet: 1, maxBet: 500 },
  BTC: { label: "Bitcoin", symbol: "₿", minBet: 0.0001, maxBet: 0.05 },
  ETH: { label: "Ether", symbol: "Ξ", minBet: 0.001, maxBet: 0.5 },
};

export const STARTING_BALANCES: Record<Currency, number> = {
  SOL: 0,
  USDT: 0,
  BTC: 0,
  ETH: 0,
};

export function emptyBalances(): Record<Currency, number> {
  return { SOL: 0, USDT: 0, BTC: 0, ETH: 0 };
}

export type GameCategory = "originals" | "slots" | "table" | "live" | "crash";

export type GameKind =
  | "crash"
  | "roulette"
  | "blackjack"
  | "slots"
  | "dice"
  | "mines"
  | "keno"
  | "hilo"
  | "pool"
  | "iframe";

export type CatalogGame = {
  id: string;
  title: string;
  provider: string;
  category: GameCategory;
  kind: GameKind;
  hot?: boolean;
  isNew?: boolean;
  live?: boolean;
  original?: boolean;
  players?: number;
  edge: number;
  rtp: number;
  blurb: string;
  cover: string;
  cta?: string;
};

export const ORIGINALS: CatalogGame[] = [
  {
    id: "neon-crash",
    title: "Crash",
    provider: "TOLS Originals",
    category: "crash",
    kind: "crash",
    hot: true,
    original: true,
    players: 1842,
    edge: 0.01,
    rtp: 99,
    blurb: "Ride the curve. Cash out before it snaps.",
    cover: "/brand/games/crash.jpg",
    cta: "Ride",
  },
  {
    id: "midnight-roulette",
    title: "TOLS Roulette",
    provider: "TOLS Originals",
    category: "table",
    kind: "roulette",
    hot: true,
    original: true,
    players: 903,
    edge: 0.027,
    rtp: 97.3,
    blurb: "European single zero.",
    cover: "/brand/games/roulette.jpg",
    cta: "Play",
  },
  {
    id: "obsidian-blackjack",
    title: "Blackjack",
    provider: "TOLS Originals",
    category: "table",
    kind: "blackjack",
    original: true,
    players: 611,
    edge: 0.005,
    rtp: 99,
    blurb: "Dealer stands on 17. Blackjack pays 3:2.",
    cover: "/brand/games/blackjack.jpg",
    cta: "Deal",
  },
  {
    id: "pulse-slots",
    title: "Neon Sevens",
    provider: "TOLS Originals",
    category: "slots",
    kind: "slots",
    isNew: true,
    original: true,
    players: 2204,
    edge: 0.04,
    rtp: 92,
    blurb: "Three reels, one payline.",
    cover: "/brand/games/slots.jpg",
    cta: "Spin",
  },
  {
    id: "signal-dice",
    title: "Dice",
    provider: "TOLS Originals",
    category: "originals",
    kind: "dice",
    original: true,
    hot: true,
    players: 1477,
    edge: 0.01,
    rtp: 99,
    blurb: "Roll under or over. Instant.",
    cover: "/brand/games/dice.jpg",
    cta: "Bet",
  },
  {
    id: "grid-mines",
    title: "Mines",
    provider: "TOLS Originals",
    category: "originals",
    kind: "mines",
    original: true,
    isNew: true,
    players: 1290,
    edge: 0.01,
    rtp: 99,
    blurb: "Twenty-five tiles. Cash out while you can.",
    cover: "/brand/games/mines.jpg",
    cta: "Bet",
  },
  {
    id: "keno-40",
    title: "Keno",
    provider: "TOLS Originals",
    category: "originals",
    kind: "keno",
    original: true,
    hot: true,
    players: 804,
    edge: 0.04,
    rtp: 96,
    blurb: "Pick 1–10 numbers on a 40-spot board.",
    cover: "/brand/games/keno.jpg",
    cta: "Bet",
  },
  {
    id: "hilo-ace",
    title: "Hi-Lo",
    provider: "TOLS Originals",
    category: "originals",
    kind: "hilo",
    original: true,
    players: 512,
    edge: 0.01,
    rtp: 99,
    blurb: "Higher or same. Lower or same.",
    cover: "/brand/games/hilo.jpg",
    cta: "Bet",
  },
  {
    id: "voltage-live",
    title: "Live Roulette",
    provider: "Studio Live",
    category: "live",
    kind: "roulette",
    live: true,
    hot: true,
    players: 438,
    edge: 0.027,
    rtp: 97.3,
    blurb: "Live-table pacing on the European wheel.",
    cover: "/brand/games/roulette.jpg",
    cta: "Play",
  },
  {
    id: "velvet-live-bj",
    title: "Live Blackjack",
    provider: "Studio Live",
    category: "live",
    kind: "blackjack",
    live: true,
    players: 291,
    edge: 0.005,
    rtp: 99,
    blurb: "Felt-side blackjack with the same house rules.",
    cover: "/brand/games/blackjack.jpg",
    cta: "Deal",
  },
  {
    id: "pool-rush",
    title: "Pool Rush",
    provider: "TOLS Originals",
    category: "originals",
    kind: "pool",
    original: true,
    isNew: true,
    hot: true,
    players: 980,
    edge: 0.04,
    rtp: 96,
    blurb: "Break the rack for multipliers.",
    cover: "/brand/games/pool.jpg",
    cta: "Break",
  },
  {
    id: "orbit-crash",
    title: "Orbit Crash",
    provider: "TOLS Originals",
    category: "crash",
    kind: "crash",
    original: true,
    isNew: true,
    players: 764,
    edge: 0.04,
    rtp: 96,
    blurb: "A slower climb. Same cash-out nerve.",
    cover: "/brand/games/crash.jpg",
    cta: "Ride",
  },
];

function operatorGames(): CatalogGame[] {
  const raw = String(
    (typeof import.meta !== "undefined" &&
      (import.meta as { env?: Record<string, string | undefined> }).env?.VITE_OPERATOR_GAMES) ||
      "",
  );
  if (!raw.trim()) return [];
  try {
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed.flatMap((row) => {
      if (!row || typeof row !== "object") return [];
      const g = row as Record<string, unknown>;
      const id = String(g.id ?? "").trim();
      const title = String(g.title ?? "").trim();
      if (!id || !title) return [];
      return [
        {
          id,
          title,
          provider: String(g.provider ?? "Operator"),
          category: (g.category as GameCategory) ?? "slots",
          kind: (g.kind as GameKind) ?? "iframe",
          original: Boolean(g.original),
          live: Boolean(g.live),
          hot: Boolean(g.hot),
          isNew: Boolean(g.isNew),
          players: Number(g.players ?? 0) || undefined,
          edge: Number(g.edge ?? 0.04),
          rtp: Number(g.rtp ?? 96),
          blurb: String(g.blurb ?? ""),
          cover: String(g.cover ?? "/brand/games/slots.jpg"),
          cta: String(g.cta ?? "Play"),
        } satisfies CatalogGame,
      ];
    });
  } catch {
    return [];
  }
}

export const GAMES: CatalogGame[] = [...ORIGINALS, ...operatorGames()];

/** Next / Shuffle slugs → this app's official originals. */
const ORIGINAL_ALIASES: Record<string, string> = {
  dice: "signal-dice",
  crash: "neon-crash",
  "neon-crash": "neon-crash",
  mines: "grid-mines",
  keno: "keno-40",
  hilo: "hilo-ace",
  "hi-lo": "hilo-ace",
  "hi lo": "hilo-ace",
  roulette: "midnight-roulette",
  blackjack: "obsidian-blackjack",
  slots: "pulse-slots",
  sevens: "pulse-slots",
  "neon-sevens": "pulse-slots",
  pool: "pool-rush",
  limbo: "neon-crash",
  wheel: "midnight-roulette",
  coinflip: "signal-dice",
  coin: "signal-dice",
  plinko: "keno-40",
  shoot: "grid-mines",
};

export function canonicalGameId(id: string): string {
  const key = id.trim().toLowerCase().replace(/_/g, "-");
  return ORIGINAL_ALIASES[key] ?? id.trim();
}

export function isHouseOriginal(game: CatalogGame): boolean {
  return Boolean(game.original) || game.provider === "TOLS Originals";
}

export const HERO_SLIDES = [
  {
    id: "obsidian-blackjack",
    kicker: "TOLS",
    titleLime: "TOLS",
    titleRest: "ORIGINALS",
    subtitle: "Silicone originals · lime · fluo purple",
    cta: "PLAY",
    image: "/brand/promo/hero-main.jpg",
    position: "center",
    alt: "TOLS lime chip with official T mark among dark silicone cards with purple rims",
  },
  {
    id: "pulse-slots",
    kicker: "NEON SEVENS",
    titleLime: "NEON",
    titleRest: "SEVENS",
    subtitle: "Three reels, one payline · 92% RTP",
    cta: "SPIN",
    image: "/brand/games/slots.jpg",
    position: "right center",
    alt: "Neon Sevens slot reels in dark-grey silicone with lime sevens",
  },
  {
    id: "pool-rush",
    kicker: "POOL RUSH",
    titleLime: "POOL",
    titleRest: "RUSH",
    subtitle: "New Original · break the rack for multipliers",
    cta: "BREAK",
    image: "/brand/promo/hero-pool.jpg",
    position: "center",
    alt: "Pool Rush break — dark-grey silicone balls exploding off the rack",
  },
  {
    id: "midnight-roulette",
    kicker: "TOLS ROULETTE",
    titleLime: "TOLS",
    titleRest: "ROULETTE",
    subtitle: "European single zero · 97.3% RTP",
    cta: "PLAY",
    image: "/brand/games/roulette.jpg",
    position: "center",
    alt: "TOLS Roulette wheel in matte dark-grey silicone with a lime ball",
  },
] as const;

export const CATEGORIES: { id: GameCategory | "all"; label: string }[] = [
  { id: "all", label: "Lobby" },
  { id: "originals", label: "Originals" },
  { id: "slots", label: "Slots" },
  { id: "table", label: "Table Games" },
  { id: "live", label: "Live Show" },
  { id: "crash", label: "Crash" },
];

export function getGame(id: string): CatalogGame | undefined {
  const canon = canonicalGameId(id);
  return GAMES.find((g) => g.id === canon || g.id === id);
}

export function gamesByCategory(category: GameCategory | "all"): CatalogGame[] {
  if (category === "all") return GAMES;
  if (category === "originals") return GAMES.filter(isHouseOriginal);
  return GAMES.filter((g) => g.category === category);
}

export { SPORT_EVENTS as SPORTS } from "@/lib/sports-book";

export type PromoCtaTo = "/login" | "/vip" | "/profile" | "/casino" | "/affiliate" | "/promotions";

export const PROMOS: {
  id: string;
  title: string;
  kicker: string;
  tag: string;
  copy: string;
  badge: string;
  image: string;
  body: string;
  bullets: string[];
  cta: string;
  to: PromoCtaTo;
}[] = [
  {
    id: "welcome",
    title: "Welcome Bonus",
    kicker: "Welcome",
    tag: "New players",
    copy: "Welcome · 100% match on your first deposit",
    badge: "100% up to $1,000",
    image: "/brand/promo/welcome.jpg",
    body: "New players get a 100% match on their first deposit, up to $1,000, credited as bonus money. Play it through to release it into your withdrawable balance.",
    bullets: ["First deposit only", "30× wagering requirement", "Valid for 7 days"],
    cta: "Claim",
    to: "/login",
  },
  {
    id: "rakeback",
    title: "Daily Rakeback",
    kicker: "Rakeback",
    tag: "Automatic",
    copy: "Rakeback · Up to 20% back, every single day",
    badge: "Up to 20% back",
    image: "/brand/promo/rakeback.jpg",
    body: "Get up to 20% of your daily wagering back, automatically. No opt-in, no claim button — the credit lands in your wallet based on your VIP tier.",
    bullets: ["Based on VIP tier", "Credited daily", "No wagering requirement"],
    cta: "See tiers",
    to: "/vip",
  },
  {
    id: "reload",
    title: "Weekly Reload",
    kicker: "Reload",
    tag: "Fridays",
    copy: "Reload · 50% reload bonus every Friday",
    badge: "50% up to $500",
    image: "/brand/promo/reload.jpg",
    body: "Every Friday, top up with a 50% reload bonus up to $500 on your deposit. Weekend sessions start with more to play.",
    bullets: ["Minimum deposit $20", "1× wagering", "Fridays only"],
    cta: "Deposit",
    to: "/profile",
  },
  {
    id: "cashback",
    title: "Monthly Cashback",
    kicker: "Cashback",
    tag: "1st of month",
    copy: "Cashback · 10% cashback on net losses",
    badge: "10% monthly",
    image: "/brand/promo/cashback.jpg",
    body: "Diamond tier and above receive 10% monthly cashback on net losses, credited on the first of every month with no wagering attached.",
    bullets: ["Diamond+ tier", "Minimum $100 net loss", "No wagering"],
    cta: "See tiers",
    to: "/vip",
  },
  {
    id: "jackpot",
    title: "Mega Drop Jackpot",
    kicker: "Jackpot",
    tag: "Live",
    copy: "Jackpot · A progressive pot that can drop at any moment",
    badge: "Progressive",
    image: "/brand/promo/jackpot.jpg",
    body: "Every real bet feeds the progressive Mega Drop. There is no entry — the jackpot can trigger on any spin or roll, at any stake.",
    bullets: ["Any bet qualifies", "Random trigger", "No maximum bet"],
    cta: "Play now",
    to: "/casino",
  },
  {
    id: "referral",
    title: "Referral Commission",
    kicker: "Referral",
    tag: "Lifetime",
    copy: "Referral · Earn 25–30% revshare, for life",
    badge: "25–30% revshare",
    image: "/brand/promo/referral.jpg",
    body: "Invite friends and earn 25–30% revenue share on their wagers for the lifetime of the account. No cap on referrals.",
    bullets: ["No referral limit", "Lifetime commission", "Revshare or CPA plan"],
    cta: "Invite",
    to: "/affiliate",
  },
  {
    id: "race",
    title: "$100,000 Weekly Race",
    kicker: "Campaign",
    tag: "Weekly",
    copy: "Campaign · Live leaderboard, resets every Monday",
    badge: "$100,000 pool",
    image: "/brand/promo/race.jpg",
    body: "Wager on any Originals to climb the weekly leaderboard. The top players split $100,000 every single week. Paid bets only — practice rounds never count.",
    bullets: ["Paid bets only", "Resets Monday", "Top 100 paid"],
    cta: "View leaderboard",
    to: "/promotions",
  },
  {
    id: "clutch",
    title: "$20K Clutch Up",
    kicker: "Campaign",
    tag: "Ends in 10 days",
    copy: "Campaign · Hit the targets, take the prize",
    badge: "$20,000 pool",
    image: "/brand/promo/clutch.jpg",
    body: "A limited-time challenge: hit the selected multipliers across the Originals to claim a slice of the $20,000 prize pool before the timer runs out.",
    bullets: ["Limited time", "Target multipliers", "One entry per player"],
    cta: "Play Originals",
    to: "/casino",
  },
  {
    id: "level-up",
    title: "Level Up!",
    kicker: "Campaign",
    tag: "VIP",
    copy: "Campaign · A reward at every VIP tier",
    badge: "Reward per tier",
    image: "/brand/promo/level-up.jpg",
    body: "Every VIP tier unlocks new perks — cashback, free spins, priority withdrawals and more. The more you wager, the higher you climb.",
    bullets: ["1 point per $1 wagered", "Tiers auto-upgrade", "Perks stack"],
    cta: "See tiers",
    to: "/vip",
  },
  {
    id: "challenges",
    title: "Casino Challenges",
    kicker: "Campaign",
    tag: "29 open",
    copy: "Campaign · Daily and weekly missions with prizes",
    badge: "29 open",
    image: "/brand/promo/challenges.jpg",
    body: "Complete daily and weekly casino challenges — from streak targets to specific-game missions — and earn bonus rewards as you play.",
    bullets: ["Daily & weekly", "Auto-tracked", "Bonus rewards"],
    cta: "Start a challenge",
    to: "/casino",
  },
];
