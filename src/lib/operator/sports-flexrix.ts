import { flexrixBase, flexrixConfigured, flexrixSign } from "@/lib/operator/flexrix-sign";
import { SPORT_EVENTS, type SportEvent, type SportKind } from "@/lib/sports-book";

const PATHS = [
  "/v1/sports/events",
  "/v1/sport/events",
  "/v1/native/sports",
  "/v1/sports/prematch",
  "/v1/sports/live",
];

function str(v: unknown) {
  return v == null ? "" : String(v);
}

function num(v: unknown, d = 0) {
  const n = Number(v);
  return Number.isFinite(n) ? n : d;
}

function sportOf(raw: Record<string, unknown>): SportKind {
  const s = `${raw.sport ?? raw.sport_alias ?? raw.sportName ?? ""}`.toLowerCase();
  if (s.includes("basket")) return "basketball";
  if (s.includes("tennis")) return "tennis";
  if (s.includes("mma") || s.includes("ufc") || s.includes("fight")) return "mma";
  if (s.includes("esport") || s.includes("cs") || s.includes("dota")) return "esports";
  return "football";
}

function items(data: unknown): Record<string, unknown>[] {
  if (!data || typeof data !== "object") return [];
  const o = data as Record<string, unknown>;
  const raw = o.items ?? o.data ?? o.events ?? o.games;
  return Array.isArray(raw) ? (raw as Record<string, unknown>[]) : Array.isArray(data) ? (data as Record<string, unknown>[]) : [];
}

function mlOf(raw: Record<string, unknown>): [number, number] | [number, number, number] | null {
  const m = (raw.markets ?? raw.odds ?? raw) as Record<string, unknown>;
  const p1 = num(m.home ?? m.p1 ?? m["1"] ?? raw.home_odd, 0);
  const px = num(m.draw ?? m.px ?? m.x ?? raw.draw_odd, 0);
  const p2 = num(m.away ?? m.p2 ?? m["2"] ?? raw.away_odd, 0);
  if (p1 > 1 && p2 > 1 && px > 1) return [p1, px, p2];
  if (p1 > 1 && p2 > 1) return [p1, p2];
  return null;
}

export function mapFlexrixEvent(raw: Record<string, unknown>, i: number): SportEvent | null {
  const home = str(raw.home ?? raw.team1_name ?? raw.team1 ?? raw.home_name ?? raw.player1);
  const away = str(raw.away ?? raw.team2_name ?? raw.team2 ?? raw.away_name ?? raw.player2);
  if (!home || !away) return null;
  const ml = mlOf(raw) ?? [1.9, 3.4, 3.6];
  const sport = sportOf(raw);
  const live = Boolean(raw.is_live ?? raw.live ?? raw.game_started);
  const id = str(raw.id ?? raw.event_id ?? `fx-${i}-${home}-${away}`).slice(0, 80);
  return {
    id: `fx-${id}`,
    sport,
    league: str(raw.competition_name ?? raw.league ?? raw.tournament ?? raw.region_alias ?? "Flexrix"),
    home,
    away,
    homeAbbr: home.slice(0, 3).toUpperCase(),
    awayAbbr: away.slice(0, 3).toUpperCase(),
    start: str(raw.start ?? raw.start_ts ?? raw.time ?? "Today"),
    live,
    minute: live ? str(raw.minute ?? raw.period ?? "Live") : undefined,
    score:
      raw.score_home != null || raw.score1 != null
        ? [num(raw.score_home ?? raw.score1), num(raw.score_away ?? raw.score2)]
        : undefined,
    cover: `/brand/sports/${sport === "esports" ? "football" : sport}.jpg`,
    markets: { ml },
  };
}

export async function loadSportsEvents(): Promise<{ events: SportEvent[]; source: string; error: string | null }> {
  if (!flexrixConfigured()) {
    return { events: SPORT_EVENTS, source: "tols", error: "flexrix not configured" };
  }
  let error: string | null = null;
  for (const path of PATHS) {
    try {
      const params = { page: 1, per_page: 50, lang: "en" };
      const { headers } = flexrixSign(params);
      const qs = "page=1&per_page=50&lang=en";
      const res = await fetch(`${flexrixBase()}${path}?${qs}`, { headers, signal: AbortSignal.timeout(8000) });
      const text = await res.text();
      if (!res.ok) {
        error = `Flexrix ${res.status} ${path}`;
        continue;
      }
      const mapped = items(JSON.parse(text)).map(mapFlexrixEvent).filter((e): e is SportEvent => Boolean(e));
      if (mapped.length) return { events: mapped, source: "flexrix", error: null };
      error = `${path} empty`;
    } catch (e) {
      error = e instanceof Error ? e.message : "flexrix sports failed";
    }
  }
  return { events: SPORT_EVENTS, source: "tols", error };
}
