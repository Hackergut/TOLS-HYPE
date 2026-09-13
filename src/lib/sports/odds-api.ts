/**
 * The Odds API v4 → TOLS `SportEvent` mapping.
 *
 * Pure on purpose: no env reads, no fetch, no `@/` alias — so this exact module
 * (the one the server ships) is loadable under plain `node --test`
 * (see `odds-api.test.ts`). Everything that touches the network or env lives in
 * `./odds-api.server.ts`, which only orchestrates these functions.
 *
 * Cost model (from the vendor docs — keep this in sync if the plan changes):
 *   /v4/sports, /v4/sports/{s}/events        → free
 *   /v4/sports/{s}/odds                      → markets × regions
 *   /v4/sports/{s}/scores                    → 1 (2 with daysFrom)
 *   /v4/sports/{s}/events/{id}/odds          → unique markets × regions
 *   /v4/historical/...                       → 10 × markets × regions
 * Empty responses are not billed. Quota is reported on every response through
 * `x-requests-remaining` / `x-requests-used` / `x-requests-last`.
 */
import {
  SPORT_META,
  outcomeId,
  type MarketKind,
  type Outcome,
  type SportEvent,
  type SportKind,
} from "../sports-book.ts";

export const ODDS_API_HOST = "https://api.the-odds-api.com";
export const ODDS_API_IPV6_HOST = "https://ipv6-api.the-odds-api.com";
export const ODDS_API_PATH_PREFIX = "/v4";

/** Regions accepted by the `regions` parameter (vendor list, us split in two). */
export const ODDS_API_REGIONS = ["us", "us2", "uk", "au", "eu"] as const;

/** Markets served by the main /odds endpoint. Anything else needs /events/{id}/odds. */
export const ODDS_API_FEATURED_MARKETS = ["h2h", "spreads", "totals", "outrights"] as const;

export type OddsFormat = "decimal" | "american";

/* ------------------------------------------------------------------ *
 * Odds formats
 * ------------------------------------------------------------------ */

/** American → decimal. `+240` → 3.4, `-303` → 1.33. */
export function americanToDecimal(price: number): number {
  if (!Number.isFinite(price) || price === 0) return 0;
  const dec = price > 0 ? price / 100 + 1 : 100 / Math.abs(price) + 1;
  return round2(dec);
}

/** Normalize any incoming price to decimal, whatever format the call asked for. */
export function toDecimalPrice(price: number, format: OddsFormat = "decimal"): number {
  if (format === "american") return americanToDecimal(price);
  return round2(price);
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

/* ------------------------------------------------------------------ *
 * Quota accounting
 * ------------------------------------------------------------------ */

export type OddsApiQuota = {
  remaining: number | null;
  used: number | null;
  last: number | null;
};

/** Cost of an /odds call: `[markets] × [regions]` (documented formula). */
export function oddsCost(markets: number, regions: number): number {
  return Math.max(0, markets) * Math.max(0, regions);
}

/** Historical snapshots cost 10× the current-odds formula. */
export function historicalOddsCost(markets: number, regions: number): number {
  return 10 * oddsCost(markets, regions);
}

/** `/scores` costs 1, or 2 when `daysFrom` asks for completed games too. */
export function scoresCost(daysFrom?: number): number {
  return daysFrom && daysFrom > 0 ? 2 : 1;
}

function headerNumber(headers: Record<string, string>, key: string): number | null {
  const raw = headers[key];
  if (raw == null || raw === "") return null;
  const n = Number(raw);
  return Number.isFinite(n) ? n : null;
}

/**
 * Read the three quota headers the vendor returns on every call. Keys are
 * matched case-insensitively: `fetch` lowercases them, a proxy or a test
 * harness may not, and quota accounting must never depend on header case.
 */
export function parseQuotaHeaders(headers: Record<string, string>): OddsApiQuota {
  const lower: Record<string, string> = {};
  for (const [k, v] of Object.entries(headers)) lower[k.toLowerCase()] = v;
  return {
    remaining: headerNumber(lower, "x-requests-remaining"),
    used: headerNumber(lower, "x-requests-used"),
    last: headerNumber(lower, "x-requests-last"),
  };
}

/* ------------------------------------------------------------------ *
 * Sport mapping
 * ------------------------------------------------------------------ */

/**
 * Vendor `sport_key` → our five UI buckets. Keys are `{sport}_{league}`
 * (`soccer_epl`, `basketball_nba`, `esports_cs_go`, …); outrights carry
 * `_winner` suffixes and are still grouped by their leading token.
 */
export function sportKindFor(sportKey: string | undefined | null): SportKind | null {
  const key = String(sportKey ?? "").toLowerCase();
  if (!key) return null;
  const head = key.split("_")[0] ?? "";
  switch (head) {
    case "soccer":
    case "americanfootball":
    case "aussierules":
    case "rugbyleague":
    case "rugbyunion":
    case "cricket":
    case "baseball":
    case "icehockey":
      return "football";
    case "basketball":
      return "basketball";
    case "tennis":
      return "tennis";
    case "mma":
    case "boxing":
      return "mma";
    case "esports":
      return "esports";
    default:
      return null;
  }
}

/** Outrights/futures are a different bet shape than a fixture — skip them. */
export function isOutrightSport(sportKey: string | undefined | null): boolean {
  return /_winner$|outright/i.test(String(sportKey ?? ""));
}

/* ------------------------------------------------------------------ *
 * Display helpers
 * ------------------------------------------------------------------ */

/** Three-letter board abbreviation, stable across reloads. */
export function abbrFor(name: string): string {
  const clean = String(name ?? "")
    .replace(/\([^)]*\)/g, " ")
    .replace(/[^A-Za-z0-9 ]/g, " ")
    .trim();
  if (!clean) return "TBD";
  const words = clean.split(/\s+/).filter(Boolean);
  if (words.length === 1) {
    const w = words[0]!;
    return w.slice(0, 3).toUpperCase();
  }
  // Multi-word: first letter of the first two words + first of the last one.
  const a = words[0]![0] ?? "";
  const b = words[1]![0] ?? "";
  const c = (words.length > 2 ? words[words.length - 1]![0] : words[1]![1]) ?? "";
  return `${a}${b}${c}`.toUpperCase().slice(0, 3) || clean.slice(0, 3).toUpperCase();
}

