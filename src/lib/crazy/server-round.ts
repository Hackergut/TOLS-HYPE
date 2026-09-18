/**
 * CRAZYTOLS — server-authoritative round generation (mirror of the table math).
 *
 * The browser table animates exactly what this module produces:
 *   - Top Slot: weighted spot pick (35/33/20/12) × uniform multiplier reel.
 *   - Wheel: uniform index over the 54-segment manifest.
 *   - Number spots: payout = stake × (pays × topMulti + 1) — stake returned.
 *   - Bonus spots: the round payload (coin walls, pachinko wall + drop path,
 *     cash-hunt wall, crazy wheel values + spin path) is generated here and the
 *     client animates it; only Cash Hunt settles in a second call because the
 *     player's cell pick is not known until the reveal.
 *
 * Math profile: CRAZYTOLS-DEMO-1.1 (see ./math.ts for the client audit).
 */
import { SPOTS, TOP_SLOT_MULTIS, WHEEL, type SpotId } from "./constants";

export type Rng = { int: (rangeMax: number) => number; unit: () => number };

export const round2 = (n: number) => Math.round(n * 100) / 100;

/** Same shaping as the table's weightedMulti, driven by the server RNG. */
function weighted(rng: Rng, min: number, max: number, power = 2.6): number {
  const r = Math.pow(rng.unit(), power);
  const v = min + r * (max - min);
  const step = v < 20 ? 1 : v < 100 ? 5 : 25;
  return Math.max(min, Math.round(v / step) * step);
}

export const PACH_SLOTS = 9;
export const CT_STOPS = 24;
export const HUNT_TILES = 22;

export type CrazyBonusData =
  | { kind: "coinflip"; red: number; blue: number; side: "red" | "blue"; multiplier: number; payout: number }
  | { kind: "pachinko"; slots: (number | "x2")[]; drops: number[]; multiplier: number; payout: number }
  | { kind: "cashhunt"; tiles: number[] }
  | { kind: "crazytime"; values: (number | "x2")[]; spins: number[]; multiplier: number; payout: number };

export type CrazyRoundResult = {
  topSlot: { spot: SpotId; multi: number };
  wheelIndex: number;
  landed: SpotId;
  /** Settled-now payout per bet spot (numbers + resolved bonuses). */
  payouts: Record<SpotId, number>;
  multipliers: Record<SpotId, number>;
  totalPayout: number;
  bonus: CrazyBonusData | null;
  /** Present when the wheel landed on Cash Hunt with an active bet on it. */
  cashhunt: { stake: number; topMulti: number; tiles: number[] } | null;
};

const emptySpots = () =>
  Object.fromEntries(Object.keys(SPOTS).map((spot) => [spot, 0])) as Record<SpotId, number>;

