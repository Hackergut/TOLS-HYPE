/**
 * Crazy Tols — money-wheel game show (Crazy Time-style TOLS Original).
 *
 * Wheel: 54 segments, same composition as the classic live game show:
 *   1×21, 2×13, 5×7, 10×4, Coin Flip×4, Cash Hunt×2, Pachinko×2, Crazy Time×1.
 * The player bets on ONE spot. The Top Slot picks one of the 8 spots (uniform)
 * and a multiplier; if the wheel lands on the bet spot the payout is
 *   stake × (1 + base × topSlot)     for numbers (base = 1|2|5|10)
 *   stake × (1 + bonusValue × topSlot) for bonus spots
 * i.e. the Top Slot multiplies the PROFIT, stake is returned — same convention
 * as the classic game ("1 pays 1:1").
 *
 * Bonus rounds (server-resolved, client animates):
 *   - Coin Flip: blue/red multipliers drawn from the wall, coin picks a side.
 *   - Pachinko: puck lands in a slot; DOUBLE doubles the wall and re-drops.
 *   - Cash Hunt: 108 hidden multipliers, one cell resolves.
 *   - Crazy Time: 64-stop wheel (10/15/20/25/50/100 + DOUBLE), doubles re-spin.
 *
 * Calibration (per-spot RTP targets, classic game):
 *   1: 96.1% · 2: 96.0% · 5: 95.8% · 10: 95.7%
 *   Coin Flip: 95.7% · Cash Hunt: 95.3% · Pachinko: 94.3% · Crazy Time: 94.4%
 */

export type CrazySegmentType = "1" | "2" | "5" | "10" | "coinflip" | "cashhunt" | "pachinko" | "crazy";

export type CrazyBetSpot = CrazySegmentType;

export const CRAZY_BET_SPOTS: { id: CrazyBetSpot; label: string; blurb: string }[] = [
  { id: "1", label: "1", blurb: "pays 1:1" },
  { id: "2", label: "2", blurb: "pays 2:1" },
  { id: "5", label: "5", blurb: "pays 5:1" },
  { id: "10", label: "10", blurb: "pays 10:1" },
  { id: "coinflip", label: "Coin Flip", blurb: "bonus · 2x-50x" },
  { id: "cashhunt", label: "Cash Hunt", blurb: "bonus · 5x-300x" },
  { id: "pachinko", label: "Pachinko", blurb: "bonus · 2x-200x" },
  { id: "crazy", label: "Crazy Time", blurb: "bonus · up to 20,000x" },
];

const SEG_COLOR: Record<CrazySegmentType, string> = {
  "1": "#1d63ff",
  "2": "#e8b84a",
  "5": "#1a8f2c",
  "10": "#7c3aec",
  coinflip: "#d4a017",
  cashhunt: "#0aa3c2",
  pachinko: "#ff5b79",
  crazy: "#e11d48",
};

const SEG_LABEL: Record<CrazySegmentType, string> = {
  "1": "1",
  "2": "2",
  "5": "5",
  "10": "10",
  coinflip: "COIN FLIP",
  cashhunt: "CASH HUNT",
  pachinko: "PACHINKO",
  crazy: "CRAZY TIME",
};

/** The 54-segment wheel — official counts (21/13/7/4/4/2/2/1), alternating. */
export const CRAZY_WHEEL: { type: CrazySegmentType; label: string; color: string }[] = (() => {
  const raw: CrazySegmentType[] = [
    "1", "2", "1", "5", "1", "coinflip",
    "2", "1", "2", "1", "10", "cashhunt",
    "1", "2", "1", "5", "1", "coinflip",
    "2", "1", "2", "1", "10", "pachinko",
    "1", "2", "1", "5", "1", "coinflip",
    "2", "1", "5", "1", "2", "crazy",
    "1", "5", "2", "10", "1", "coinflip",
    "2", "1", "5", "1", "10", "pachinko",
    "2", "1", "5", "1", "2", "cashhunt",
  ];
  return raw.map((type) => ({ type, label: SEG_LABEL[type]!, color: SEG_COLOR[type]! }));
})();

/**
 * Top Slot multiplier ranges per spot. The left reel picks the spot uniformly
 * (1/8); these are the right-reel ranges. Payout convention: the Top Slot
 * multiplies the PROFIT (stake returned), so total return = 1 + base × top.
 * Calibrated to the classic per-spot RTP targets.
 */
const TOP_SLOT_RANGES: Record<CrazySegmentType, number[]> = {
  "1": [2, 3, 3, 4, 5, 6, 7, 8],
  "2": [2, 2, 3, 3, 3, 4, 5, 5, 6, 7, 7, 8, 9],
  "5": [2, 2, 3, 4, 5],
  "10": [2, 2, 2, 2, 2, 2, 2, 3, 3, 3, 3, 3, 3],
  coinflip: [2, 2, 3, 4, 5],
  cashhunt: [2, 3, 4],
  pachinko: [2, 3, 3, 4, 4],
  crazy: [2, 3, 3, 4, 4, 4, 5, 5, 5, 6],
};

/** Coin Flip wall — 14 chips, avg 9.29x profit (classic 9.28x). */
const COIN_FLIP_MULTS = [2, 2, 2, 3, 3, 3, 4, 4, 5, 7, 10, 15, 20, 50];

/** Pachinko wall — 18 slots, DOUBLE at both ends (re-drop doubles the wall). */
const PACHINKO_SLOTS = [0, 75, 50, 25, 20, 15, 10, 10, 10, 10, 5, 5, 5, 2, 2, 2, 25, 0];