/**
 * `commence_time` → the compact label the UI shows ("Tonight 20:00",
 * "Sun 16:00", "Sat 12 Mar 20:00"). In-play events show elapsed minutes
 * instead when `minute` is supplied by the caller.
 */
export function formatStart(commenceTime: string, now: Date = new Date()): string {
  const t = new Date(commenceTime);
  if (Number.isNaN(t.getTime())) return "TBA";
  const hh = String(t.getHours()).padStart(2, "0");
  const mm = String(t.getMinutes()).padStart(2, "0");
  const hm = `${hh}:${mm}`;
  const dayMs = 86_400_000;
  const startOfDay = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
  const diffDays = Math.round((startOfDay(t) - startOfDay(now)) / dayMs);
  if (diffDays === 0) return t.getTime() < now.getTime() ? "Live" : `Today ${hm}`;
  if (diffDays === 1) return `Tomorrow ${hm}`;
  if (diffDays === -1) return `Yesterday ${hm}`;
  if (diffDays > 1 && diffDays < 7) {
    return `${t.toLocaleDateString("en-GB", { weekday: "short" })} ${hm}`;
  }
  return `${t.toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short" })} ${hm}`;
}

/** Elapsed clock label for an in-play event ("67'"), or undefined pre-match. */
export function elapsedMinute(commenceTime: string, now: Date = new Date()): string | undefined {
  const t = new Date(commenceTime);
  if (Number.isNaN(t.getTime())) return undefined;
  const mins = Math.floor((now.getTime() - t.getTime()) / 60_000);
  if (mins < 0) return undefined;
  return `${Math.min(mins, 120)}'`;
}

/** `commence_time` in the past ⇒ the vendor considers the event in-play. */
export function isInPlay(commenceTime: string, now: Date = new Date()): boolean {
  const t = new Date(commenceTime);
  if (Number.isNaN(t.getTime())) return false;
  return t.getTime() < now.getTime();
}

/* ------------------------------------------------------------------ *
 * Vendor response shapes (only the fields we read)
 * ------------------------------------------------------------------ */

