/**
 * The Odds API v4 client (server-only).
 *
 * Owns everything that touches env or the network; the mapping lives in the
 * pure sibling `./odds-api.ts`. Two rules this file enforces, because the
 * vendor bills per call:
 *
 *   1. **Never call the vendor per request.** Every feed is memoized on
 *      `globalThis` with a TTL (default 5 min) and an in-flight promise, so a
 *      burst of page loads costs one credit, not one per visitor.
 *   2. **Never bill on a misconfiguration.** Without `THE_ODDS_API_KEY` the
 *      client reports `configured:false` and callers fall back to the curated
 *      book instead of hammering a 401.
 *
 * Quota is surfaced (never the key) through `oddsApiStatus()` and
 * `GET /api/operator/status`.
 */
import { env } from "@/lib/env.server";
import { SPORT_EVENTS, type Outcome, type SportEvent } from "@/lib/sports-book";
import {
  ODDS_API_HOST,
  ODDS_API_PATH_PREFIX,
  buildOddsQuery,
  mapOddsList,
  mergeEvents,
  outcomesForEvent,
  parseQuotaHeaders,
  queryCost,
  scoreIndex,
  sportKindFor,
  withScore,
  type MappedScore,
  type OddsApiQuota,
  type OddsFormat,
} from "./odds-api";

export type OddsFeed = {
  events: SportEvent[];
  source: "odds-api" | "tols";
  quota: OddsApiQuota;
  error: string | null;
  fetchedAt: string | null;
  sport: string;
  regions: string;
  markets: string;
};

type Cache<T> = { at: number; value: T };

const store = globalThis as typeof globalThis & {
  __oddsApiCache__?: Record<string, Cache<unknown>>;
  __oddsApiInflight__?: Record<string, Promise<unknown>>;
  __oddsApiUsage__?: {
    calls: number;
    billed: number;
    remaining: number | null;
    lastError: string | null;
    cooldownUntil: number;
  };
};

function cache(): Record<string, Cache<unknown>> {
  store.__oddsApiCache__ ??= {};
  return store.__oddsApiCache__!;
}

function usage() {
  store.__oddsApiUsage__ ??= { calls: 0, billed: 0, remaining: null, lastError: null, cooldownUntil: 0 };
  return store.__oddsApiUsage__!;
}

/* ------------------------------------------------------------------ *
 * Config
 * ------------------------------------------------------------------ */

function list(key: string, fallback: string): string {
  const raw = env(key) ?? fallback;
  return raw.trim();
}

function intEnv(key: string, fallback: number, min: number, max: number): number {
  const n = Number(env(key));
  if (!Number.isFinite(n) || n <= 0) return fallback;
  return Math.min(max, Math.max(min, Math.round(n)));
}

export function oddsApiConfig() {
  const base = (env("THE_ODDS_API_BASE") ?? ODDS_API_HOST).trim().replace(/\/+$/, "");
  const root = base.endsWith(ODDS_API_PATH_PREFIX) ? base.slice(0, -ODDS_API_PATH_PREFIX.length) : base;
  return {
    key: env("THE_ODDS_API_KEY") ?? "",
    /** Host without the `/v4` prefix — callers add the versioned path. */
    base: root || ODDS_API_HOST,
    sport: (env("THE_ODDS_API_SPORT") ?? "upcoming").trim().toLowerCase() || "upcoming",
    regions: list("THE_ODDS_API_REGIONS", "eu"),
    markets: list("THE_ODDS_API_MARKETS", "h2h"),
    oddsFormat: ((env("THE_ODDS_API_ODDS_FORMAT") ?? "decimal").trim() === "american"
      ? "american"
      : "decimal") as OddsFormat,
    ttlMs: intEnv("THE_ODDS_API_TTL_MS", 300_000, 30_000, 3_600_000),
    sportsTtlMs: intEnv("THE_ODDS_API_SPORTS_TTL_MS", 3_600_000, 300_000, 86_400_000),
    scoresTtlMs: intEnv("THE_ODDS_API_SCORES_TTL_MS", 60_000, 15_000, 900_000),
    maxEvents: intEnv("THE_ODDS_API_MAX_EVENTS", 40, 1, 200),
    /** `/scores` costs 1 credit per call — opt-in, merged into the odds feed. */
    scores: (env("THE_ODDS_API_SCORES") ?? "false").trim().toLowerCase() === "true",
    timeoutMs: intEnv("THE_ODDS_API_TIMEOUT_MS", 10_000, 2_000, 30_000),
    /** After a 429 the feed stops calling the vendor for this long. */
    cooldownMs: intEnv("THE_ODDS_API_COOLDOWN_MS", 60_000, 5_000, 600_000),
  };
}

