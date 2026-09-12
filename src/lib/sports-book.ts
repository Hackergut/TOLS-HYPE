export type SportKind = "football" | "basketball" | "tennis" | "mma" | "esports";

export type MarketKind = "ml" | "spread" | "total" | "btts" | "dc";

export type SportEvent = {
  id: string;
  sport: SportKind;
  league: string;
  home: string;
  away: string;
  homeAbbr: string;
  awayAbbr: string;
  start: string;
  live?: boolean;
  minute?: string;
  score?: [number, number];
  cover: string;
  markets: {
    ml: [number, number] | [number, number, number];
    spread?: { line: number; home: number; away: number };
    total?: { line: number; over: number; under: number };
    btts?: { yes: number; no: number };
    dc?: { homeDraw: number; homeAway: number; awayDraw: number };
  };
};

export type Outcome = {
  id: string;
  eventId: string;
  market: MarketKind;
  marketLabel: string;
  selection: string;
  label: string;
  odds: number;
  line?: number;
};

export type SlipPick = Outcome & {
  fixture: string;
};

export const SPORT_META: Record<SportKind, { label: string; cover: string; field: string }> = {
  football: { label: "Football", cover: "/brand/sports/football.jpg", field: "/brand/sports/field-football.jpg" },
  basketball: { label: "Basketball", cover: "/brand/sports/basketball.jpg", field: "/brand/sports/field-basketball.jpg" },
  tennis: { label: "Tennis", cover: "/brand/sports/tennis.jpg", field: "/brand/sports/field-basketball.jpg" },
  mma: { label: "MMA", cover: "/brand/sports/mma.jpg", field: "/brand/sports/field-mma.jpg" },
  esports: { label: "Esports", cover: "/brand/sports/football.jpg", field: "/brand/sports/field-esports.jpg" },
};

