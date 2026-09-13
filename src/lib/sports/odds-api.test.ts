/**
 * Tests for the real mapping module (`./odds-api.ts`) — the exact code the
 * server ships. Fixtures are the vendor's own documented example payloads, so
 * a schema change on their side shows up here first.
 *
 * Pure module ⇒ loadable under plain `node --experimental-strip-types`.
 */
import assert from "node:assert/strict";
import test from "node:test";
import {
  abbrFor,
  americanToDecimal,
  bestPrices,
  buildOddsQuery,
  elapsedMinute,
  formatStart,
  historicalOddsCost,
  isInPlay,
  isOutrightSport,
  mapOddsEvent,
  mapOddsList,
  mapScoreEvent,
  mergeEvents,
  oddsCost,
  outcomesForEvent,
  parseQuotaHeaders,
  queryCost,
  sanitizeEventIds,
  sanitizeList,
  scoreIndex,
  scoresCost,
  sportKindFor,
  toDecimalPrice,
  withScore,
  type ApiOddsEvent,
} from "./odds-api.ts";
import type { SportEvent } from "../sports-book.ts";

/* ---------------------------------------------------------------- *
 * Vendor fixtures (verbatim shapes from the v4 docs)
 * ---------------------------------------------------------------- */

/** `/v4/sports/americanfootball_nfl/odds?regions=us&markets=h2h,spreads&oddsFormat=american` */
const NFL_EVENT: ApiOddsEvent = {
  id: "bda33adca828c09dc3cac3a856aef176",
  sport_key: "americanfootball_nfl",
  sport_title: "NFL",
  commence_time: "2021-09-10T00:20:00Z",
  home_team: "Tampa Bay Buccaneers",
  away_team: "Dallas Cowboys",
  bookmakers: [
    {
      key: "caesars",
      title: "Caesars",
      markets: [
        { key: "h2h", outcomes: [{ name: "Dallas Cowboys", price: 240 }, { name: "Tampa Bay Buccaneers", price: -278 }] },
        {
          key: "spreads",
          outcomes: [
            { name: "Dallas Cowboys", price: -110, point: 6.5 },
            { name: "Tampa Bay Buccaneers", price: -110, point: -6.5 },
          ],
        },
      ],
    },
    {
      key: "fanduel",
      title: "FanDuel",
      markets: [
        { key: "h2h", outcomes: [{ name: "Dallas Cowboys", price: 225 }, { name: "Tampa Bay Buccaneers", price: -275 }] },
        {
          key: "spreads",
          outcomes: [
            { name: "Dallas Cowboys", price: -110, point: 6.5 },
            { name: "Tampa Bay Buccaneers", price: -110, point: -6.5 },
          ],
        },
      ],
    },
  ],
};

/** Soccer: three-way moneyline, decimal odds, totals market. */
const SOCCER_EVENT: ApiOddsEvent = {
  id: "037d7b6bb128546961e2a06680f63944",
  sport_key: "soccer_epl",
  sport_title: "EPL",
  commence_time: "2026-09-20T15:00:00Z",
  home_team: "Arsenal",
  away_team: "Liverpool",
  bookmakers: [
    {
      key: "betfair",
      title: "Betfair",
      markets: [
        { key: "h2h_lay", outcomes: [{ name: "Arsenal", price: 2.2 }, { name: "Liverpool", price: 1.9 }] },
        { key: "h2h", outcomes: [{ name: "Arsenal", price: 2.1 }, { name: "Draw", price: 3.5 }, { name: "Liverpool", price: 1.78 }] },
        { key: "totals", outcomes: [{ name: "Over", price: 1.91, point: 2.5 }, { name: "Under", price: 1.89, point: 2.5 }] },
      ],
    },
    {
      key: "unibet",
      title: "Unibet",
      markets: [
        { key: "h2h", outcomes: [{ name: "Arsenal", price: 2.2 }, { name: "Draw", price: 3.4 }, { name: "Liverpool", price: 1.75 }] },
        { key: "totals", outcomes: [{ name: "Over", price: 1.95, point: 2.5 }, { name: "Under", price: 1.85, point: 2.5 }] },
      ],
    },
  ],
};

