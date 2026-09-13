#!/usr/bin/env node
/**
 * The Odds API v4 self-test — runs the real routes against a fake vendor.
 *
 * Why this exists: the sandbox (and CI) has no outbound internet, so the only
 * honest way to prove the connector is to serve the vendor's documented
 * contract locally and drive the app's own HTTP surface against it. Every
 * assertion below goes through `/api/sportsbook/*`, i.e. the shipping code
 * path — not a re-implementation.
 *
 * Usage (dev server must be started with the fake as its upstream):
 *
 *   THE_ODDS_API_KEY=selftest_odds_key \
 *   THE_ODDS_API_BASE=http://127.0.0.1:8099 \
 *   THE_ODDS_API_SPORT=upcoming THE_ODDS_API_REGIONS=us \
 *   THE_ODDS_API_MARKETS=h2h,spreads,totals THE_ODDS_API_SCORES=true \
 *   npm run dev
 *
 *   BASE_URL=http://127.0.0.1:8080 npm run test:odds
 *
 * The fake binds 127.0.0.1 only. Safety: refuses non-localhost app targets
 * unless SELFTEST_ALLOW_REMOTE=1.
 */
import { createServer } from "node:http";

const BASE = (process.env.BASE_URL ?? "http://127.0.0.1:8080").replace(/\/$/, "");
const FAKE_PORT = Number(process.env.ODDS_FAKE_PORT ?? 8099);
const EXPECTED_KEY = process.env.THE_ODDS_API_KEY ?? "selftest_odds_key";

let failures = 0;
function check(name, cond, detail = "") {
  if (cond) console.log(`  ok - ${name}`);
  else {
    failures += 1;
    console.log(`  FAIL - ${name}${detail ? ` → ${detail}` : ""}`);
  }
}

try {
  const host = new URL(BASE).hostname.toLowerCase();
  const local = ["localhost", "127.0.0.1", "::1", ""].includes(host) || host.endsWith(".localhost");
  if (!local && process.env.SELFTEST_ALLOW_REMOTE !== "1") {
    console.error(`refusing non-localhost target ${BASE} without SELFTEST_ALLOW_REMOTE=1`);
    process.exit(2);
  }
} catch {
  console.error(`invalid BASE_URL ${BASE}`);
  process.exit(2);
}

/* ------------------------------------------------------------------ *
 * The fake vendor — payloads are the shapes from the v4 documentation.
 * ------------------------------------------------------------------ */

const NFL = {
  id: "bda33adca828c09dc3cac3a856aef176",
  sport_key: "americanfootball_nfl",
  sport_title: "NFL",
  commence_time: new Date(Date.now() + 3 * 3_600_000).toISOString(),
  home_team: "Tampa Bay Buccaneers",
  away_team: "Dallas Cowboys",
  bookmakers: [
    {
      key: "caesars",
      title: "Caesars",
      last_update: new Date().toISOString(),
      markets: [
        { key: "h2h", outcomes: [{ name: "Dallas Cowboys", price: 3.4 }, { name: "Tampa Bay Buccaneers", price: 1.36 }] },
        {
          key: "spreads",
          outcomes: [
            { name: "Dallas Cowboys", price: 1.91, point: 6.5 },
            { name: "Tampa Bay Buccaneers", price: 1.91, point: -6.5 },
          ],
        },
        {
          key: "totals",
          outcomes: [
            { name: "Over", price: 1.95, point: 44.5 },
            { name: "Under", price: 1.87, point: 44.5 },
          ],
        },
      ],
    },
    {
      key: "fanduel",
      title: "FanDuel",
      markets: [
        // Worse price on the Cowboys: proves the board takes the BEST, not the first.
        { key: "h2h", outcomes: [{ name: "Dallas Cowboys", price: 3.25 }, { name: "Tampa Bay Buccaneers", price: 1.36 }] },
      ],
    },
  ],
};