export type OddsApiConfig = ReturnType<typeof oddsApiConfig>;

/** True when the connector can bill a call. */
export function oddsApiConfigured(): boolean {
  return Boolean(oddsApiConfig().key);
}

/* ------------------------------------------------------------------ *
 * Fetch
 * ------------------------------------------------------------------ */

export type OddsApiResult<T> = {
  ok: boolean;
  status: number;
  data: T | null;
  quota: OddsApiQuota;
  error: string | null;
};

async function getJson<T>(path: string, query: string): Promise<OddsApiResult<T>> {
  const cfg = oddsApiConfig();
  if (!cfg.key) return { ok: false, status: 0, data: null, quota: { remaining: null, used: null, last: null }, error: "THE_ODDS_API_KEY not set" };
  const params = new URLSearchParams(query);
  params.set("apiKey", cfg.key);
  const url = `${cfg.base}${ODDS_API_PATH_PREFIX}${path}?${params.toString()}`;
  usage().calls += 1;
  try {
    const res = await fetch(url, {
      headers: { accept: "application/json" },
      signal: AbortSignal.timeout(cfg.timeoutMs),
      cache: "no-store",
    });
    const quota = parseQuotaHeaders(Object.fromEntries(res.headers.entries()));
    if (quota.last && quota.last > 0) usage().billed += quota.last;
    if (quota.remaining != null) usage().remaining = quota.remaining;
    if (res.status === 429) {
      // Rate limited: stop calling for a while rather than burning the plan.
      usage().cooldownUntil = Date.now() + oddsApiConfig().cooldownMs;
      usage().lastError = "429 rate limited";
      return { ok: false, status: 429, data: null, quota, error: "rate_limited" };
    }
    if (!res.ok) {
      const text = await res.text().catch(() => "");
      usage().lastError = `${res.status}${text ? `: ${text.slice(0, 120)}` : ""}`;
      return { ok: false, status: res.status, data: null, quota, error: `odds_api_${res.status}` };
    }
    const data = (await res.json()) as T;
    usage().lastError = null;
    return { ok: true, status: res.status, data, quota, error: null };
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    usage().lastError = /abort|timeout/i.test(msg) ? "timeout" : msg.slice(0, 160);
    return { ok: false, status: 0, data: null, quota: { remaining: null, used: null, last: null }, error: "unreachable" };
  }
}

/** Read-through cache: one vendor call per TTL, however many callers ask. */
async function cached<T>(key: string, ttlMs: number, load: () => Promise<T>): Promise<T> {
  const hit = cache()[key] as Cache<T> | undefined;
  if (hit && Date.now() - hit.at < ttlMs) return hit.value;
  store.__oddsApiInflight__ ??= {};
  const inflight = store.__oddsApiInflight__![key] as Promise<T> | undefined;
  if (inflight) return inflight;
  const p = load()
    .then((value) => {
      cache()[key] = { at: Date.now(), value };
      return value;
    })
    .finally(() => {
      delete store.__oddsApiInflight__![key];
    });
  store.__oddsApiInflight__![key] = p;
  return p;
}

function stale<T>(key: string): T | undefined {
  return (cache()[key] as Cache<T> | undefined)?.value;
}