/* ---------------------------------------------------------------- *
 * Odds formats
 * ---------------------------------------------------------------- */

test("americanToDecimal converts both signs (documented examples)", () => {
  assert.equal(americanToDecimal(240), 3.4);
  assert.equal(americanToDecimal(-303), 1.33);
  assert.equal(americanToDecimal(-110), 1.91);
  assert.equal(americanToDecimal(100), 2);
});

test("americanToDecimal is safe on junk", () => {
  assert.equal(americanToDecimal(0), 0);
  assert.equal(americanToDecimal(Number.NaN), 0);
});

test("toDecimalPrice only converts when the call asked for american", () => {
  assert.equal(toDecimalPrice(2.15, "decimal"), 2.15);
  assert.equal(toDecimalPrice(240, "american"), 3.4);
});

/* ---------------------------------------------------------------- *
 * Quota
 * ---------------------------------------------------------------- */

test("quota cost is markets x regions (documented formula)", () => {
  assert.equal(oddsCost(1, 1), 1);
  assert.equal(oddsCost(3, 1), 3);
  assert.equal(oddsCost(1, 3), 3);
  assert.equal(oddsCost(3, 3), 9);
});

test("historical snapshots cost 10x, scores cost 1 or 2", () => {
  assert.equal(historicalOddsCost(1, 1), 10);
  assert.equal(historicalOddsCost(3, 3), 90);
  assert.equal(scoresCost(), 1);
  assert.equal(scoresCost(3), 2);
});

test("quota headers parse case-insensitively and tolerate absence", () => {
  const q = parseQuotaHeaders({ "X-Requests-Remaining": "499", "x-requests-used": "1", "X-REQUESTS-LAST": "1" });
  assert.deepEqual(q, { remaining: 499, used: 1, last: 1 });
  assert.deepEqual(parseQuotaHeaders({}), { remaining: null, used: null, last: null });
});

test("queryCost predicts the bill before the call is made", () => {
  assert.equal(queryCost({ sport: "upcoming", regions: "eu", markets: "h2h" }), 1);
  assert.equal(queryCost({ sport: "upcoming", regions: "us,uk", markets: "h2h,spreads,totals" }), 6);
  // Unknown values fall back to the single-region/single-market defaults.
  assert.equal(queryCost({ sport: "upcoming", regions: "mars", markets: "telepathy" }), 1);
});

/* ---------------------------------------------------------------- *
 * Sport mapping
 * ---------------------------------------------------------------- */

test("sport_key maps onto the five UI buckets", () => {
  assert.equal(sportKindFor("soccer_epl"), "football");
  assert.equal(sportKindFor("americanfootball_nfl"), "football");
  assert.equal(sportKindFor("basketball_nba"), "basketball");
  assert.equal(sportKindFor("tennis_atp_french_open"), "tennis");
  assert.equal(sportKindFor("mma_mixed_martial_arts"), "mma");
  assert.equal(sportKindFor("esports_cs_go"), "esports");
  assert.equal(sportKindFor("icehockey_nhl"), "football");
});

test("unmapped and empty sport keys are dropped, not guessed", () => {
  assert.equal(sportKindFor("golf_masters_tournament_winner"), null);
  assert.equal(sportKindFor(""), null);
  assert.equal(sportKindFor(undefined), null);
});

test("outright/futures keys are recognised so they can be skipped", () => {
  assert.equal(isOutrightSport("americanfootball_nfl_super_bowl_winner"), true);
  assert.equal(isOutrightSport("soccer_epl"), false);
});

/* ---------------------------------------------------------------- *
 * Display helpers
 * ---------------------------------------------------------------- */

test("abbrFor is three letters, stable and collision-tolerant", () => {
  assert.equal(abbrFor("Manchester City"), "MCI");
  assert.equal(abbrFor("Arsenal"), "ARS");
  assert.equal(abbrFor("Tampa Bay Buccaneers"), "TBB");
  assert.equal(abbrFor(""), "TBD");
  assert.equal(abbrFor("Real Madrid (B)"), abbrFor("Real Madrid"), "parentheticals are stripped");
});