const SOCCER = {
  id: "037d7b6bb128546961e2a06680f63944",
  sport_key: "soccer_epl",
  sport_title: "EPL",
  commence_time: new Date(Date.now() - 20 * 60_000).toISOString(), // in-play
  home_team: "Arsenal",
  away_team: "Liverpool",
  bookmakers: [
    {
      key: "unibet",
      title: "Unibet",
      markets: [
        {
          key: "h2h",
          outcomes: [
            { name: "Arsenal", price: 2.2 },
            { name: "Draw", price: 3.4 },
            { name: "Liverpool", price: 1.75 },
          ],
        },
      ],
    },
  ],
};

const SPORTS = [
  { key: "americanfootball_nfl", group: "American Football", title: "NFL", description: "US Football", active: true, has_outrights: false },
  { key: "soccer_epl", group: "Soccer", title: "EPL", description: "English Premier League", active: true, has_outrights: false },
  { key: "basketball_nba", group: "Basketball", title: "NBA", description: "US Basketball", active: true, has_outrights: false },
  { key: "golf_masters_tournament_winner", group: "Golf", title: "Masters Winner", description: "", active: true, has_outrights: true },
];

const SCORES = [
  {
    id: "572d984e132eddaac3da93e5db332e7e",
    sport_key: "basketball_nba",
    sport_title: "NBA",
    commence_time: new Date(Date.now() - 2 * 3_600_000).toISOString(),
    completed: false,
    home_team: "Sacramento Kings",
    away_team: "Oklahoma City Thunder",
    scores: [
      { name: "Oklahoma City Thunder", score: "103" },
      { name: "Sacramento Kings", score: "113" },
    ],
    last_update: new Date().toISOString(),
  },
];

const state = { calls: 0, billed: 0, seen: [] };

/** decimal → american, the inverse of the client's `americanToDecimal`. */
function decToAmerican(dec) {
  return dec >= 2 ? Math.round((dec - 1) * 100) : -Math.round(100 / (dec - 1));
}

/**
 * The vendor returns prices in the format the caller asked for, so the fake
 * must too — otherwise the harness would be testing a contract that does not
 * exist. American conversion itself is unit-tested against the documented
 * values (+240 → 3.4, -303 → 1.33) in src/lib/sports/odds-api.test.ts.
 */
function inFormat(body, format) {
  if (format !== "american") return body;
  const walk = (node) => {
    if (Array.isArray(node)) return node.map(walk);
    if (node && typeof node === "object") {
      const out = {};
      for (const [k, v] of Object.entries(node)) {
        out[k] = k === "price" && typeof v === "number" ? decToAmerican(v) : walk(v);
      }
      return out;
    }
    return node;
  };
  return walk(body);
}

function send(res, status, body, quota) {
  const payload = JSON.stringify(body);
  res.writeHead(status, {
    "content-type": "application/json",
    "x-requests-remaining": String(500 - state.billed),
    "x-requests-used": String(state.billed),
    "x-requests-last": String(quota ?? 0),
  });
  res.end(payload);
}

const fake = createServer((req, res) => {
  const url = new URL(req.url ?? "/", `http://127.0.0.1:${FAKE_PORT}`);
  const path = url.pathname;
  state.calls += 1;
  state.seen.push(`${req.method} ${path}?${url.searchParams.toString()}`);

  // Contract: the key is mandatory, as a query parameter.
  if (url.searchParams.get("apiKey") !== EXPECTED_KEY) {
    return send(res, 401, { message: "apiKey is required" }, 0);
  }

  if (path === "/v4/sports") return send(res, 200, SPORTS, 0); // free endpoint

  const odds = path.match(/^\/v4\/sports\/([^/]+)\/odds$/);
  if (odds) {
    const cost =
      (url.searchParams.get("markets") ?? "h2h").split(",").length *
      (url.searchParams.get("regions") ?? "us").split(",").length;
    state.billed += cost;
    return send(res, 200, inFormat([SOCCER, NFL], url.searchParams.get("oddsFormat")), cost);
  }

  const scores = path.match(/^\/v4\/sports\/([^/]+)\/scores$/);
  if (scores) {
    const key = decodeURIComponent(scores[1]);
    state.billed += 1;
    if (key === "always_429") return send(res, 429, { message: "rate limited" }, 0);
    if (key === "always_500") return send(res, 500, { message: "boom" }, 0);
    return send(res, 200, key === "basketball_nba" ? SCORES : [], 1);
  }

  return send(res, 404, { message: `unknown path ${path}` }, 0);
});