export const SPORT_EVENTS: SportEvent[] = [
  {
    id: "ucl-1",
    sport: "football",
    league: "Champions League",
    home: "AC Milan",
    away: "Sporting CP",
    homeAbbr: "MIL",
    awayAbbr: "SCP",
    start: "Tonight 20:00",
    live: true,
    minute: "67'",
    score: [1, 1],
    cover: "/brand/sports/football.jpg",
    markets: {
      ml: [2.15, 3.4, 3.2],
      spread: { line: 0, home: 1.9, away: 1.9 },
      total: { line: 2.5, over: 1.87, under: 1.93 },
      btts: { yes: 1.72, no: 2.1 },
      dc: { homeDraw: 1.36, homeAway: 1.28, awayDraw: 1.62 },
    },
  },
  {
    id: "epl-1",
    sport: "football",
    league: "Premier League",
    home: "Arsenal",
    away: "Liverpool",
    homeAbbr: "ARS",
    awayAbbr: "LIV",
    start: "Sun 16:00",
    cover: "/brand/sports/football.jpg",
    markets: {
      ml: [2.1, 3.5, 1.78],
      spread: { line: 0.5, home: 1.83, away: 1.97 },
      total: { line: 2.5, over: 1.91, under: 1.89 },
      btts: { yes: 1.8, no: 2.0 },
      dc: { homeDraw: 1.32, homeAway: 1.22, awayDraw: 1.44 },
    },
  },
  {
    id: "epl-2",
    sport: "football",
    league: "Premier League",
    home: "Manchester City",
    away: "Chelsea",
    homeAbbr: "MCI",
    awayAbbr: "CHE",
    start: "Sun 18:30",
    cover: "/brand/sports/football.jpg",
    markets: {
      ml: [1.72, 3.8, 4.6],
      spread: { line: -0.5, home: 1.85, away: 1.95 },
      total: { line: 2.5, over: 1.95, under: 1.85 },
      btts: { yes: 2.05, no: 1.75 },
    },
  },
  {
    id: "lal-1",
    sport: "football",
    league: "La Liga",
    home: "Real Madrid",
    away: "Barcelona",
    homeAbbr: "RMA",
    awayAbbr: "BAR",
    start: "Sat 21:00",
    live: true,
    minute: "12'",
    score: [0, 0],
    cover: "/brand/sports/football.jpg",
    markets: {
      ml: [1.95, 3.3, 4.1],
      spread: { line: -0.5, home: 1.92, away: 1.88 },
      total: { line: 2.5, over: 2.05, under: 1.75 },
      btts: { yes: 2.15, no: 1.68 },
    },
  },
  {
    id: "sa-1",
    sport: "football",
    league: "Serie A",
    home: "Inter",
    away: "Juventus",
    homeAbbr: "INT",
    awayAbbr: "JUV",
    start: "Sun 20:45",
    live: true,
    minute: "34'",
    score: [1, 0],
    cover: "/brand/sports/football.jpg",
    markets: {
      ml: [2.05, 3.2, 3.6],
      spread: { line: 0, home: 1.88, away: 1.92 },
      total: { line: 2.5, over: 1.9, under: 1.9 },
      btts: { yes: 1.78, no: 2.02 },
      dc: { homeDraw: 1.28, homeAway: 1.3, awayDraw: 1.68 },
    },
  },
  {
    id: "sa-2",
    sport: "football",
    league: "Serie A",
    home: "Napoli",
    away: "Roma",
    homeAbbr: "NAP",
    awayAbbr: "ROM",
    start: "Sat 18:00",
    cover: "/brand/sports/football.jpg",
    markets: {
      ml: [1.85, 3.5, 4.2],
      spread: { line: -0.5, home: 1.9, away: 1.9 },
      total: { line: 2.5, over: 1.95, under: 1.85 },
      btts: { yes: 1.82, no: 1.98 },
    },
  },
  {
    id: "nba-1",
    sport: "basketball",
    league: "NBA",
    home: "Los Angeles Lakers",
    away: "Boston Celtics",
    homeAbbr: "LAL",
    awayAbbr: "BOS",
    start: "Tonight 01:30",
    live: true,
    minute: "Q3 4:12",
    score: [88, 81],
    cover: "/brand/sports/basketball.jpg",
    markets: {
      ml: [1.64, 2.28],
      spread: { line: -4.5, home: 1.91, away: 1.91 },
      total: { line: 224.5, over: 1.9, under: 1.9 },
    },
  },
  {
    id: "nba-2",
    sport: "basketball",
    league: "NBA",
    home: "Golden State Warriors",
    away: "New York Knicks",
    homeAbbr: "GSW",
    awayAbbr: "NYK",
    start: "Tonight 04:00",
    cover: "/brand/sports/basketball.jpg",
    markets: {
      ml: [1.82, 2.02],
      spread: { line: -2.5, home: 1.88, away: 1.94 },
      total: { line: 218.5, over: 1.87, under: 1.93 },
    },
  },
  {
    id: "atp-1",
    sport: "tennis",
    league: "ATP Tour",
    home: "Jannik Sinner",
    away: "Carlos Alcaraz",
    homeAbbr: "SIN",
    awayAbbr: "ALC",
    start: "Today 15:00",
    live: true,
    minute: "Set 2",
    score: [1, 0],
    cover: "/brand/sports/tennis.jpg",
    markets: {
      ml: [1.48, 2.62],
      spread: { line: -1.5, home: 1.72, away: 2.1 },
      total: { line: 22.5, over: 1.83, under: 1.97 },
    },
  },
  {
    id: "wta-1",
    sport: "tennis",
    league: "ATP Tour",
    home: "Novak Djokovic",
    away: "Alexander Zverev",
    homeAbbr: "DJO",
    awayAbbr: "ZVE",
    start: "Today 18:00",
    cover: "/brand/sports/tennis.jpg",
    markets: {
      ml: [1.95, 1.85],
      spread: { line: -1.5, home: 2.2, away: 1.65 },
      total: { line: 21.5, over: 1.9, under: 1.9 },
    },
  },
  {
    id: "atp-3",
    sport: "tennis",
    league: "ATP Tour",
    home: "Daniil Medvedev",
    away: "Taylor Fritz",
    homeAbbr: "MED",
    awayAbbr: "FRI",
    start: "Today 20:30",
    cover: "/brand/sports/tennis.jpg",
    markets: {
      ml: [1.72, 2.1],
      spread: { line: -1.5, home: 1.95, away: 1.85 },
      total: { line: 22.5, over: 1.88, under: 1.92 },
    },
  },
  {
    id: "ufc-1",
    sport: "mma",
    league: "UFC",
    home: "Vale",
    away: "Okafor",
    homeAbbr: "VAL",
    awayAbbr: "OKF",
    start: "Sat 23:00",
    live: true,
    minute: "R2 2:51",
    cover: "/brand/sports/mma.jpg",
    markets: {
      ml: [1.55, 2.5],
      total: { line: 2.5, over: 1.87, under: 1.93 },
    },
  },
  {
    id: "ufc-2",
    sport: "mma",
    league: "UFC",
    home: "Rios",
    away: "Kane",
    homeAbbr: "RIO",
    awayAbbr: "KAN",
    start: "Sat 23:40",
    cover: "/brand/sports/mma.jpg",
    markets: {
      ml: [2.2, 1.68],
      total: { line: 2.5, over: 1.8, under: 2.0 },
    },
  },
  {
    id: "cs-1",
    sport: "esports",
    league: "ESL Pro",
    home: "Nova",
    away: "Apex",
    homeAbbr: "NOV",
    awayAbbr: "APX",
    start: "Tonight 19:00",
    live: true,
    minute: "Map 2",
    score: [1, 0],
    cover: "/brand/sports/football.jpg",
    markets: {
      ml: [1.72, 2.1],
      spread: { line: -1.5, home: 2.05, away: 1.75 },
      total: { line: 2.5, over: 1.7, under: 2.15 },
    },
  },
];