test("formatStart labels today, tomorrow and later fixtures", () => {
  const now = new Date(2026, 8, 13, 12, 0, 0);
  assert.equal(formatStart(new Date(2026, 8, 13, 20, 0, 0).toISOString(), now), "Today 20:00");
  assert.equal(formatStart(new Date(2026, 8, 14, 16, 30, 0).toISOString(), now), "Tomorrow 16:30");
  assert.equal(formatStart(new Date(2026, 8, 19, 21, 0, 0).toISOString(), now), "Sat 21:00");
  assert.equal(formatStart(new Date(2026, 11, 24, 21, 0, 0).toISOString(), now), "Thu 24 Dec 21:00");
  assert.equal(formatStart("not-a-date", now), "TBA");
});

test("a fixture already underway is in-play, with an elapsed clock", () => {
  const now = new Date(2026, 8, 13, 12, 0, 0);
  const kickoff = new Date(2026, 8, 13, 10, 53, 0).toISOString();
  assert.equal(isInPlay(kickoff, now), true);
  assert.equal(isInPlay(new Date(2026, 8, 13, 20, 0, 0).toISOString(), now), false);
  assert.equal(elapsedMinute(kickoff, now), "67'");
  assert.equal(elapsedMinute(new Date(2026, 8, 13, 20, 0, 0).toISOString(), now), undefined);
});

/* ---------------------------------------------------------------- *
 * Best price
 * ---------------------------------------------------------------- */

test("bestPrices keeps the highest decimal price per outcome", () => {
  const h2h = bestPrices(SOCCER_EVENT.bookmakers, "h2h", "decimal");
  const byName = Object.fromEntries(h2h.map((o) => [o.name, o.price]));
  assert.equal(byName.Arsenal, 2.2, "Unibet beats Betfair on the home win");
  assert.equal(byName.Draw, 3.5);
  assert.equal(byName.Liverpool, 1.78);
});

test("bestPrices ignores other market keys (including exchange lay odds)", () => {
  const lay = bestPrices(SOCCER_EVENT.bookmakers, "h2h_lay", "decimal");
  assert.equal(lay.length, 2);
  const h2h = bestPrices(SOCCER_EVENT.bookmakers, "h2h", "decimal");
  assert.ok(!h2h.some((o) => o.price === 2.2 && o.name === "Arsenal" && o.bookmaker === "Betfair"));
});

test("bestPrices converts american payloads and drops non-prices", () => {
  const h2h = bestPrices(NFL_EVENT.bookmakers, "h2h", "american");
  const cowboys = h2h.find((o) => o.name === "Dallas Cowboys");
  assert.equal(cowboys?.price, 3.4, "+240 beats +225");
  assert.equal(bestPrices(undefined, "h2h").length, 0);
  assert.equal(bestPrices([{ markets: [{ key: "h2h", outcomes: [{ name: "X", price: 1 }] }] }], "h2h").length, 0);
});

/* ---------------------------------------------------------------- *
 * Event mapping
 * ---------------------------------------------------------------- */

test("american NFL payload maps to a two-way board with spread", () => {
  const ev = mapOddsEvent(NFL_EVENT, { oddsFormat: "american", now: new Date("2021-09-01T00:00:00Z") });
  assert.ok(ev);
  assert.equal(ev.id, "bda33adca828c09dc3cac3a856aef176");
  assert.equal(ev.sport, "football");
  assert.equal(ev.league, "NFL");
  assert.equal(ev.home, "Tampa Bay Buccaneers");
  assert.equal(ev.away, "Dallas Cowboys");
  assert.deepEqual(ev.markets.ml, [1.36, 3.4], "home first (Tampa -278), away second (Dallas +240)");
  assert.deepEqual(ev.markets.spread, { line: -6.5, home: 1.91, away: 1.91 });
  assert.equal(ev.markets.total, undefined, "no totals market in the payload");
  assert.equal(ev.live, false);
  assert.equal(ev.cover, "/brand/sports/football.jpg");
});