/* ------------------------------------------------------------------ *
 * App probes
 * ------------------------------------------------------------------ */

async function get(path) {
  const res = await fetch(`${BASE}${path}`, { headers: { accept: "application/json" } });
  const text = await res.text();
  let json = null;
  try {
    json = JSON.parse(text);
  } catch {
    /* keep null */
  }
  return { status: res.status, json, text };
}

async function main() {
  await new Promise((resolve) => fake.listen(FAKE_PORT, "127.0.0.1", resolve));
  console.log(`fake The Odds API on 127.0.0.1:${FAKE_PORT}`);

  console.log("\nSportsboard feed (/api/sportsbook/events)");
  const feed = await get("/api/sportsbook/events");
  check("endpoint is 200", feed.status === 200, `got ${feed.status}`);
  check("source is the live feed", feed.json?.source === "odds-api", JSON.stringify(feed.json?.source));
  check("feed reports a fetch time", Boolean(feed.json?.fetchedAt));
  check("no error surfaced", feed.json?.error == null, String(feed.json?.error));

  const events = feed.json?.events ?? [];
  const nfl = events.find((e) => e.id === NFL.id);
  const soccer = events.find((e) => e.id === SOCCER.id);
  check("NFL fixture present", Boolean(nfl));
  check("EPL fixture present", Boolean(soccer));

  if (nfl) {
    check("teams mapped", nfl.home === "Tampa Bay Buccaneers" && nfl.away === "Dallas Cowboys");
    check("league from sport_title", nfl.league === "NFL");
    check("sport bucket from sport_key", nfl.sport === "football", nfl.sport);
    check("abbreviations derived", nfl.homeAbbr?.length === 3 && nfl.awayAbbr?.length === 3, `${nfl.homeAbbr}/${nfl.awayAbbr}`);
    // Best price across bookmakers, american → decimal: +240 → 3.4, -278 → 1.36
    check("best moneyline, home first", JSON.stringify(nfl.markets?.ml) === "[1.36,3.4]", JSON.stringify(nfl.markets?.ml));
    check("spread mapped from points", nfl.markets?.spread?.line === -6.5 && nfl.markets?.spread?.home === 1.91, JSON.stringify(nfl.markets?.spread));
    check("totals mapped", nfl.markets?.total?.line === 44.5 && nfl.markets?.total?.over === 1.95, JSON.stringify(nfl.markets?.total));
    check("not live (future kickoff)", nfl.live === false);
  }
  if (soccer) {
    check("three-way moneyline [home,draw,away]", JSON.stringify(soccer.markets?.ml) === "[2.2,3.4,1.75]", JSON.stringify(soccer.markets?.ml));
    check("in-play detected from commence_time", soccer.live === true);
    check("elapsed minute shown", typeof soccer.minute === "string" && soccer.minute.endsWith("'"), String(soccer.minute));
  }
  check("curated book still merged underneath", events.some((e) => e.id === "ucl-1"));
  check("live feed is listed ahead of the curated book", events.findIndex((e) => e.id === SOCCER.id) < events.findIndex((e) => e.id === "ucl-1"));

  console.log("\nQuota accounting");
  check("quota passthrough", feed.json?.oddsApi?.configured === true, JSON.stringify(feed.json?.oddsApi));
  check("remaining credits surfaced", typeof feed.json?.oddsApi?.remaining === "number", JSON.stringify(feed.json?.oddsApi?.remaining));
  check("cost per refresh = markets x regions", feed.json?.oddsApi?.costPerRefresh === 3, String(feed.json?.oddsApi?.costPerRefresh));

  console.log("\nCaching (one vendor call per TTL, not per request)");
  const callsBefore = state.calls;
  await get("/api/sportsbook/events");
  await get("/api/sportsbook/events");
  await get("/api/sportsbook/events");
  check("3 extra page loads cost 0 extra vendor calls", state.calls === callsBefore, `${callsBefore} → ${state.calls}`);

  console.log("\nSport list (/api/sportsbook/sports)");
  const sports = await get("/api/sportsbook/sports");
  check("200 + count", sports.status === 200 && sports.json?.count === 4, `${sports.status} ${sports.json?.count}`);
  check("bucket computed per key", sports.json?.sports?.find((s) => s.key === "basketball_nba")?.bucket === "basketball");
  check("unmapped sport has no bucket", sports.json?.sports?.find((s) => s.key === "golf_masters_tournament_winner")?.bucket === null);

  console.log("\nScores (/api/sportsbook/scores)");
  const noSport = await get("/api/sportsbook/scores");
  check("missing sport is 400", noSport.status === 400, `got ${noSport.status}`);
  const bad = await get("/api/sportsbook/scores?sport=../../etc");
  check("malformed sport is 400", bad.status === 400, `got ${bad.status}`);
  const nba = await get("/api/sportsbook/scores?sport=basketball_nba");
  check("200 with one score", nba.status === 200 && nba.json?.count === 1, `${nba.status} ${nba.json?.count}`);
  check("scores keyed home/away regardless of payload order", nba.json?.scores?.[0]?.home === 113 && nba.json?.scores?.[0]?.away === 103, JSON.stringify(nba.json?.scores?.[0]));
  check("in-play flag from commence_time", nba.json?.scores?.[0]?.live === true);
  check("no key is leaked in the response", !JSON.stringify(nba.json ?? {}).includes(EXPECTED_KEY));

  console.log("\nUpstream failures (last — they trip the rate-limit cooldown)");
  const boom = await get("/api/sportsbook/scores?sport=always_500");
  check("vendor 500 degrades to an empty list, not a 5xx", boom.status === 200 && boom.json?.count === 0, `${boom.status}`);
  const limited = await get("/api/sportsbook/scores?sport=always_429");
  check("vendor 429 degrades to an empty list", limited.status === 200 && limited.json?.count === 0, `${limited.status}`);

  // A 429 arms the circuit breaker: the board must now serve its last good
  // snapshot and say so, instead of spending more credits on a limited plan.
  const callsBeforeBreaker = state.calls;
  const afterLimit = await get("/api/sportsbook/events");
  check("rate limit arms the circuit breaker", afterLimit.json?.oddsApi?.coolingDown === true, JSON.stringify(afterLimit.json?.oddsApi));
  check("board still renders during cooldown", (afterLimit.json?.events?.length ?? 0) > 0);
  check("cooldown is reported as the error", afterLimit.json?.error === "rate_limited_cooldown", String(afterLimit.json?.error));
  check("no vendor call during cooldown", state.calls === callsBeforeBreaker, `${callsBeforeBreaker} → ${state.calls}`);

  console.log("\nOps probe (/api/operator/status)");
  const status = await get("/api/operator/status");
  check("odds connector reported", status.json?.odds === true, JSON.stringify(status.json?.odds));
  check("cost per refresh reported", status.json?.oddsCostPerRefresh === 3);
  check("status never contains the key", !status.text.includes(EXPECTED_KEY));

  console.log("\nVendor contract seen by the fake");
  const oddsCall = state.seen.find((s) => s.includes("/odds"));
  check("odds call carries regions", /regions=us/.test(oddsCall ?? ""), String(oddsCall));
  check("odds call carries markets", /markets=h2h(%2C|,)spreads(%2C|,)totals/.test(oddsCall ?? ""), String(oddsCall));
  check("odds call asks for decimal", /oddsFormat=decimal/.test(oddsCall ?? ""), String(oddsCall));

  fake.close();
  console.log(`\nodds selftest: ${failures === 0 ? "all passed" : `${failures} FAILED`}`);
  process.exit(failures === 0 ? 0 : 1);
}

main().catch((err) => {
  console.error(err);
  fake.close();
  process.exit(2);
});