export function eventById(id: string) {
  return SPORT_EVENTS.find((e) => e.id === id);
}

export function eventsBySport(sport: SportKind | "all") {
  if (sport === "all") return SPORT_EVENTS;
  return SPORT_EVENTS.filter((e) => e.sport === sport);
}

export function featuredEvents() {
  return SPORT_EVENTS.filter((e) => e.live).slice(0, 4);
}

export function groupedByLeague(events: SportEvent[]) {
  const map = new Map<string, SportEvent[]>();
  for (const ev of events) {
    const list = map.get(ev.league) ?? [];
    list.push(ev);
    map.set(ev.league, list);
  }
  return [...map.entries()];
}

export function outcomeId(eventId: string, market: MarketKind, selection: string) {
  return `${eventId}:${market}:${selection}`;
}

export function pickKey(pick: { id: string }) {
  return pick.id;
}

export function lineLabel(line: number, sign = true) {
  if (line === 0) return "0";
  const abs = Math.abs(line);
  const body = Number.isInteger(abs) ? String(abs) : abs.toFixed(1);
  if (!sign) return body;
  return line > 0 ? `+${body}` : `-${body}`;
}

export function outcomesFor(ev: SportEvent): Outcome[] {
  const out: Outcome[] = [];
  const three = ev.markets.ml.length === 3;
  if (three) {
    const h = ev.markets.ml[0];
    const d = ev.markets.ml[1] ?? 3.2;
    const a = ev.markets.ml[2] ?? ev.markets.ml[1];
    out.push(
      { id: outcomeId(ev.id, "ml", "home"), eventId: ev.id, market: "ml", marketLabel: "1X2", selection: "home", label: ev.homeAbbr, odds: h },
      { id: outcomeId(ev.id, "ml", "draw"), eventId: ev.id, market: "ml", marketLabel: "1X2", selection: "draw", label: "Draw", odds: d },
      { id: outcomeId(ev.id, "ml", "away"), eventId: ev.id, market: "ml", marketLabel: "1X2", selection: "away", label: ev.awayAbbr, odds: a },
    );
  } else {
    const h = ev.markets.ml[0];
    const a = ev.markets.ml[1];
    out.push(
      { id: outcomeId(ev.id, "ml", "home"), eventId: ev.id, market: "ml", marketLabel: "Winner", selection: "home", label: ev.homeAbbr, odds: h },
      { id: outcomeId(ev.id, "ml", "away"), eventId: ev.id, market: "ml", marketLabel: "Winner", selection: "away", label: ev.awayAbbr, odds: a },
    );
  }
  if (ev.markets.spread) {
    const s = ev.markets.spread;
    out.push(
      {
        id: outcomeId(ev.id, "spread", "home"),
        eventId: ev.id,
        market: "spread",
        marketLabel: "Spread",
        selection: "home",
        label: `${ev.homeAbbr} ${lineLabel(s.line)}`,
        odds: s.home,
        line: s.line,
      },
      {
        id: outcomeId(ev.id, "spread", "away"),
        eventId: ev.id,
        market: "spread",
        marketLabel: "Spread",
        selection: "away",
        label: `${ev.awayAbbr} ${lineLabel(-s.line)}`,
        odds: s.away,
        line: -s.line,
      },
    );
  }
  if (ev.markets.total) {
    const t = ev.markets.total;
    out.push(
      {
        id: outcomeId(ev.id, "total", "over"),
        eventId: ev.id,
        market: "total",
        marketLabel: "Total",
        selection: "over",
        label: `Over ${lineLabel(t.line, false)}`,
        odds: t.over,
        line: t.line,
      },
      {
        id: outcomeId(ev.id, "total", "under"),
        eventId: ev.id,
        market: "total",
        marketLabel: "Total",
        selection: "under",
        label: `Under ${lineLabel(t.line, false)}`,
        odds: t.under,
        line: t.line,
      },
    );
  }
  if (ev.markets.btts) {
    out.push(
      { id: outcomeId(ev.id, "btts", "yes"), eventId: ev.id, market: "btts", marketLabel: "BTTS", selection: "yes", label: "BTTS Yes", odds: ev.markets.btts.yes },
      { id: outcomeId(ev.id, "btts", "no"), eventId: ev.id, market: "btts", marketLabel: "BTTS", selection: "no", label: "BTTS No", odds: ev.markets.btts.no },
    );
  }
  if (ev.markets.dc) {
    out.push(
      { id: outcomeId(ev.id, "dc", "1X"), eventId: ev.id, market: "dc", marketLabel: "Double chance", selection: "1X", label: "1X", odds: ev.markets.dc.homeDraw },
      { id: outcomeId(ev.id, "dc", "12"), eventId: ev.id, market: "dc", marketLabel: "Double chance", selection: "12", label: "12", odds: ev.markets.dc.homeAway },
      { id: outcomeId(ev.id, "dc", "X2"), eventId: ev.id, market: "dc", marketLabel: "Double chance", selection: "X2", label: "X2", odds: ev.markets.dc.awayDraw },
    );
  }
  return out;
}