/** Cash Hunt wall: [value, cells] — 108 cells, avg profit 19.78x. */
const CASH_HUNT_SPEC: [number, number][] = [
  [5, 36],
  [7, 18],
  [10, 14],
  [15, 12],
  [20, 10],
  [25, 6],
  [40, 4],
  [50, 3],
  [100, 2],
  [150, 1],
  [200, 1],
  [300, 1],
];

/** Crazy Time bonus wheel — 64 stops (Wizard wheel 1: 10/15/20/25/50/100 + 16 DOUBLE). */
const CRAZY_TIME_WHEEL: Array<number | "double"> = [
  ...Array<number>(12).fill(10),
  ...Array<number>(13).fill(15),
  ...Array<number>(7).fill(20),
  ...Array<number>(8).fill(25),
  ...Array<number>(6).fill(50),
  ...Array<number>(2).fill(100),
  ...Array<"double">(16).fill("double"),
];

export type CrazyResult = {
  wheelIndex: number;
  segment: CrazySegmentType;
  segmentLabel: string;
  /** True when the player's bet spot won. */
  win: boolean;
  /** Total return multiplier applied to the stake (stake included). */
  multiplier: number;
  /** Profit multiplier (multiplier − 1) — what the game UI calls the payout. */
  profitMultiplier: number;
  topSlot: { segment: CrazySegmentType; multiplier: number } | null;
  bonus:
    | { kind: "coinflip"; blue: number; red: number; side: "blue" | "red" }
    | { kind: "pachinko"; slot: number; value: number; doubles: number }
    | { kind: "cashhunt"; cell: number; value: number }
    | { kind: "crazy"; wheelIndex: number; value: number; doubles: number }
    | null;
};

function pick(u: number, len: number): number {
  return Math.min(len - 1, Math.floor(u * len));
}

const SPOT_TYPES: CrazySegmentType[] = ["1", "2", "5", "10", "coinflip", "cashhunt", "pachinko", "crazy"];

/** Top Slot: left reel picks one of the 8 spots uniformly; right reel the multiplier. */
function drawTopSlot(u1: number, u2: number): { segment: CrazySegmentType; multiplier: number } {
  const seg = SPOT_TYPES[pick(u1, SPOT_TYPES.length)]!;
  const range = TOP_SLOT_RANGES[seg]!;
  return { segment: seg, multiplier: range[pick(u2, range.length)]! };
}

/** One full Crazy Tols round from provably-fair floats (needs ≥ 10; playInstant supplies 16). */
export function crazyRound(floats: number[], betSpot: CrazyBetSpot): CrazyResult {
  const u = floats;
  const wheelIndex = pick(u[0]!, CRAZY_WHEEL.length);
  const seg = CRAZY_WHEEL[wheelIndex]!;
  const topSlot = drawTopSlot(u[1]!, u[2]!);
  const topsUp = topSlot.segment === seg.type ? topSlot.multiplier : 1;

  const finish = (profitMult: number, bonus: CrazyResult["bonus"]): CrazyResult => ({
    wheelIndex,
    segment: seg.type,
    segmentLabel: seg.label,
    win: betSpot === seg.type,
    multiplier: 1 + profitMult,
    profitMultiplier: profitMult,
    topSlot,
    bonus,
  });

  // Number segments pay base × topSlot as profit.
  if (seg.type === "1" || seg.type === "2" || seg.type === "5" || seg.type === "10") {
    return finish(Number(seg.type) * topsUp, null);
  }

  // Coin Flip: two wall multipliers, coin picks the side.
  if (seg.type === "coinflip") {
    const blue = COIN_FLIP_MULTS[pick(u[3]!, COIN_FLIP_MULTS.length)]!;
    const red = COIN_FLIP_MULTS[pick(u[4]!, COIN_FLIP_MULTS.length)]!;
    const side = u[5]! < 0.5 ? "blue" : "red";
    const value = side === "blue" ? blue : red;
    return finish(value * topsUp, { kind: "coinflip", blue, red, side });
  }

  // Pachinko: puck into a slot; DOUBLE doubles the wall and re-drops (cap 4).
  if (seg.type === "pachinko") {
    let slot = pick(u[3]!, PACHINKO_SLOTS.length);
    let value = PACHINKO_SLOTS[slot]!;
    let doubles = 0;
    let factor = 1;
    let f = 4;
    while (value === 0 && doubles < 4) {
      doubles += 1;
      factor *= 2;
      slot = pick(u[f] ?? u[3]!, PACHINKO_SLOTS.length);
      value = PACHINKO_SLOTS[slot]!;
      f += 1;
    }
    if (value === 0) value = 2;
    const final = value * factor;
    return finish(final * topsUp, { kind: "pachinko", slot, value: final, doubles });
  }

  // Cash Hunt: one cell of the 108-cell wall resolves.
  if (seg.type === "cashhunt") {
    const cells: number[] = [];
    for (const [value, count] of CASH_HUNT_SPEC) for (let i = 0; i < count; i++) cells.push(value);
    const cell = pick(u[3]!, cells.length);
    const value = cells[cell]!;
    return finish(value * topsUp, { kind: "cashhunt", cell, value });
  }

  // Crazy Time: 64-stop wheel; DOUBLE doubles and re-spins (new float per spin).
  let idx = pick(u[3]!, CRAZY_TIME_WHEEL.length);
  let doubles = 0;
  let factor = 1;
  let value = 0;
  for (let spin = 0; spin < 8; spin++) {
    const stop = CRAZY_TIME_WHEEL[idx]!;
    if (stop === "double") {
      doubles += 1;
      factor *= 2;
      idx = pick(u[4 + spin] ?? u[15]!, CRAZY_TIME_WHEEL.length);
      continue;
    }
    value = stop;
    break;
  }
  if (value === 0) value = 10;
  const final = value * factor;
  return finish(final * topsUp, { kind: "crazy", wheelIndex: idx, value: final, doubles });
}