export type ApiOutcome = { name?: string; description?: string; price?: number; point?: number };
export type ApiMarket = { key?: string; last_update?: string; outcomes?: ApiOutcome[] };
export type ApiBookmaker = { key?: string; title?: string; last_update?: string; markets?: ApiMarket[] };
export type ApiOddsEvent = {
  id?: string;
  sport_key?: string;
  sport_title?: string;
  commence_time?: string;
  home_team?: string;
  away_team?: string;
  bookmakers?: ApiBookmaker[];
};
export type ApiScoreEvent = {
  id?: string;
  sport_key?: string;
  sport_title?: string;
  commence_time?: string;
  completed?: boolean;
  home_team?: string;
  away_team?: string;
  scores?: { name?: string; score?: string }[] | null;
  last_update?: string | null;
};
export type ApiSport = {
  key?: string;
  group?: string;
  title?: string;
  description?: string;
  active?: boolean;
  has_outrights?: boolean;
};

/* ------------------------------------------------------------------ *
 * Best-price extraction
 * ------------------------------------------------------------------ */

export type BestOutcome = { name: string; price: number; point?: number; bookmaker?: string };

/**
 * Collapse every bookmaker in the payload to the best (highest) decimal price
 * per outcome name — a sportsbook board shows the price the player would
 * actually take. `*_lay` markets (betting exchanges) are ignored: laying is not
 * a market this UI sells.
 */
export function bestPrices(
  bookmakers: ApiBookmaker[] | undefined,
  marketKey: string,
  format: OddsFormat = "decimal",
): BestOutcome[] {
  const best = new Map<string, BestOutcome>();
  for (const bm of bookmakers ?? []) {
    for (const market of bm.markets ?? []) {
      if (market.key !== marketKey) continue;
      for (const o of market.outcomes ?? []) {
        const name = String(o.name ?? "").trim();
        if (!name || typeof o.price !== "number") continue;
        const price = toDecimalPrice(o.price, format);
        if (!Number.isFinite(price) || price <= 1) continue;
        const hit = best.get(name);
        if (!hit || price > hit.price) {
          best.set(name, { name, price, point: o.point, bookmaker: bm.title ?? bm.key });
        }
      }
    }
  }
  return [...best.values()];
}

/* ------------------------------------------------------------------ *
 * Event mapping
 * ------------------------------------------------------------------ */

export type MapOddsOptions = {
  oddsFormat?: OddsFormat;
  now?: Date;
  /** Extra fields the UI needs that the odds payload does not carry. */
  score?: { home: number; away: number };
};

function pickSide(outcomes: BestOutcome[], home: string, away: string) {
  const norm = (s: string) => s.trim().toLowerCase();
  const h = outcomes.find((o) => norm(o.name) === norm(home));
  const a = outcomes.find((o) => norm(o.name) === norm(away));
  const draw = outcomes.find((o) => norm(o.name) === "draw");
  return { home: h, away: a, draw };
}

function sideMarket(outcomes: BestOutcome[], home: string, away: string) {
  const { home: h, away: a } = pickSide(outcomes, home, away);
  if (!h || !a) return undefined;
  return { line: h.point ?? a.point ?? 0, home: h.price, away: a.price };
}

/**
 * One `/odds` event → one `SportEvent`. Returns null when the event cannot fill
 * the minimum the UI renders (a fixture + a moneyline), so a partial vendor
 * payload degrades to "not listed" instead of a broken card.
 */
export function mapOddsEvent(raw: ApiOddsEvent, opts: MapOddsOptions = {}): SportEvent | null {
  const format = opts.oddsFormat ?? "decimal";
  const now = opts.now ?? new Date();
  const home = String(raw.home_team ?? "").trim();
  const away = String(raw.away_team ?? "").trim();
  const id = String(raw.id ?? "").trim();
  const sport = sportKindFor(raw.sport_key);
  // Tennis/MMA/outrights have no home/away split in the same sense; the vendor
  // still fills home_team/away_team with the two participants, so require both.
  if (!id || !sport || !home || !away || home === away) return null;
  if (isOutrightSport(raw.sport_key)) return null;

  const h2h = bestPrices(raw.bookmakers, "h2h", format);
  const sides = pickSide(h2h, home, away);
  if (!sides.home || !sides.away) return null;

  const threeWay = Boolean(sides.draw);
  const ml = threeWay
    ? ([sides.home.price, sides.draw!.price, sides.away.price] as [number, number, number])
    : ([sides.home.price, sides.away.price] as [number, number]);

  const spread = sideMarket(bestPrices(raw.bookmakers, "spreads", format), home, away);
  const totals = bestPrices(raw.bookmakers, "totals", format);
  const over = totals.find((o) => o.name.toLowerCase() === "over");
  const under = totals.find((o) => o.name.toLowerCase() === "under");
  const total =
    over && under
      ? { line: over.point ?? under.point ?? 0, over: over.price, under: under.price }
      : undefined;

  const live = isInPlay(String(raw.commence_time ?? ""), now);
  const meta = SPORT_META[sport];
  const league = String(raw.sport_title ?? "").trim() || meta.label;

  return {
    id,
    sport,
    league,
    home,
    away,
    homeAbbr: abbrFor(home),
    awayAbbr: abbrFor(away),
    start: formatStart(String(raw.commence_time ?? ""), now),
    live,
    minute: live ? elapsedMinute(String(raw.commence_time ?? ""), now) : undefined,
    score: opts.score ? [opts.score.home, opts.score.away] : undefined,
    cover: meta.cover,
    markets: {
      ml,
      ...(spread ? { spread } : {}),
      ...(total ? { total } : {}),
    },
  };
}