/* ------------------------------------------------------------------ *
 * Feeds
 * ------------------------------------------------------------------ */

/** Free endpoint: the in-season sport list (never billed). */
export async function listOddsSports(all = false) {
  if (!oddsApiConfigured()) return [];
  return cached("sports", oddsApiConfig().sportsTtlMs, async () => {
    const res = await getJson<unknown[]>("/sports", all ? "all=true" : "");
    return Array.isArray(res.data) ? res.data : [];
  });
}

function feedCacheKey(cfg: OddsApiConfig) {
  return `odds:${cfg.sport}:${cfg.regions}:${cfg.markets}:${cfg.oddsFormat}`;
}

/**
 * The board: one `/odds` call (default `upcoming` + `h2h` + 1 region = 1
 * credit), optionally overlaid with `/scores` for live scores.
 */
export async function getOddsFeed(force = false): Promise<OddsFeed> {
  const cfg = oddsApiConfig();
  const empty: OddsFeed = {
    events: [],
    source: "tols",
    quota: { remaining: null, used: null, last: null },
    error: null,
    fetchedAt: null,
    sport: cfg.sport,
    regions: cfg.regions,
    markets: cfg.markets,
  };
  if (!cfg.key) return empty;
  if (Date.now() < usage().cooldownUntil && !force) {
    const prev = stale<OddsFeed>(feedCacheKey(cfg));
    return prev ? { ...prev, error: "rate_limited_cooldown" } : { ...empty, error: "rate_limited_cooldown" };
  }

  const key = feedCacheKey(cfg);
  if (!force) {
    const hit = cache()[key] as Cache<OddsFeed> | undefined;
    if (hit && Date.now() - hit.at < cfg.ttlMs) return hit.value;
  }

  return cached(key, cfg.ttlMs, async () => {
    const query = buildOddsQuery({ sport: cfg.sport, regions: cfg.regions, markets: cfg.markets, oddsFormat: cfg.oddsFormat });
    const res = await getJson<unknown[]>(`/sports/${encodeURIComponent(cfg.sport)}/odds`, query);
    if (!res.ok || !Array.isArray(res.data)) {
      // Keep serving the last good board instead of an empty page.
      const prev = stale<OddsFeed>(key);
      if (prev) return { ...prev, error: res.error };
      return { ...empty, error: res.error, quota: res.quota };
    }

    const now = new Date();
    rememberSportKeys(res.data);
    let events = mapOddsList(res.data, { oddsFormat: cfg.oddsFormat, now }).slice(0, cfg.maxEvents);

    if (cfg.scores && events.length) {
      const scores = await collectScores(events, now);
      if (scores.size) events = events.map((ev) => withScore(ev, scores.get(ev.id)));
    }

    // Live first, then soonest kick-off — the board the UI renders top-down.
    events.sort((a, b) => Number(Boolean(b.live)) - Number(Boolean(a.live)));

    return {
      events,
      source: "odds-api" as const,
      quota: res.quota,
      error: null,
      fetchedAt: new Date().toISOString(),
      sport: cfg.sport,
      regions: cfg.regions,
      markets: cfg.markets,
    };
  });
}

/**
 * Scores are per sport key, so the distinct keys in the current board decide
 * the cost (`1` credit each, `2` with `daysFrom`). Bounded by the sports that
 * actually appear, and cached separately with a shorter TTL.
 */
async function collectScores(events: SportEvent[], now: Date) {
  const cfg = oddsApiConfig();
  const keys = [...new Set(events.map((e) => sportKeyOf(e)).filter((k): k is string => Boolean(k)))].slice(0, 4);
  const merged = new Map<string, MappedScore>();
  for (const sportKey of keys) {
    const rows = await cached(`scores:${sportKey}`, cfg.scoresTtlMs, async () => {
      const res = await getJson<unknown[]>(`/sports/${encodeURIComponent(sportKey)}/scores`, "");
      return Array.isArray(res.data) ? res.data : [];
    });
    for (const [id, score] of scoreIndex(rows, now)) merged.set(id, score);
  }
  return merged;
}

