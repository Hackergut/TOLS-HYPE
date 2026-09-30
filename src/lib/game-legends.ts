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
      { label: "1 pick · 1 hit", value: "3.8×" },
      { label: "8 picks · 8 hits", value: "400×" },
      { label: "10 picks · 10 hits", value: "1,200×" },
      { label: "Risk Low / Normie / Degen", value: "0.7× / 1.25× / 1.7× on the table" },
      { label: "No hits", value: "0×" },
    ],
    symbols: [
      "Purple stroke — your pick",
      "Lime fill — hit (win)",
      "Purple fill — drawn miss",
      "Tile — empty",
    ],
  },
  hilo: {
    summary:
      "A card is up. Call higher-or-same or lower-or-same. Each hit compounds 0.99 ÷ P. Cash out any time — or miss and the streak dies. Same-rank wins.",
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
      "Up-card — lime stripe, purple ink on hearts/diamonds",
      "Higher or Same — lime",
      "Lower or Same — purple",
      "K–A rail — Ace low",
    ],
  },
  limbo: {
    summary:
      "You set a target multiplier. A number is drawn from the 1/x curve at 99% RTP. Hit if the draw is at or above your target — you are paid the target, not the raw draw.",
    what: "Limbo is a TOLS Original of one number. Higher targets pay more and hit less.",
    how: [
      "Set stake and a target at or above 1.01×.",
      "Bet. The server draws a crash-style number.",
      "If the number ≥ target, you win stake × target.",
      "If it lands under, the round is 0×.",
    ],
    features: ["99% RTP", "Target you choose", "Instant settle"],
    payouts: [
      { label: "Hit", value: "Stake × target" },
      { label: "Under", value: "0×" },
    ],
    symbols: ["Lime number — the draw", "Target — your line"],
  },
  plinko: {
    summary:
      "A chip falls through 8, 12, or 16 rows. Each peg is a fair coin flip. Edge buckets pay more. Risk Low / Medium / High reshapes the table.",
    what: "Plinko is a TOLS Original drop. The path is HMAC floats; the bucket index is how many times it bounced right.",
    how: [
      "Pick rows and risk, set stake, Drop.",
      "The chip walks left/right each row.",
      "It lands in a bucket. That multiplier settles the bet.",
    ],
    features: ["8 / 12 / 16 rows", "Three risk tables", "99% RTP envelope"],
    payouts: [{ label: "Bucket", value: "Table × stake" }],
    symbols: ["Peg — 50/50 bounce", "Lime bucket — last drop"],
  },
  tower: {
    summary:
      "Nine floors. Easy is 4 tiles and 1 bomb, Master is 4 tiles and 3 bombs. A safe pick multiplies by 0.99 ÷ (safe tiles / tiles). Cash out after a safe floor, or hit a bomb and the climb is 0×.",
    what: "Tower is a TOLS Original of nerve, row by row. Same math family as Mines, stacked.",
    how: [
      "Start a climb.",
      "Pick one tile on the live floor. Columns outside the floor are rejected.",
      "Safe continues. Death ends at 0×.",
      "Cash out after any safe floor.",
    ],
    features: ["Easy → Master", "Seed-shifted patterns", "1% edge"],
    payouts: [
      { label: "Each floor", value: "×1.48" },
      { label: "Death", value: "0×" },
    ],
    symbols: ["Lime tile — safe pick", "Red × — death"],
  },
  crash: {
    summary:
      "A multiplier climbs from 1.00× until it busts. Cash out before the crash or ride it to zero. Instant-bust chance equals the 1% edge.",
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
      "1% edge / 99% RTP",
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
      "Set stake. Pick Red/Black, Odd/Even, 1–18/19–36, a dozen, 0, or a straight number.",
      "Spin. The ball settles on 0–36 (European single zero).",
      "Even-money bets pay 2×. Dozens pay 3×. Straight and 0 pay 36×.",
      "0 loses even-money and dozen bets.",
    ],
    features: [
      "European single zero",
      "2.70% edge on even money",
      "Red / black / odd / even / high / low",
      "Dozens and straight-up",
    ],
    payouts: [
      { label: "Red / Black / Odd / Even / 1–18 / 19–36", value: "2×" },
      { label: "Dozen (1st / 2nd / 3rd 12)", value: "3×" },
      { label: "Straight number or 0", value: "36×" },
    ],
    symbols: [
      "Dark grey wheel",
      "One lime / purple track — red / black",
      "Dark purple T hub",
      "Lime ball",
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
      "Three reels, one payline classic. Line up 7s, BARs, or diamonds. Instant settle, no bonus rounds — just the payline.",
    what: "A classic TOLS slot format. One row, three symbols. Matching 7s are the top line. Everything else is a miss or a smaller three-of-a-kind.",
    how: [
      "Set stake and Spin.",
      "Three reels stop on the payline.",
      "Three matching symbols pay. Mixed reels miss.",
    ],
    features: [
      "Three reels, one payline",
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
  horse: {
    summary:
      "A six-runner derby. Pick one horse, the field runs, and the winner is drawn before the animation from a committed server seed. Every runner pays 96% RTP.",
    what: "Horse Race is a TOLS Original. Six named runners with fixed odds. A streak bonus of up to ×1.30 applies on consecutive wins and is shown on top of the base price.",
    how: [
      "Choose a stake and a runner.",
      "The server commits the seed, then the track plays the scripted order.",
      "If your horse wins, you are paid its odds. Misses pay 0×.",
    ],
    features: [
      "HMAC-SHA256 commit-reveal",
      "Fixed paytable, 96% RTP per runner",
      "Streak promo disclosed on consecutive wins",
    ],
    payouts: [
      { label: "Crimson Bolt", value: "3.00×" },
      { label: "Azure Rocket", value: "4.00×" },
      { label: "Lime Ghost", value: "5.33×" },
      { label: "Solar Flare", value: "7.38×" },
      { label: "Fluo Phantom", value: "11.29×" },
      { label: "Silver Whale", value: "21.33×" },
    ],
    symbols: [
      "Six runners — pick one",
      "Track — the race is the reveal",
      "Streak — consecutive wins, up to ×1.30",
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
  crazy: {
    summary:
      "Money-wheel game show. Bet one of eight spots on a 54-segment wheel (1, 2, 5, 10, Coin Flip, Cash Hunt, Pachinko, Crazy Time). The Top Slot can boost the result; bonus segments open four different bonus rounds. Per-spot RTP 94.4-96.1%.",
    what:
      "Crazy Tols is the TOLS Original take on the classic live money-wheel game show. The wheel has 54 segments with the classic composition — 21×1, 13×2, 7×5, 4×10, 4 Coin Flip, 2 Cash Hunt, 2 Pachinko, 1 Crazy Time. A Top Slot above the wheel draws a multiplier for one spot before every spin; if the wheel lands there, the payout is boosted.",
    how: [
      "Set stake and pick one of the eight bet spots.",
      "Spin. The Top Slot draws a multiplier for one spot (2x-100x).",
      "The wheel stops on one of 54 segments. Numbers pay 1:1, 2:1, 5:1, 10:1.",
      "Bonus segments (Coin Flip, Cash Hunt, Pachinko, Crazy Time) resolve with their own mini-game and pay the resolved multiplier.",
    ],
    features: [
      "54-segment wheel, classic composition",
      "Top Slot multipliers up to 100x",
      "Four bonus rounds: Coin Flip, Cash Hunt, Pachinko, Crazy Time",
      "Per-spot RTP 94.4-96.1%",
      "Provably fair — server commits the wheel before the spin",
    ],
    payouts: [
      { label: "1 (21 segs)", value: "1:1" },
      { label: "2 (13 segs)", value: "2:1" },
      { label: "5 (7 segs)", value: "5:1" },
      { label: "10 (4 segs)", value: "10:1" },
      { label: "Coin Flip (4 segs)", value: "2x-50x bonus" },
      { label: "Cash Hunt (2 segs)", value: "5x-300x bonus" },
      { label: "Pachinko (2 segs)", value: "2x-75x bonus" },
      { label: "Crazy Time (1 seg)", value: "up to 20,000x bonus" },
    ],
    symbols: [
      "Top Slot — multiplier reel above the wheel",
      "Coin Flip — blue/red coin with two wall multipliers",
      "Pachinko — puck drop with DOUBLE re-drops",
      "Crazy Time — 64-stop bonus wheel with doubles",
    ],
  },
  slide: {
    summary:
      "Shared round. Set a target multiplier, add the bet, and the marker slides to one result for everyone. If it lands at or above your target, that bet pays the target.",
    what: "Slide is a TOLS Original on one live table. Several targets can sit in the same round. The result is a crash-style point, hidden until the slide stops.",
    how: [
      "Set stake and a target from 1.01× up.",
      "Add bet before the round locks. Add another target if you want.",
      "The marker slides. At or above your target pays that multiplier.",
    ],
    features: ["One result for the whole table", "Several bets per round", "99% RTP"],
    payouts: [{ label: "Target hit", value: "Target × stake" }, { label: "Under", value: "0×" }],
    symbols: ["Marker — the live slide", "Target — the line you set"],
  },
};
