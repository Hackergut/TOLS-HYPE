import { matchLive, type DualStat, type MatchLive } from "@/lib/match-live";
import { hasDraw, outcomesFor, type Outcome, type SportEvent } from "@/lib/sports-book";

const FIRST = ["Alex", "Leo", "Kai", "Noah", "Omar", "Luca", "Theo", "Ilan", "Rafi", "Milo", "Sami"];
const LAST = ["Rossi", "Khan", "Vale", "Okada", "Noren", "Ellis", "Rios", "Kane", "Mori", "Diaz", "Cruz"];

function rng(id: string) {
  let h = 2166136261;
  for (const c of id) h = Math.imul(h ^ c.charCodeAt(0), 16777619);
  return () => {
    h = Math.imul(h ^ (h >>> 13), 1274126177);
    return (h >>> 0) / 4294967296;
  };
}

export type ShotDot = { x: number; y: number; team: "home" | "away"; on: boolean };
export type FormChar = "W" | "D" | "L";
export type H2HRow = { when: string; home: number; away: number; winner: "home" | "away" | "draw" };
export type XI = { num: number; name: string; pos: string };

export type MatchDossier = {
  live: MatchLive;
  winProb: { home: number; draw: number; away: number };
  xg: DualStat;
  shots: ShotDot[];
  form: { home: FormChar[]; away: FormChar[] };
  h2h: H2HRow[];
  xi: { home: XI[]; away: XI[] };
  extra: DualStat[];
};

function implied(odds: number[]) {
  const inv = odds.map((o) => 1 / o);
  const s = inv.reduce((a, b) => a + b, 0);
  return inv.map((v) => Math.round((v / s) * 100));
}

function eleven(n: () => number, seed: string): XI[] {
  const pos = ["GK", "RB", "CB", "CB", "LB", "CM", "CM", "AM", "RW", "ST", "LW"];
  return pos.map((p, i) => ({
    num: 1 + i + Math.floor(n() * 9),
    name: `${FIRST[Math.floor(n() * FIRST.length)]!} ${LAST[(i + seed.length) % LAST.length]!}`,
    pos: p,
  }));
}

export function matchDossier(ev: SportEvent): MatchDossier {
  const n = rng(`${ev.id}-dossier`);
  const live = matchLive(ev);
  const ml = outcomesFor(ev).filter((o) => o.market === "ml");
  const p = implied(ml.map((o) => o.odds));
  const winProb = hasDraw(ev)
    ? { home: p[0] ?? 40, draw: p[1] ?? 28, away: p[2] ?? 32 }
    : { home: p[0] ?? 52, draw: 0, away: p[1] ?? 48 };

  const xgHome = Math.round((0.4 + n() * 2.2 + (ev.score?.[0] ?? 0) * 0.3) * 10) / 10;
  const xgAway = Math.round((0.3 + n() * 2.0 + (ev.score?.[1] ?? 0) * 0.3) * 10) / 10;

  const shots: ShotDot[] = Array.from({ length: 10 + Math.floor(n() * 8) }, () => ({
    x: 8 + n() * 84,
    y: 12 + n() * 76,
    team: n() > 0.5 ? "home" : "away",
    on: n() > 0.45,
  }));

  const formOf = (): FormChar[] =>
    Array.from({ length: 5 }, () => {
      const r = n();
      return r > 0.55 ? "W" : r > 0.3 ? "D" : "L";
    });

  const h2h: H2HRow[] = Array.from({ length: 5 }, (_, i) => {
    const home = Math.floor(n() * 4);
    const away = Math.floor(n() * 4);
    return {
      when: `${2019 + i}`,
      home,
      away,
      winner: home > away ? "home" : away > home ? "away" : "draw",
    };
  });

  return {
    live,
    winProb,
    xg: { label: "xG", home: xgHome, away: xgAway },
    shots,
    form: { home: formOf(), away: formOf() },
    h2h,
    xi: { home: eleven(n, ev.home), away: eleven(n, ev.away) },
    extra: [
      { label: "xG", home: xgHome, away: xgAway },
      { label: "Big chances", home: Math.floor(n() * 5), away: Math.floor(n() * 5) },
      { label: "Touches in box", home: 8 + Math.floor(n() * 18), away: 6 + Math.floor(n() * 16) },
      { label: "Pass accuracy %", home: 72 + Math.floor(n() * 18), away: 70 + Math.floor(n() * 18) },
      { label: "Fouls", home: 4 + Math.floor(n() * 10), away: 4 + Math.floor(n() * 10) },
      { label: "Offsides", home: Math.floor(n() * 5), away: Math.floor(n() * 4) },
    ],
  };
}

export function marketsGrouped(ev: SportEvent): { title: string; items: Outcome[] }[] {
  const all = outcomesFor(ev);
  const order = ["ml", "dc", "spread", "total", "btts"] as const;
  const titles: Record<string, string> = {
    ml: hasDraw(ev) ? "1X2" : "Moneyline",
    dc: "Double chance",
    spread: "Spread / handicap",
    total: "Total goals / points",
    btts: "Both teams to score",
  };
  return order
    .map((k) => ({ title: titles[k]!, items: all.filter((o) => o.market === k) }))
    .filter((g) => g.items.length);
}