test("soccer payload maps to a three-way board with best totals", () => {
  const ev = mapOddsEvent(SOCCER_EVENT, { oddsFormat: "decimal" });
  assert.ok(ev);
  assert.equal(ev.sport, "football");
  assert.equal(ev.homeAbbr, "ARS");
  assert.equal(ev.awayAbbr, "LIV");
  assert.deepEqual(ev.markets.ml, [2.2, 3.5, 1.78], "[home, draw, away]");
  assert.deepEqual(ev.markets.total, { line: 2.5, over: 1.95, under: 1.89 });
});

test("a mapped event renders through the same outcome ids as the curated book", () => {
  const ev = mapOddsEvent(SOCCER_EVENT, { oddsFormat: "decimal" })!;
  const outcomes = outcomesForEvent(ev);
  const ids = outcomes.map((o) => o.id);
  assert.deepEqual(
    ids,
    [
      `${ev.id}:ml:home`,
      `${ev.id}:ml:draw`,
      `${ev.id}:ml:away`,
      `${ev.id}:total:over`,
      `${ev.id}:total:under`,
    ],
    "no spread in this payload, so no spread outcomes",
  );
  assert.equal(outcomes.find((o) => o.selection === "draw")?.odds, 3.5);
});

test("unrenderable payloads map to null instead of a broken card", () => {
  assert.equal(mapOddsEvent({ ...SOCCER_EVENT, bookmakers: [] }), null, "no moneyline");
  assert.equal(mapOddsEvent({ ...SOCCER_EVENT, away_team: "Arsenal" }), null, "home == away");
  assert.equal(mapOddsEvent({ ...SOCCER_EVENT, id: "" }), null, "no id");
  assert.equal(mapOddsEvent({ ...SOCCER_EVENT, sport_key: "golf_masters_winner" }), null, "unmapped sport");
  assert.equal(
    mapOddsEvent({ ...SOCCER_EVENT, sport_key: "soccer_epl_winner" }),
    null,
    "outrights are not fixtures",
  );
  assert.equal(mapOddsEvent({ ...SOCCER_EVENT, home_team: "  " }), null, "blank team");
});

test("mapOddsList drops junk rows and keeps the good ones", () => {
  const rows = [SOCCER_EVENT, null, {}, { ...NFL_EVENT, bookmakers: [] }, "nope"];
  const out = mapOddsList(rows, { oddsFormat: "decimal" });
  assert.equal(out.length, 1);
  assert.equal(out[0]!.id, SOCCER_EVENT.id);
  assert.equal(mapOddsList("not-an-array").length, 0);
});

test("an in-play event carries live + elapsed minute", () => {
  const kickoff = new Date(Date.now() - 67 * 60_000).toISOString();
  const ev = mapOddsEvent({ ...SOCCER_EVENT, commence_time: kickoff }, { oddsFormat: "decimal" });
  assert.equal(ev?.live, true);
  assert.equal(ev?.minute, "67'");
  assert.equal(ev?.start, "Live");
});

/* ---------------------------------------------------------------- *
 * Scores
 * ---------------------------------------------------------------- */

const SCORE_EVENT = {
  id: "572d984e132eddaac3da93e5db332e7e",
  sport_key: "basketball_nba",
  sport_title: "NBA",
  commence_time: "2022-02-06T03:10:38Z",
  completed: true,
  home_team: "Sacramento Kings",
  away_team: "Oklahoma City Thunder",
  scores: [
    { name: "Sacramento Kings", score: "113" },
    { name: "Oklahoma City Thunder", score: "103" },
  ],
  last_update: "2022-02-06T05:18:19Z",
};

test("scores map onto [home, away] regardless of payload order", () => {
  const s = mapScoreEvent(SCORE_EVENT);
  assert.deepEqual({ ...s, lastUpdate: null }, {
    id: SCORE_EVENT.id,
    home: 113,
    away: 103,
    completed: true,
    live: false,
    lastUpdate: null,
  });
  const reversed = mapScoreEvent({ ...SCORE_EVENT, scores: [...SCORE_EVENT.scores].reverse() });
  assert.equal(reversed?.home, 113);
});