export function generateCrazyRound(
  rng: Rng,
  bets: Partial<Record<SpotId, number>>,
): CrazyRoundResult {
  const roll = rng.unit() * 100;
  const topSpot: SpotId = roll < 35 ? "one" : roll < 68 ? "two" : roll < 88 ? "five" : "ten";
  const topSlot = { spot: topSpot, multi: TOP_SLOT_MULTIS[rng.int(TOP_SLOT_MULTIS.length)]! };
  const wheelIndex = rng.int(WHEEL.length);
  const landed = WHEEL[wheelIndex]!;

  const payouts = emptySpots();
  const multipliers = emptySpots();

  for (const spot of Object.keys(SPOTS) as SpotId[]) {
    const stake = bets[spot] ?? 0;
    const pays = SPOTS[spot].pays;
    if (stake <= 0 || pays === null || spot !== landed) continue;
    const topMulti = topSlot.spot === spot ? topSlot.multi : 1;
    const multi = pays * topMulti;
    multipliers[spot] = multi;
    payouts[spot] = round2(stake * (multi + 1));
  }

  let bonus: CrazyBonusData | null = null;
  let cashhunt: CrazyRoundResult["cashhunt"] = null;
  const stake = bets[landed] ?? 0;
  if (SPOTS[landed].pays === null && stake > 0) {
    const topMulti = topSlot.spot === landed ? topSlot.multi : 1;
    if (landed === "coinflip") {
      const red = weighted(rng, 2, 40, 2.2);
      const blue = weighted(rng, 2, 40, 2.2);
      const side: "red" | "blue" = rng.unit() < 0.5 ? "red" : "blue";
      const multiplier = (side === "red" ? red : blue) * topMulti;
      const payout = round2(stake * multiplier);
      bonus = { kind: "coinflip", red, blue, side, multiplier, payout };
      payouts[landed] = payout;
      multipliers[landed] = multiplier;
    } else if (landed === "pachinko") {
      const slots: (number | "x2")[] = [
        weighted(rng, 2, 6, 1),
        weighted(rng, 6, 14, 1),
        weighted(rng, 14, 30, 1),
        weighted(rng, 30, 70, 1.4),
        "x2",
        weighted(rng, 30, 70, 1.4),
        weighted(rng, 14, 30, 1),
        weighted(rng, 6, 14, 1),
        weighted(rng, 2, 6, 1),
      ];
      let vals = [...slots];
      const drops: number[] = [];
      let multiplier = 0;
      let payout = 0;
      for (let i = 0; i < 8; i += 1) {
        const idx = rng.int(vals.length);
        drops.push(idx);
        const value = vals[idx]!;
        if (value === "x2") {
          vals = vals.map((x) => (x === "x2" ? x : x * 2));
          continue;
        }
        multiplier = value * topMulti;
        payout = round2(stake * multiplier);
        break;
      }
      bonus = { kind: "pachinko", slots, drops, multiplier, payout };
      payouts[landed] = payout;
      multipliers[landed] = multiplier;
    } else if (landed === "crazytime") {
      const values: (number | "x2")[] = [];
      for (let i = 0; i < CT_STOPS; i += 1) {
        values.push(i % 8 === 3 ? "x2" : weighted(rng, 15, i % 6 === 0 ? 500 : 150, 2.2));
      }
      let vals = [...values];
      const spins: number[] = [];
      let multiplier = 0;
      let payout = 0;
      for (let i = 0; i < 8; i += 1) {
        const idx = rng.int(vals.length);
        spins.push(idx);
        const value = vals[idx]!;
        if (value === "x2") {
          vals = vals.map((x) => (x === "x2" ? x : x * 2));
          continue;
        }
        multiplier = value * topMulti;
        payout = round2(stake * multiplier);
        break;
      }
      bonus = { kind: "crazytime", values, spins, multiplier, payout };
      payouts[landed] = payout;
      multipliers[landed] = multiplier;
    } else {
      const tiles: number[] = [];
      for (let i = 0; i < 18; i += 1) tiles.push(weighted(rng, 3, 30, 1.6));
      tiles.push(weighted(rng, 40, 90, 1.2));
      tiles.push(weighted(rng, 40, 90, 1.2));
      tiles.push(weighted(rng, 90, 200, 1.6));
      tiles.push(weighted(rng, 20, 60, 1.2));
      for (let i = tiles.length - 1; i > 0; i -= 1) {
        const j = rng.int(i + 1);
        [tiles[i], tiles[j]] = [tiles[j]!, tiles[i]!];
      }
      bonus = { kind: "cashhunt", tiles };
      cashhunt = { stake, topMulti, tiles };
    }
  }

  const totalPayout = round2(
    (Object.keys(SPOTS) as SpotId[]).reduce((sum, spot) => sum + payouts[spot], 0),
  );
  return { topSlot, wheelIndex, landed, payouts, multipliers, totalPayout, bonus, cashhunt };
}

/** Cash Hunt second phase: the player's revealed cell settles the held stake. */
export function cashHuntPayout(tiles: number[], cell: number, stake: number, topMulti: number) {
  const value = tiles[cell];
  if (typeof value !== "number" || !Number.isFinite(value)) throw new Error("Unknown Cash Hunt cell.");
  const multiplier = value * topMulti;
  return { multiplier, payout: round2(stake * multiplier) };
}