/**
 * The board loses `sport_key` in the mapping, so remember it per event id when
 * the feed is built. Falls back to nothing (scores are a best-effort overlay).
 */
const sportKeys = new Map<string, string>();
function sportKeyOf(ev: SportEvent): string | undefined {
  return sportKeys.get(ev.id);
}

/** Record `sport_key` → event id so `/scores` can be merged later. */
export function rememberSportKeys(rows: unknown) {
  if (!Array.isArray(rows)) return;
  for (const row of rows) {
    const r = row as { id?: string; sport_key?: string };
    const id = String(r.id ?? "").trim();
    const key = String(r.sport_key ?? "").trim();
    if (id && key && sportKindFor(key)) sportKeys.set(id, key);
  }
}

/** Live/completed scores for one sport key — exposed for settlement work. */
export async function getScores(sportKey: string, daysFrom?: number) {
  if (!oddsApiConfigured()) return [];
  const cfg = oddsApiConfig();
  const q = daysFrom && daysFrom > 0 ? `daysFrom=${Math.min(3, Math.max(1, Math.round(daysFrom)))}` : "";
  return cached(`scores:${sportKey}:${q || "live"}`, cfg.scoresTtlMs, async () => {
    const res = await getJson<unknown[]>(`/sports/${encodeURIComponent(sportKey)}/scores`, q);
    return Array.isArray(res.data) ? res.data : [];
  });
}

/* ------------------------------------------------------------------ *
 * Settlement helpers
 * ------------------------------------------------------------------ */

/** Look up a live-feed event by id (cache only — never bills). */
export function apiEventById(id: string): SportEvent | undefined {
  const cfg = oddsApiConfig();
  return stale<OddsFeed>(feedCacheKey(cfg))?.events.find((e) => e.id === id);
}

/**
 * Resolve a bet leg against the live feed when the curated book has no such
 * event. Returns undefined rather than guessing, so an unknown event stays
 * "Market closed" instead of settling at a made-up price.
 */
export function resolveApiOutcome(eventId: string, market: string, selection: string): Outcome | undefined {
  const ev = apiEventById(eventId);
  if (!ev) return undefined;
  return outcomesForEvent(ev).find((o) => o.market === market && o.selection === selection);
}

/* ------------------------------------------------------------------ *
 * Status
 * ------------------------------------------------------------------ */

/** Booleans and counters only — never the key, never a URL with the key in it. */
export function oddsApiStatus() {
  const cfg = oddsApiConfig();
  const u = usage();
  return {
    configured: Boolean(cfg.key),
    sport: cfg.sport,
    regions: cfg.regions,
    markets: cfg.markets,
    ttlMs: cfg.ttlMs,
    cooldownMs: cfg.cooldownMs,
    scores: cfg.scores,
    costPerRefresh: queryCost({ sport: cfg.sport, regions: cfg.regions, markets: cfg.markets }),
    calls: u.calls,
    billed: u.billed,
    remaining: u.remaining ?? null,
    lastError: u.lastError,
    coolingDown: Date.now() < u.cooldownUntil,
    eventsCached: (stale<OddsFeed>(feedCacheKey(cfg))?.events.length ?? 0) as number,
  };
}

/** Merged board for the UI: live feed first, curated book as the floor. */
export async function sportsBoard(): Promise<{ events: SportEvent[]; source: OddsFeed["source"]; quota: OddsApiQuota; error: string | null; fetchedAt: string | null }> {
  const feed = await getOddsFeed();
  const events = feed.source === "odds-api" && feed.events.length ? mergeEvents(feed.events, SPORT_EVENTS) : SPORT_EVENTS;
  return {
    events,
    source: feed.source === "odds-api" && feed.events.length ? "odds-api" : "tols",
    quota: feed.quota,
    error: feed.error,
    fetchedAt: feed.fetchedAt,
  };
}
