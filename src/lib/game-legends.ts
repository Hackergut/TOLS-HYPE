import type { GameKind } from "@/lib/games-catalog";

export type GameLegendCopy = {
  summary: string;
  what: string;
  how: string[];
  features: string[];
  payouts: { label: string; value: string }[];
  symbols: string[];
};

export const GAME_LEGENDS: Record<GameKind, GameLegendCopy> = {
  pool: {
    summary:
      "Fast Break turns the opening pool shot into a three-second provably-fair game. Choose one of four difficulty profiles: hit frequency falls as the top multiplier rises from 1× to 100×, while every profile stays fixed at 96% RTP. The server commits the result before the cue moves; the client reveals it only after the table animation finishes.",
    what: "Pool Rush is a TOLS Original. You aim the cue, set power, and break the rack. Balls pocketed on the break climb a multiplier ladder. Nothing after the break is scored — it is a single-shot original.",
    how: [
      "Set your stake, then pick Beginner, Intermediate, Expert, or Pro.",
      "Drag on the felt to aim. Fill the PWR meter — the sweet spot sits near 80%.",
      "Hit Break. The server locks the pocket count, then the table plays it out.",
      "0 balls is a miss (0×). 7 balls on the break pays 100×.",
    ],
    features: [
      "HMAC-SHA256 commit-reveal: client seed + nonce jitter the rack, then a real 2:1 elastic break decides pockets.",
      "Horizontal 8-foot table, kitchen break, triangle on the foot spot.",
    ],
    payouts: [
      { label: "0 balls", value: "0×" },
      { label: "1 ball", value: "1×" },
      { label: "2 balls", value: "2×" },
      { label: "3 balls", value: "4×" },
      { label: "4 balls", value: "8×" },
      { label: "5 balls", value: "15×" },
      { label: "6 balls", value: "30×" },
      { label: "7 balls", value: "100×" },
    ],
    symbols: [
      "Cue ball — your break from the kitchen",
      "Object balls 1–15 — each pocketed ball steps the ladder",
      "PWR — vertical power meter; too soft or too hard both miss",
      "Lime rails — the table boundary, not a payout symbol",
    ],
  },
  dice: {
    summary:
      "Instant over/under on a 0–100 roll. You pick the target; the multiplier is (99 ÷ chance), so the house keeps 1%. The server draws the roll at bet time.",
    what: "Dice is the fastest TOLS Original. One number, one click. Roll under or over a target you set. Lower chance, higher multiplier.",
    how: [
      "Set stake, then choose Under or Over.",
      "Move the slider to set the target (chance stays between 1% and 98%).",
      "Bet. A roll from 0.00 to 99.99 settles instantly.",
      "Under wins if roll < target. Over wins if roll ≥ target.",
    ],
    features: [
      "1% house edge, 99% RTP",
      "Manual, auto, and advanced bet scripts",
      "Live roll history chips on the rail",
      "Profit preview before you click",
    ],
    payouts: [
      { label: "Win", value: "99 ÷ chance" },
      { label: "2% chance", value: "49.5×" },
      { label: "50% chance", value: "1.98×" },
      { label: "98% chance", value: "1.01×" },
      { label: "Miss", value: "0×" },
    ],
    symbols: [
      "Green rail — the winning side of the target",
      "Red rail — the losing side",
      "Roll pip — last result, lime on win",
    ],
  },
  mines: {
    summary:
      "A 5×5 grid with hidden mines. Each safe gem steps the multiplier. Cash out any time — or hit a mine and the round is dead. Edge sits near 3%.",
    what: "Mines is a TOLS Original of nerve. You choose how many mines sit under the 25 tiles, then reveal gems one by one. The multiplier climbs until you cash out or explode.",
    how: [
      "Set stake and mine count (more mines, fatter multipliers).",
      "Bet to start a round. Tiles are live.",
      "Click a tile. A gem continues; a mine ends the round at 0×.",
      "Cash out whenever the current multiplier is enough.",
    ],
    features: [
      "25-tile grid",
      "Adjustable mine count",
      "Cash-out at any safe step",
      "Server-side mine map, revealed only as you click",
    ],
    payouts: [
      { label: "Each gem", value: "Multiplier steps up" },
      { label: "Cash out", value: "Stake × current mult" },
      { label: "Mine", value: "0×" },
    ],
    symbols: [
      "Gem — safe tile",
      "Mine — round over",
      "Hidden tile — still in play",
    ],
  },
  keno: {
    summary:
      "Pick 1–10 numbers on a 40-spot board. Ten draws. Payout scales with how many of your picks hit. House edge about 4%.",
    what: "Keno is a TOLS Original lotto board. You mark spots, the house draws ten, and the paytable pays for hits against your card.",
    how: [
      "Select 1–10 numbers on the 1–40 grid.",
      "Set stake and bet. Ten numbers are drawn.",
      "Hits against your card pay from the table for that pick count.",
      "More picks raise the max payout and the miss rate.",
    ],
    features: [
      "40-spot board, 10 draws",
      "1–10 picks",
      "Paytable per pick count",
      "Instant settle",
    ],
    payouts: [
      { label: "Hits vs picks", value: "Paytable (up to high mults)" },
      { label: "No hits", value: "0×" },
    ],
    symbols: [
      "Marked spot — your pick",
      "Drawn spot — house number",
      "Hit — overlap of both",
    ],
  },
  hilo: {
    summary:
      "A card is up. You call higher-or-same or lower-or-same. Price is 0.99 ÷ probability, so the edge stays 1%. Same-rank counts as a win.",
    what: "Hi-Lo is a TOLS Original of the next card. Ace is low, King is high. You can chain rounds on the same shoe of one up-card.",
    how: [
      "A card is dealt face up.",
      "Stake, then pick Higher or Lower (ties win).",
      "The next card settles. Multiplier is 0.99 ÷ that side’s probability.",
      "The new card stays up for the next call.",
    ],
    features: [
      "1% house edge",
      "Ties win",
      "Probability-priced multipliers",
      "Continuous up-card",
    ],
    payouts: [
      { label: "Win", value: "0.99 ÷ P(side)" },
      { label: "Loss", value: "0×" },
    ],
    symbols: [
      "Up-card — the rank you are pricing",
      "Higher — next rank ≥ current",
      "Lower — next rank ≤ current",
    ],
  },
  crash: {
    summary:
      "A multiplier climbs from 1.00× until it busts. Cash out before the crash or ride it to zero. Instant-bust chance equals the 4% edge.",
    what: "Crash is a TOLS Original curve. Everyone in the round sees the same climb. Cash out locks your multiplier. If it snaps first, the stake is gone.",
    how: [
      "Set stake (and an auto cash-out if you want a hard stop).",
      "Join the round before it runs.",
      "The curve climbs. Cash out at any live multiplier.",
      "If the crash prints first, that bet is 0×.",
    ],
    features: [
      "Shared round curve",
      "Manual or auto cash-out",
      "4% edge / 96% RTP",
      "Hidden crash point until settle",
    ],
    payouts: [
      { label: "Cash out", value: "Stake × live multiplier" },
      { label: "Crash first", value: "0×" },
    ],
    symbols: [
      "Curve — live multiplier",
      "Bust point — where this round dies",
      "Cash-out mark — your lock",
    ],
  },
  roulette: {
    summary:
      "European wheel, single zero. Red/black pays 2×, a straight number pays 36×. House edge 2.70% on every bet.",
    what: "TOLS Roulette is a European single-zero original. One spin, one number 0–36. Outside colors and a straight-up number are live in this build.",
    how: [
      "Set stake and pick Red, Black, Green (0), or a straight number.",
      "Spin. The ball settles on 0–36.",
      "Red/black pays even money (2× including stake).",
      "0 and straight-up pay 36×.",
    ],
    features: [
      "European single zero",
      "2.70% edge",
      "Color and straight bets",
      "Live variant uses the same math with table pacing",
    ],
    payouts: [
      { label: "Red / Black", value: "2×" },
      { label: "Green (0)", value: "36×" },
      { label: "Straight number", value: "36×" },
    ],
    symbols: [
      "Red / black pockets",
      "Green 0 — the house number",
      "Ball — the result",
    ],
  },
  blackjack: {
    summary:
      "Standard six-deck feel, dealer stands on 17, blackjack pays 3:2. Hit, stand, or double. House edge about 0.5% with basic play.",
    what: "TOLS Blackjack is a player-vs-dealer original. Beat the dealer without busting. A natural 21 pays 3:2. The live table uses the same rules with studio pacing.",
    how: [
      "Set stake and Deal.",
      "Hit to take a card, Stand to lock, Double on the first two cards.",
      "Dealer stands on 17 (including soft 17 in this house).",
      "Blackjack (Ace + 10) pays 3:2. Push returns the stake.",
    ],
    features: [
      "~0.5% edge with basic strategy",
      "Blackjack pays 3:2",
      "Double on two-card hands",
      "Same rules on Live Blackjack",
    ],
    payouts: [
      { label: "Win", value: "2× (even money)" },
      { label: "Blackjack", value: "2.5× (3:2)" },
      { label: "Push", value: "1× (stake back)" },
      { label: "Bust / lose", value: "0×" },
    ],
    symbols: [
      "Ace — 1 or 11",
      "Ten-value — 10, J, Q, K",
      "Blackjack — Ace + ten on the deal",
    ],
  },
  slots: {
    summary:
      "Three reels, one payline. Line up 7s, BARs, or diamonds. RTP 92%, 4% edge. A fast original — no bonus round, just the payline.",
    what: "Neon Sevens is a TOLS Original slot. One row, three symbols. Matching 7s are the top line. Everything else is a miss or a smaller three-of-a-kind.",
    how: [
      "Set stake and Spin.",
      "Three reels stop on the payline.",
      "Three matching symbols pay. Mixed reels miss.",
    ],
    features: [
      "Three reels, one payline",
      "92% RTP",
      "Instant settle",
    ],
    payouts: [
      { label: "Three 7s", value: "Highest" },
      { label: "Three BAR / diamond", value: "Mid" },
      { label: "No line", value: "0×" },
    ],
    symbols: [
      "7 — top symbol",
      "BAR — mid",
      "Diamond — mid",
    ],
  },
  iframe: {
    summary:
      "This table is served by a connected aggregator or studio. TOLS holds the wallet; the provider holds the math.",
    what: "Provider games launch inside TOLS through the operator adapter. Bets debit the same SQL wallet via the seamless callback.",
    how: [
      "Sign in. TOLS opens a session with the aggregator.",
      "Play in the framed studio.",
      "Wins credit back through /api/operator/wallet.",
    ],
    features: [
      "Seamless wallet",
      "SQL / Prisma / Supabase ledger",
      "Same cashier as Originals",
    ],
    payouts: [{ label: "Provider RTP", value: "Studio published" }],
    symbols: ["Iframe — studio canvas"],
  },
};