/** Map a whole `/odds` payload, dropping anything unrenderable. */
export function mapOddsList(rows: unknown, opts: MapOddsOptions = {}): SportEvent[] {
  if (!Array.isArray(rows)) return [];
  const out: SportEvent[] = [];
  for (const row of rows) {
    const mapped = mapOddsEvent((row ?? {}) as ApiOddsEvent, opts);
    if (mapped) out.push(mapped);
  }
  return out;
}

/* ------------------------------------------------------------------ *
 * Scores
 * ------------------------------------------------------------------ */

export type MappedScore = {
  id: string;
  home: number | null;
  away: number | null;
  completed: boolean;
  live: boolean;
  lastUpdate: string | null;
};

/** `/scores` event → scores keyed to our home/away ordering. */
export function mapScoreEvent(
  raw: ApiScoreEvent,
  now: Date = new Date(),
): MappedScore | null {
  const id = String(raw.id ?? "").trim();
  const home = String(raw.home_team ?? "").trim();
  const away = String(raw.away_team ?? "").trim();
  if (!id || !home || !away) return null;
  const rows = raw.scores ?? [];
  const find = (name: string) => {
    const hit = rows.find((s) => String(s.name ?? "").trim().toLowerCase() === name.toLowerCase());
    const n = Number(hit?.score);
    return hit && Number.isFinite(n) ? n : null;
  };
  const completed = Boolean(raw.completed);
  return {
    id,
    home: find(home),
    away: find(away),
    completed,
    live: !completed && isInPlay(String(raw.commence_time ?? ""), now),
    lastUpdate: raw.last_update ?? null,
  };
}

/** Index a `/scores` payload by event id for O(1) merge into the odds feed. */
export function scoreIndex(rows: unknown, now: Date = new Date()): Map<string, MappedScore> {
  const out = new Map<string, MappedScore>();
  if (!Array.isArray(rows)) return out;
  for (const row of rows) {
    const mapped = mapScoreEvent((row ?? {}) as ApiScoreEvent, now);
    if (mapped) out.set(mapped.id, mapped);
  }
  return out;
}

/** Overlay live/finished scores onto a mapped odds event (mutates nothing). */
export function withScore(ev: SportEvent, score: MappedScore | undefined): SportEvent {
  if (!score || score.home == null || score.away == null) return ev;
  return {
    ...ev,
    score: [score.home, score.away],
    live: score.live ? true : ev.live,
    minute: score.completed ? "FT" : ev.minute,
  };
}

/* ------------------------------------------------------------------ *
 * Query building
 * ------------------------------------------------------------------ */

export type OddsQuery = {
  sport: string;
  regions: string;
  markets: string;
  oddsFormat?: OddsFormat;
  dateFormat?: "iso" | "unix";
  eventIds?: string;
  commenceTimeFrom?: string;
  commenceTimeTo?: string;
};

/** Whitelists every list-valued parameter, then serializes. */
export function sanitizeList(value: string, allowed: readonly string[]): string[] {
  return String(value ?? "")
    .split(",")
    .map((v) => v.trim().toLowerCase())
    .filter((v) => (allowed as readonly string[]).includes(v));
}

/** `upcoming` is always valid and is the cheapest way to fill a mixed board. */
export function isValidSportParam(sport: string): boolean {
  return /^[a-z0-9_]{2,64}$/.test(String(sport ?? "").toLowerCase());
}