test("scores without a score row stay null (upcoming games)", () => {
  const s = mapScoreEvent({ ...SCORE_EVENT, scores: null, completed: false, commence_time: new Date(Date.now() + 3_600_000).toISOString() });
  assert.deepEqual([s?.home, s?.away, s?.completed, s?.live], [null, null, false, false]);
});

test("scoreIndex + withScore overlay a live score onto a listed event", () => {
  const idx = scoreIndex([SCORE_EVENT, null, {}]);
  assert.equal(idx.size, 1);
  const base: SportEvent = {
    id: SCORE_EVENT.id,
    sport: "basketball",
    league: "NBA",
    home: "Sacramento Kings",
    away: "Oklahoma City Thunder",
    homeAbbr: "SAC",
    awayAbbr: "OKC",
    start: "Today 20:00",
    live: true,
    minute: "67'",
    cover: "/brand/sports/basketball.jpg",
    markets: { ml: [1.9, 1.9] },
  };
  const merged = withScore(base, idx.get(SCORE_EVENT.id));
  assert.deepEqual(merged.score, [113, 103]);
  assert.equal(merged.minute, "FT", "a completed game stops the clock");
  assert.equal(withScore(base, undefined), base, "no score is a no-op");
});

/* ---------------------------------------------------------------- *
 * Query building
 * ---------------------------------------------------------------- */

test("buildOddsQuery whitelists regions and markets", () => {
  const q = buildOddsQuery({ sport: "upcoming", regions: "eu,xx", markets: "h2h,bogus" });
  assert.equal(q, "regions=eu&markets=h2h&oddsFormat=decimal&dateFormat=iso");
});

test("buildOddsQuery keeps valid multi-values and drops injection attempts", () => {
  const q = buildOddsQuery({
    sport: "basketball_nba",
    regions: "US, uk ,eu",
    markets: "h2h,spreads,totals",
    oddsFormat: "american",
    eventIds: "bda33adca828c09dc3cac3a856aef176, ../../etc/passwd, zz",
    commenceTimeFrom: "2023-09-09T00:00:00Z",
    commenceTimeTo: "nope",
  });
  const params = new URLSearchParams(q);
  assert.equal(params.get("regions"), "us,uk,eu");
  assert.equal(params.get("markets"), "h2h,spreads,totals");
  assert.equal(params.get("oddsFormat"), "american");
  assert.equal(params.get("eventIds"), "bda33adca828c09dc3cac3a856aef176");
  assert.equal(params.get("commenceTimeFrom"), "2023-09-09T00:00:00Z");
  assert.equal(params.get("commenceTimeTo"), null, "malformed timestamp dropped");
  assert.ok(!q.includes("apiKey"), "the key is added by the server layer only");
});

test("sanitize helpers reject anything off-list", () => {
  assert.deepEqual(sanitizeList("eu,ZZ", ["us", "eu"]), ["eu"]);
  assert.equal(sanitizeEventIds("abc, 037d7b6bb128546961e2a06680f63944"), "037d7b6bb128546961e2a06680f63944");
});

/* ---------------------------------------------------------------- *
 * Merge
 * ---------------------------------------------------------------- */

test("mergeEvents prefers the live feed and dedupes by fixture", () => {
  const live = mapOddsEvent({ ...SOCCER_EVENT, home_team: "Arsenal", away_team: "Liverpool" }, { oddsFormat: "decimal" })!;
  const curated: SportEvent = {
    id: "epl-1",
    sport: "football",
    league: "Premier League",
    home: "Arsenal",
    away: "Liverpool",
    homeAbbr: "ARS",
    awayAbbr: "LIV",
    start: "Sun 16:00",
    cover: "/brand/sports/football.jpg",
    markets: { ml: [2.1, 3.5, 1.78] },
  };
  const merged = mergeEvents([live], [curated, curated]);
  assert.equal(merged.length, 1);
  assert.equal(merged[0]!.id, live.id, "the live feed wins");
  assert.equal(mergeEvents([], [curated, curated]).length, 1);
});
