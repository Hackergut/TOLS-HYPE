import { HORSES, MIN_BET, type Player } from "./types";

const PREFIX = [
  "0x", "crypto", "degen", "neon", "moon", "ghost", "turbo", "hyper", " pixel", "vapor",
  "byte", "bit", "satoshi", "ape", "diamond", "laser", "nova", "retro", "cyber", "solar",
];
const SUFFIX = [
  "whale", "rider", "sniper", "king", "zilla", "tron", "ninja", "pump", "fx", "storm",
  "wolf", "shark", "bot", "wave", "hunter", "max", "jet", "flash", "coin", "god",
];
const SOLO = [
  "JockeyDan", "LuckyLuke", "MissDerby", "TrackStar", "BetMaster", "PhotoFinish",
  "StableKing", "OddsHunter", "FastFilly", "GoldenBoot", "SilkRider", "FinalFurlong",
];

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

export function randomName(): string {
  if (Math.random() < 0.25) return pick(SOLO);
  const p = pick(PREFIX).trim();
  const s = pick(SUFFIX);
  const n = Math.random() < 0.6 ? Math.floor(Math.random() * 999) : "";
  return `${p}${s}${n}`;
}

export function randomBet(): number {
  const r = Math.random();
  if (r < 0.42) return [MIN_BET, 25, 50][Math.floor(Math.random() * 3)];
  if (r < 0.75) return [100, 150, 250][Math.floor(Math.random() * 3)];
  if (r < 0.93) return [500, 750, 1000][Math.floor(Math.random() * 3)];
  return [2500, 5000, 10000][Math.floor(Math.random() * 3)];
}

function weightedHorse(): number {
  const total = HORSES.reduce((s, h) => s + h.pop, 0);
  let r = Math.random() * total;
  for (const h of HORSES) {
    r -= h.pop;
    if (r <= 0) return h.id;
  }
  return 0;
}

let uid = 0;
export function makeBot(): Player {
  const horseId = weightedHorse();
  const bet = randomBet();
  return {
    id: `bot_${uid++}`,
    name: randomName(),
    hue: Math.floor(Math.random() * 360),
    bet,
    horseId,
    potential: Math.floor(bet * HORSES[horseId].odds),
    isYou: false,
  };
}

export function youEntry(bet: number, horseId: number): Player {
  return {
    id: "you",
    name: "You",
    hue: 155,
    bet,
    horseId,
    potential: Math.floor(bet * HORSES[horseId].odds),
    isYou: true,
  };
}

/** How many players are in the pool for a fresh lobby */
export function lobbyTarget(): number {
  return 8 + Math.floor(Math.random() * 8); // 8..15
}