/**
 * Build the query string for an /odds call. Unknown regions/markets are
 * dropped rather than forwarded, so a typo in env cannot produce a 4xx or
 * smuggle extra parameters.
 */
export function buildOddsQuery(q: OddsQuery): string {
  const params = new URLSearchParams();
  const regions = sanitizeList(q.regions, ODDS_API_REGIONS);
  const markets = sanitizeList(q.markets, ODDS_API_FEATURED_MARKETS);
  params.set("regions", regions.length ? regions.join(",") : "eu");
  params.set("markets", markets.length ? markets.join(",") : "h2h");
  params.set("oddsFormat", q.oddsFormat === "american" ? "american" : "decimal");
  params.set("dateFormat", q.dateFormat === "unix" ? "unix" : "iso");
  if (q.eventIds) params.set("eventIds", sanitizeEventIds(q.eventIds));
  if (q.commenceTimeFrom && isIso8601(q.commenceTimeFrom)) params.set("commenceTimeFrom", q.commenceTimeFrom);
  if (q.commenceTimeTo && isIso8601(q.commenceTimeTo)) params.set("commenceTimeTo", q.commenceTimeTo);
  return params.toString();
}

export function isIso8601(value: string): boolean {
  return /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?Z$/.test(String(value ?? ""));
}

/** Comma-separated 32-hex event ids only. */
export function sanitizeEventIds(value: string): string {
  return String(value ?? "")
    .split(",")
    .map((v) => v.trim().toLowerCase())
    .filter((v) => /^[0-9a-f]{16,64}$/.test(v))
    .join(",");
}

/** Cost of the query this helper would produce, before spending a credit. */
export function queryCost(q: OddsQuery): number {
  const regions = sanitizeList(q.regions, ODDS_API_REGIONS).length || 1;
  const markets = sanitizeList(q.markets, ODDS_API_FEATURED_MARKETS).length || 1;
  return oddsCost(markets, regions);
}

/* ------------------------------------------------------------------ *
 * Outcome resolution (settlement of bets placed on a live feed event)
 * ------------------------------------------------------------------ */

/**
 * Rebuild the sellable outcomes for a mapped event, reusing the same
 * `outcomeId` scheme as the curated book so a bet placed from either source
 * resolves identically.
 */
export function outcomesForEvent(ev: SportEvent): Outcome[] {
  const out: Outcome[] = [];
  const three = ev.markets.ml.length === 3;
  const push = (market: MarketKind, marketLabel: string, selection: string, label: string, odds: number, line?: number) => {
    out.push({ id: outcomeId(ev.id, market, selection), eventId: ev.id, market, marketLabel, selection, label, odds, ...(line != null ? { line } : {}) });
  };
  if (three) {
    push("ml", "1X2", "home", ev.homeAbbr, ev.markets.ml[0]!);
    push("ml", "1X2", "draw", "Draw", ev.markets.ml[1]!);
    push("ml", "1X2", "away", ev.awayAbbr, ev.markets.ml[2]!);
  } else {
    push("ml", "Winner", "home", ev.homeAbbr, ev.markets.ml[0]!);
    push("ml", "Winner", "away", ev.awayAbbr, ev.markets.ml[1]!);
  }
  if (ev.markets.spread) {
    const s = ev.markets.spread;
    push("spread", "Spread", "home", `${ev.homeAbbr} ${s.line}`, s.home, s.line);
    push("spread", "Spread", "away", `${ev.awayAbbr} ${-s.line}`, s.away, -s.line);
  }
  if (ev.markets.total) {
    const t = ev.markets.total;
    push("total", "Total", "over", `Over ${t.line}`, t.over, t.line);
    push("total", "Total", "under", `Under ${t.line}`, t.under, t.line);
  }
  return out;
}

/**
 * Feed events are merged with the curated book, so two sources can list the
 * same fixture. Dedupe on the normalized fixture, preferring the live feed.
 */
export function mergeEvents(primary: SportEvent[], fallback: SportEvent[]): SportEvent[] {
  const seen = new Set<string>();
  const out: SportEvent[] = [];
  for (const ev of [...primary, ...fallback]) {
    const key = `${ev.sport}|${ev.home.trim().toLowerCase()}|${ev.away.trim().toLowerCase()}`;
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(ev);
  }
  return out;
}
