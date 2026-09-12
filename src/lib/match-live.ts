import type { SportEvent } from "@/lib/sports-book";

export type DualStat = { label: string; home: number; away: number };

export type FeedItem = {
  minute: string;
  team: "home" | "away";
  kind: "goal" | "card" | "sub";
  player: string;
};

export type MatchLive = {
  stage: string;
  ht?: [number, number];
  events: FeedItem[];
  general: DualStat[];
  offense: DualStat[];
  defense: DualStat[];
  tennis?: {
    points: [string, string];
    games: [string, string];
    sets: [number, number][];
    serving: "home" | "away";
    speed: [number, number];
  };
  mma?: {
    round: number;
    clock: string;
    control: [string, string];
    target: { label: string; home: number; away: number }[];
  };
};

function rng(id: string) {
  let h = 2166136261;
  for (const c of id) h = Math.imul(h ^ c.charCodeAt(0), 16777619);
  return () => {
    h = Math.imul(h ^ (h >>> 13), 1274126177);
    return (h >>> 0) / 4294967296;
  };
}

function pair(n: () => number, max: number, live: boolean): [number, number] {
  const a = Math.round(n() * max);
  const b = Math.round(n() * max);
  if (!live) return [Math.max(a, 4), Math.max(b, 3)];
  return [a + 6, b + 5];
}

const PLAYERS = ["Rossi", "Khan", "Vale", "Okada", "Noren", "Ellis", "Rios", "Kane", "Mori", "Diaz"];

export function matchLive(ev: SportEvent): MatchLive {
  const n = rng(ev.id);
  const live = Boolean(ev.live);
  const [h, a] = ev.score ?? [0, 0];
  const events: FeedItem[] = [];
  for (let i = 0; i < h; i++) {
    events.push({
      minute: `${Math.round(12 + n() * 70)}'`,
      team: "home",
      kind: "goal",
      player: PLAYERS[Math.floor(n() * PLAYERS.length)]!,
    });
  }
  for (let i = 0; i < a; i++) {
    events.push({
      minute: `${Math.round(8 + n() * 75)}'`,
      team: "away",
      kind: "goal",
      player: PLAYERS[Math.floor(n() * PLAYERS.length)]!,
    });
  }
  if (live && n() > 0.4) {
    events.push({
      minute: `${Math.round(20 + n() * 50)}'`,
      team: n() > 0.5 ? "home" : "away",
      kind: "card",
      player: PLAYERS[Math.floor(n() * PLAYERS.length)]!,
    });
  }
  events.sort((x, y) => parseInt(x.minute, 10) - parseInt(y.minute, 10));

  const poss = Math.round(38 + n() * 24);
  const general: DualStat[] = [
    { label: "Possession", home: poss, away: 100 - poss },
    { label: "Attacks", home: pair(n, 28, live)[0], away: pair(n, 24, live)[1] },
    { label: "Passing", home: pair(n, 180, live)[0] + 40, away: pair(n, 160, live)[1] + 40 },
    { label: "Shooting", home: pair(n, 14, live)[0], away: pair(n, 12, live)[1] },
    { label: "Corners", home: pair(n, 8, live)[0], away: pair(n, 7, live)[1] },
    { label: "Cards", home: pair(n, 3, live)[0], away: pair(n, 3, live)[1] },
  ];
  const offense: DualStat[] = [
    { label: "Goals", home: h, away: a },
    { label: "Shots on target", home: pair(n, 8, live)[0] + h, away: pair(n, 7, live)[1] + a },
    { label: "Shots off target", home: pair(n, 6, live)[0], away: pair(n, 6, live)[1] },
    { label: "In the box", home: pair(n, 10, live)[0], away: pair(n, 9, live)[1] },
  ];
  const defense: DualStat[] = [
    { label: "Tackles", home: pair(n, 18, live)[0], away: pair(n, 16, live)[1] },
    { label: "Saves", home: pair(n, 5, live)[0], away: pair(n, 6, live)[1] },
  ];

  const live_out: MatchLive = {
    stage: ev.live ? ev.minute ?? "Live" : ev.start,
    ht: ev.sport === "football" && ev.score ? [Math.max(0, h - (h > 0 ? 1 : 0)), Math.max(0, a - (a > 1 ? 1 : 0))] : undefined,
    events,
    general,
    offense,
    defense,
  };

  if (ev.sport === "tennis") {
    live_out.tennis = {
      points: live ? ["40", "30"] : ["0", "0"],
      games: live ? ["6-4", "3-2"] : ["0-0", "0-0"],
      sets: ev.score ? [[ev.score[0], ev.score[1]]] : [[0, 0]],
      serving: n() > 0.5 ? "home" : "away",
      speed: [188 + Math.round(n() * 20), 172 + Math.round(n() * 22)],
    };
  }
  if (ev.sport === "mma") {
    live_out.mma = {
      round: live ? 2 : 1,
      clock: live ? "2:51" : "5:00",
      control: ["0:34", "2:17"],
      target: [
        { label: "Head", home: 34, away: 58 },
        { label: "Body", home: 16, away: 11 },
        { label: "Legs", home: 1, away: 1 },
      ],
    };
  }
  return live_out;
}