export function resolveOutcome(eventId: string, market: MarketKind, selection: string): Outcome | undefined {
  const ev = eventById(eventId);
  if (!ev) return;
  return outcomesFor(ev).find((o) => o.market === market && o.selection === selection);
}

export function toSlipPick(ev: SportEvent, o: Outcome): SlipPick {
  return { ...o, fixture: `${ev.home} vs ${ev.away}` };
}

export function hasDraw(ev: SportEvent) {
  return ev.markets.ml.length === 3;
}

export function entitySlug(name: string) {
  return name
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

export function isPlayerSport(sport: SportKind) {
  return sport === "tennis" || sport === "mma";
}

export function entityKind(sport: SportKind): "player" | "club" {
  return isPlayerSport(sport) ? "player" : "club";
}

export function eventsForName(name: string): SportEvent[] {
  const s = entitySlug(name);
  return SPORT_EVENTS.filter((e) => entitySlug(e.home) === s || entitySlug(e.away) === s);
}

export function entityBySlug(slug: string): { name: string; sport: SportKind; events: SportEvent[] } | null {
  const hit = SPORT_EVENTS.find((e) => entitySlug(e.home) === slug || entitySlug(e.away) === slug);
  if (!hit) return null;
  const name = entitySlug(hit.home) === slug ? hit.home : hit.away;
  return { name, sport: hit.sport, events: eventsForName(name) };
}
