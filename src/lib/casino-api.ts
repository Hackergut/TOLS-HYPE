import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { authMiddleware } from "@/lib/auth/middleware";
import { getSql } from "@/lib/db";
import {
  CURRENCIES,
  CURRENCY_META,
  type Currency,
  getGame,
} from "./games-catalog";
import { asNumber } from "./format";
import { takeFair } from "@/lib/fair.server";
import { crashPointFromFloat, diceRoll, pickIndex, uniquePicks } from "@/lib/fair";
import { poolMultiplier, simulateBreak, type PoolDiff } from "@/lib/pool-physics";
import {
  credit,
  debit,
  ensureWallets,
  readWallet,
  snapshotBalances,
} from "@/lib/wallet.server";
import { comboOdds, vigPrice } from "@/lib/odds";
import { resolveOutcome, type MarketKind } from "@/lib/sports-book";
import {
  crashElapsedFor,
  crashMultiplierAt,
  freshShoe,
  handValue,
  isBlackjack,
  newRoundId,
  rouletteColor,
  slotsPayout,
  spinReel,
  type PlayingCard,
  type SlotSymbol,
} from "./rng";

const currencySchema = z.enum(CURRENCIES);

function parseCurrency(value: string): Currency {
  if ((CURRENCIES as readonly string[]).includes(value)) return value as Currency;
  return "USDT";
}

export type WalletSnapshot = {
  balances: Record<Currency, number>;
  wagered: number;
  transactions: {
    id: number;
    type: string;
    amount: number;
    currency: Currency;
    status: string;
    gameId: string | null;
    note: string | null;
    createdAt: string;
  }[];
};

export const getWallet = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .handler(async ({ context }) => {
    return readWallet(context.userId);
  });

export const cashier = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator(
    z.object({
      action: z.enum(["deposit", "withdraw"]),
      currency: currencySchema,
      amount: z.number().positive(),
    }),
  )
  .handler(async ({ context, data }) => {
    await ensureWallets(context.userId);
    const cap = data.currency === "USDT" ? 5000 : data.currency === "ETH" ? 5 : 0.5;
    if (data.amount > cap) throw new Error(`Max ${data.action} is ${cap} ${data.currency}`);
    if (data.action === "deposit") {
      await credit(context.userId, data.currency, data.amount, "deposit");
    } else {
      await debit(context.userId, data.currency, data.amount, "withdrawal");
    }
    return { balances: await snapshotBalances(context.userId) };
  });

function assertBet(currency: Currency, amount: number) {
  const meta = CURRENCY_META[currency];
  if (amount < meta.minBet) throw new Error(`Minimum bet is ${meta.minBet} ${currency}`);
  if (amount > meta.maxBet) throw new Error(`Maximum bet is ${meta.maxBet} ${currency}`);
}

export type PlayResult = {
  payout: number;
  multiplier: number;
  detail: {
    roll?: number;
    over?: boolean;
    number?: number;
    color?: string;
    reels?: string[];
  };
  balances: Record<Currency, number>;
  fair?: { serverHash: string; clientSeed: string; nonce: number };
};

async function snapshot(userId: string): Promise<Record<Currency, number>> {
  return snapshotBalances(userId);
}

export const playInstant = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator(
    z.object({
      gameId: z.string(),
      currency: currencySchema,
      amount: z.number().positive(),
      choice: z.string().optional(),
      target: z.number().min(0.01).max(98).optional(),
    }),
  )
  .handler(async ({ context, data }): Promise<PlayResult> => {
    const game = getGame(data.gameId);
    if (!game) throw new Error("Unknown game");
    assertBet(data.currency, data.amount);
    await ensureWallets(context.userId);
    await debit(context.userId, data.currency, data.amount, "bet", game.id, game.title);
    const fair = await takeFair(context.userId, 8);
    const u = fair.floats;

    let payout = 0;
    let multiplier = 0;
    const detail: PlayResult["detail"] = {};

    if (game.kind === "dice") {
      const roll = diceRoll(u[0]!);
      const over = data.choice === "over";
      const target = data.target ?? 50;
      const chance = over ? 100 - target : target;
      const clamped = Math.min(98, Math.max(1, chance));
      const multiplierWin = 99 / clamped;
      const win = over ? roll >= target : roll < target;
      multiplier = win ? multiplierWin : 0;
      payout = win ? data.amount * multiplierWin : 0;
      detail.roll = roll;
      detail.over = over;
    } else if (game.kind === "roulette") {
      const number = pickIndex(u[0]!, 37);
      const color = rouletteColor(number);
      const choice = data.choice ?? "red";
      if (choice === "red" || choice === "black") {
        const win = color === choice;
        multiplier = win ? 2 : 0;
        payout = win ? data.amount * 2 : 0;
      } else if (choice === "green") {
        const win = number === 0;
        multiplier = win ? 36 : 0;
        payout = win ? data.amount * 36 : 0;
      } else {
        const n = Number(choice);
        const win = n === number;
        multiplier = win ? 36 : 0;
        payout = win ? data.amount * 36 : 0;
      }
      detail.number = number;
      detail.color = color;
    } else if (game.kind === "slots") {
      const reels: [SlotSymbol, SlotSymbol, SlotSymbol] = [
        spinReel(u[0]),
        spinReel(u[1]),
        spinReel(u[2]),
      ];
      payout = slotsPayout(reels, data.amount);
      multiplier = payout > 0 ? payout / data.amount : 0;
      detail.reels = reels;
    } else if (game.kind === "crash") {
      throw new Error("Use startCrash for this game");
    } else if (game.kind === "blackjack") {
      throw new Error("Use dealBlackjack for this game");
    } else if (game.kind === "mines" || game.kind === "keno" || game.kind === "hilo" || game.kind === "pool") {
      throw new Error("Use the dedicated play function for this game");
    }

    if (payout > 0) {
      await credit(context.userId, data.currency, payout, "win", game.id, game.title);
    }
    return { payout, multiplier, detail, balances: await snapshot(context.userId), fair };
  });

export const placeSportBet = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator(
    z.object({
      amount: z.number().positive(),
      currency: currencySchema,
      mode: z.enum(["single", "combo"]),
      legs: z
        .array(
          z.object({
            eventId: z.string(),
            market: z.enum(["ml", "spread", "total", "btts", "dc"]),
            selection: z.string(),
          }),
        )
        .min(1)
        .max(12),
    }),
  )
  .handler(async ({ context, data }) => {
    assertBet(data.currency, data.amount);
    await ensureWallets(context.userId);
    const resolved = data.legs.map((leg) => {
      const o = resolveOutcome(leg.eventId, leg.market as MarketKind, leg.selection);
      if (!o) throw new Error("Market closed");
      return o;
    });
    const fair = await takeFair(context.userId, data.mode === "combo" ? 1 : resolved.length);

    if (data.mode === "combo") {
      const price = comboOdds(resolved.map((o) => o.odds));
      await debit(context.userId, data.currency, data.amount, "bet", resolved[0]!.eventId, "sports-acca");
      const win = fair.floats[0]! < vigPrice(price);
      const payout = win ? data.amount * price : 0;
      if (payout > 0) {
        await credit(context.userId, data.currency, payout, "win", resolved[0]!.eventId, "sports-acca");
      }
      return {
        mode: "combo" as const,
        price,
        hits: win ? resolved.length : 0,
        payout,
        balances: await snapshot(context.userId),
      };
    }

    let hits = 0;
    let payout = 0;
    for (let i = 0; i < resolved.length; i++) {
      const o = resolved[i]!;
      await debit(context.userId, data.currency, data.amount, "bet", o.eventId, o.marketLabel);
      const win = fair.floats[i]! < vigPrice(o.odds);
      if (win) {
        hits += 1;
        const won = data.amount * o.odds;
        payout += won;
        await credit(context.userId, data.currency, won, "win", o.eventId, o.marketLabel);
      }
    }
    return {
      mode: "single" as const,
      price: null as number | null,
      hits,
      payout,
      balances: await snapshot(context.userId),
    };
  });

type CrashPayload = {
  crashAt: number;
  startedAt: number;
};

export const startCrash = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator(
    z.object({
      gameId: z.string(),
      currency: currencySchema,
      amount: z.number().positive(),
    }),
  )
  .handler(async ({ context, data }) => {
    const game = getGame(data.gameId);
    if (!game || game.kind !== "crash") throw new Error("Not a crash game");
    assertBet(data.currency, data.amount);
    await ensureWallets(context.userId);
    await debit(context.userId, data.currency, data.amount, "bet", game.id, game.title);
    const id = newRoundId();
    const fair = await takeFair(context.userId, 1);
    const payload: CrashPayload = {
      crashAt: crashPointFromFloat(fair.floats[0]!, game.edge),
      startedAt: Date.now(),
    };
    const sql = await getSql();
    await sql`
      insert into game_rounds (id, user_id, game_id, status, bet_amount, currency, payload)
      values (${id}, ${context.userId}, ${game.id}, 'open', ${data.amount}, ${data.currency}, ${JSON.stringify(payload)})
    `;
    return { roundId: id, startedAt: payload.startedAt };
  });

export const cashOutCrash = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator(z.object({ roundId: z.string() }))
  .handler(async ({ context, data }) => {
    const sql = await getSql();
    const rows = await sql<{
      id: string;
      user_id: string;
      game_id: string;
      status: string;
      bet_amount: string;
      currency: string;
      payload: string;
    }>`
      select id, user_id, game_id, status, bet_amount, currency, payload
      from game_rounds
      where id = ${data.roundId} and user_id = ${context.userId}
    `;
    const round = rows[0];
    if (!round) throw new Error("Round not found");
    if (round.status !== "open") throw new Error("Round already settled");
    const payload = JSON.parse(round.payload) as CrashPayload;
    const elapsed = Date.now() - payload.startedAt;
    const current = crashMultiplierAt(elapsed);
    const crashed = current >= payload.crashAt;
    const bet = asNumber(round.bet_amount);
    const currency = parseCurrency(round.currency);
    let payout = 0;
    let multiplier = 0;
    if (!crashed) {
      multiplier = current;
      payout = bet * current;
      await credit(context.userId, currency, payout, "win", round.game_id, "crash cash out");
    }
    await sql`
      update game_rounds set status = 'settled', payload = ${JSON.stringify({
        ...payload,
        cashedAt: current,
        crashed,
      })}
      where id = ${round.id} and user_id = ${context.userId}
    `;
    return {
      crashed,
      crashAt: payload.crashAt,
      multiplier,
      payout,
      balances: await snapshot(context.userId),
    };
  });

export const peekCrash = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator(z.object({ roundId: z.string() }))
  .handler(async ({ context, data }) => {
    const sql = await getSql();
    const rows = await sql<{ payload: string; status: string }>`
      select payload, status from game_rounds
      where id = ${data.roundId} and user_id = ${context.userId}
    `;
    const round = rows[0];
    if (!round) throw new Error("Round not found");
    const payload = JSON.parse(round.payload) as CrashPayload;
    const elapsed = Date.now() - payload.startedAt;
    const current = crashMultiplierAt(elapsed);
    if (current >= payload.crashAt) {
      if (round.status === "open") {
        await sql`
          update game_rounds set status = 'settled'
          where id = ${data.roundId} and user_id = ${context.userId} and status = 'open'
        `;
      }
      return { crashed: true, crashAt: payload.crashAt };
    }
    return { crashed: false, crashAt: null };
  });

type MinesPayload = {
  mines: number[];
  revealed: number[];
  mineCount: number;
  size: number;
};

function minesMultiplier(revealed: number, mineCount: number, size: number): number {
  let m = 1;
  for (let i = 0; i < revealed; i += 1) {
    const remaining = size - i;
    const safe = remaining - mineCount;
    m *= remaining / safe;
  }
  return Math.floor(m * 0.97 * 100) / 100;
}

export const startMines = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator(
    z.object({
      gameId: z.string(),
      currency: currencySchema,
      amount: z.number().positive(),
      mineCount: z.number().int().min(1).max(24).optional(),
    }),
  )
  .handler(async ({ context, data }) => {
    const game = getGame(data.gameId);
    if (!game || game.kind !== "mines") throw new Error("Not a mines game");
    assertBet(data.currency, data.amount);
    await ensureWallets(context.userId);
    await debit(context.userId, data.currency, data.amount, "bet", game.id, game.title);
    const size = 25;
    const mineCount = data.mineCount ?? 3;
    const fair = await takeFair(context.userId, 32);
    const mines: number[] = [];
    let i = 0;
    while (mines.length < mineCount && i < fair.floats.length * 4) {
      const n = pickIndex((fair.floats[i % fair.floats.length]! + i * 0.17) % 1, size);
      i += 1;
      if (!mines.includes(n)) mines.push(n);
    }
    const payload: MinesPayload = { mines, revealed: [], mineCount, size };
    const id = newRoundId();
    const sql = await getSql();
    await sql`
      insert into game_rounds (id, user_id, game_id, status, bet_amount, currency, payload)
      values (${id}, ${context.userId}, ${game.id}, 'open', ${data.amount}, ${data.currency}, ${JSON.stringify(payload)})
    `;
    return { roundId: id, size, mineCount };
  });

export const revealMine = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator(z.object({ roundId: z.string(), index: z.number().int().min(0).max(24) }))
  .handler(async ({ context, data }) => {
    const sql = await getSql();
    const rows = await sql<{
      payload: string;
      status: string;
      bet_amount: string;
      currency: string;
      game_id: string;
    }>`
      select payload, status, bet_amount, currency, game_id
      from game_rounds
      where id = ${data.roundId} and user_id = ${context.userId}
    `;
    const round = rows[0];
    if (!round || round.status !== "open") throw new Error("Round not open");
    const payload = JSON.parse(round.payload) as MinesPayload;
    if (payload.revealed.includes(data.index)) {
      return { hit: false, revealed: payload.revealed, multiplier: minesMultiplier(payload.revealed.length, payload.mineCount, payload.size), boom: false, mines: null };
    }
    const hit = payload.mines.includes(data.index);
    if (hit) {
      await sql`
        update game_rounds set status = 'settled', payload = ${JSON.stringify({
          ...payload,
          revealed: [...payload.revealed, data.index],
        })}
        where id = ${data.roundId} and user_id = ${context.userId}
      `;
      return {
        hit: true,
        boom: true,
        revealed: [...payload.revealed, data.index],
        mines: payload.mines,
        multiplier: 0,
        payout: 0,
        balances: await snapshot(context.userId),
      };
    }
    payload.revealed.push(data.index);
    const multiplier = minesMultiplier(payload.revealed.length, payload.mineCount, payload.size);
    await sql`
      update game_rounds set payload = ${JSON.stringify(payload)}
      where id = ${data.roundId} and user_id = ${context.userId}
    `;
    return {
      hit: false,
      boom: false,
      revealed: payload.revealed,
      mines: null,
      multiplier,
    };
  });

export const cashOutMines = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator(z.object({ roundId: z.string() }))
  .handler(async ({ context, data }) => {
    const sql = await getSql();
    const rows = await sql<{
      payload: string;
      status: string;
      bet_amount: string;
      currency: string;
      game_id: string;
    }>`
      select payload, status, bet_amount, currency, game_id
      from game_rounds
      where id = ${data.roundId} and user_id = ${context.userId}
    `;
    const round = rows[0];
    if (!round || round.status !== "open") throw new Error("Round not open");
    const payload = JSON.parse(round.payload) as MinesPayload;
    if (payload.revealed.length === 0) throw new Error("Reveal a tile first");
    const multiplier = minesMultiplier(payload.revealed.length, payload.mineCount, payload.size);
    const payout = asNumber(round.bet_amount) * multiplier;
    await credit(
      context.userId,
      parseCurrency(round.currency),
      payout,
      "win",
      round.game_id,
      "mines cash out",
    );
    await sql`
      update game_rounds set status = 'settled', payload = ${JSON.stringify({ ...payload, cashed: true })}
      where id = ${data.roundId} and user_id = ${context.userId}
    `;
    return {
      multiplier,
      payout,
      mines: payload.mines,
      balances: await snapshot(context.userId),
    };
  });

type BjPayload = {
  shoe: PlayingCard[];
  player: PlayingCard[];
  dealer: PlayingCard[];
};

export const dealBlackjack = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator(
    z.object({
      gameId: z.string(),
      currency: currencySchema,
      amount: z.number().positive(),
    }),
  )
  .handler(async ({ context, data }) => {
    const game = getGame(data.gameId);
    if (!game || game.kind !== "blackjack") throw new Error("Not blackjack");
    assertBet(data.currency, data.amount);
    await ensureWallets(context.userId);
    await debit(context.userId, data.currency, data.amount, "bet", game.id, game.title);
    const fair = await takeFair(context.userId, 80);
    const shoe = freshShoe(4, fair.floats);
    const player = [shoe.pop()!, shoe.pop()!];
    const dealer = [shoe.pop()!, shoe.pop()!];
    const payload: BjPayload = { shoe, player, dealer };
    const id = newRoundId();
    const sql = await getSql();

    const playerBj = isBlackjack(player);
    const dealerBj = isBlackjack(dealer);
    if (playerBj || dealerBj) {
      let payout = 0;
      let outcome: "blackjack" | "lose" | "push" = "lose";
      if (playerBj && dealerBj) {
        payout = data.amount;
        outcome = "push";
      } else if (playerBj) {
        payout = data.amount * 2.5;
        outcome = "blackjack";
      }
      if (payout > 0) {
        await credit(context.userId, data.currency, payout, "win", game.id, outcome);
      }
      await sql`
        insert into game_rounds (id, user_id, game_id, status, bet_amount, currency, payload)
        values (${id}, ${context.userId}, ${game.id}, 'settled', ${data.amount}, ${data.currency}, ${JSON.stringify(payload)})
      `;
      return {
        roundId: id,
        player,
        dealer,
        status: "settled" as const,
        outcome,
        payout,
        playerTotal: handValue(player).total,
        dealerTotal: handValue(dealer).total,
        holeHidden: false,
        balances: await snapshot(context.userId),
      };
    }

    await sql`
      insert into game_rounds (id, user_id, game_id, status, bet_amount, currency, payload)
      values (${id}, ${context.userId}, ${game.id}, 'open', ${data.amount}, ${data.currency}, ${JSON.stringify(payload)})
    `;
    return {
      roundId: id,
      player,
      dealer: [dealer[0]!],
      holeHidden: true,
      status: "open" as const,
      outcome: null,
      payout: 0,
      playerTotal: handValue(player).total,
      dealerTotal: handValue([dealer[0]!]).total,
      balances: await snapshot(context.userId),
    };
  });

export const blackjackAction = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator(z.object({ roundId: z.string(), action: z.enum(["hit", "stand", "double"]) }))
  .handler(async ({ context, data }) => {
    const sql = await getSql();
    const rows = await sql<{
      payload: string;
      status: string;
      bet_amount: string;
      currency: string;
      game_id: string;
    }>`
      select payload, status, bet_amount, currency, game_id
      from game_rounds
      where id = ${data.roundId} and user_id = ${context.userId}
    `;
    const round = rows[0];
    if (!round || round.status !== "open") throw new Error("Round not open");
    const payload = JSON.parse(round.payload) as BjPayload;
    let bet = asNumber(round.bet_amount);
    const currency = parseCurrency(round.currency);

    const settle = async (outcome: string, payout: number) => {
      if (payout > 0) {
        await credit(context.userId, currency, payout, "win", round.game_id, outcome);
      }
      await sql`
        update game_rounds set status = 'settled', payload = ${JSON.stringify(payload)}
        where id = ${data.roundId} and user_id = ${context.userId}
      `;
      return {
        player: payload.player,
        dealer: payload.dealer,
        holeHidden: false,
        status: "settled" as const,
        outcome,
        payout,
        playerTotal: handValue(payload.player).total,
        dealerTotal: handValue(payload.dealer).total,
        balances: await snapshot(context.userId),
      };
    };

    if (data.action === "double") {
      if (payload.player.length !== 2) throw new Error("Double only on first two cards");
      await debit(context.userId, currency, bet, "bet", round.game_id, "double");
      bet *= 2;
      payload.player.push(payload.shoe.pop()!);
      await sql`
        update game_rounds set bet_amount = ${bet}, payload = ${JSON.stringify(payload)}
        where id = ${data.roundId} and user_id = ${context.userId}
      `;
      if (handValue(payload.player).total > 21) return settle("bust", 0);
    } else if (data.action === "hit") {
      payload.player.push(payload.shoe.pop()!);
      const v = handValue(payload.player).total;
      if (v > 21) return settle("bust", 0);
      await sql`
        update game_rounds set payload = ${JSON.stringify(payload)}
        where id = ${data.roundId} and user_id = ${context.userId}
      `;
      return {
        player: payload.player,
        dealer: [payload.dealer[0]!],
        holeHidden: true,
        status: "open" as const,
        outcome: null,
        payout: 0,
        playerTotal: v,
        dealerTotal: handValue([payload.dealer[0]!]).total,
        balances: await snapshot(context.userId),
      };
    }

    while (handValue(payload.dealer).total < 17) {
      payload.dealer.push(payload.shoe.pop()!);
    }
    const p = handValue(payload.player).total;
    const d = handValue(payload.dealer).total;
    if (d > 21 || p > d) return settle("win", bet * 2);
    if (p === d) return settle("push", bet);
    return settle("lose", 0);
  });

const KENO_PAY: Record<number, number[]> = {
  1: [0, 3.8],
  2: [0, 1.8, 4.6],
  3: [0, 1, 3, 10],
  4: [0, 0.7, 1.8, 5, 22],
  5: [0, 0.4, 1.4, 3.2, 12, 48],
  6: [0, 0, 1.1, 2.4, 8, 28, 90],
  7: [0, 0, 0.8, 1.8, 5, 16, 50, 200],
  8: [0, 0, 0.5, 1.4, 3.5, 10, 30, 100, 400],
  9: [0, 0, 0.4, 1.1, 2.5, 7, 20, 60, 250, 800],
  10: [0, 0, 0.3, 0.9, 2, 5, 14, 40, 150, 500, 1200],
};

const RISK_MULT = { classic: 1, low: 0.7, normie: 1.25, degen: 1.7 } as const;

function drawUnique(count: number, max: number): number[] {
  const out: number[] = [];
  while (out.length < count) {
    const n = 1 + Math.floor(Math.random() * max);
    if (!out.includes(n)) out.push(n);
  }
  return out;
}

export const playKeno = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator(
    z.object({
      gameId: z.string(),
      currency: currencySchema,
      amount: z.number().positive(),
      picks: z.array(z.number().int().min(1).max(40)).min(1).max(10),
      risk: z.enum(["classic", "low", "normie", "degen"]),
    }),
  )
  .handler(async ({ context, data }) => {
    const game = getGame(data.gameId);
    if (!game || game.kind !== "keno") throw new Error("Not keno");
    const picks = [...new Set(data.picks)];
    if (picks.length < 1 || picks.length > 10) throw new Error("Pick 1–10 numbers");
    assertBet(data.currency, data.amount);
    await ensureWallets(context.userId);
    await debit(context.userId, data.currency, data.amount, "bet", game.id, game.title);
    const fair = await takeFair(context.userId, 16);
    const drawn = uniquePicks(fair.floats, 10, 40);
    const hits = picks.filter((n) => drawn.includes(n)).length;
    const table = KENO_PAY[picks.length] ?? [0];
    const base = table[hits] ?? 0;
    const multiplier = base * RISK_MULT[data.risk];
    const payout = data.amount * multiplier;
    if (payout > 0) {
      await credit(context.userId, data.currency, payout, "win", game.id, game.title);
    }
    return { drawn, hits, multiplier, payout, balances: await snapshot(context.userId) };
  });

type HiloCard = { rank: number; suit: "♠" | "♥" | "♦" | "♣" };
const HILO_SUITS: HiloCard["suit"][] = ["♠", "♥", "♦", "♣"];

function readPayload<T>(raw: unknown): T {
  if (typeof raw === "string") return JSON.parse(raw) as T;
  return raw as T;
}

function drawHilo(u0: number, u1: number): HiloCard {
  return {
    rank: 1 + pickIndex(u0, 13),
    suit: HILO_SUITS[pickIndex(u1, 4)]!,
  };
}

export const startHilo = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator(z.object({ gameId: z.string() }))
  .handler(async ({ context, data }) => {
    const game = getGame(data.gameId);
    if (!game || game.kind !== "hilo") throw new Error("Not hi-lo");
    const fair = await takeFair(context.userId, 2);
    const card = drawHilo(fair.floats[0]!, fair.floats[1]!);
    const id = newRoundId();
    const sql = await getSql();
    await sql`
      insert into game_rounds (id, user_id, game_id, status, bet_amount, currency, payload)
      values (${id}, ${context.userId}, ${game.id}, 'open', ${0}, ${"USDT"}, ${JSON.stringify({ card })})
    `;
    return { roundId: id, card };
  });

export const playHilo = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator(
    z.object({
      roundId: z.string(),
      currency: currencySchema,
      amount: z.number().positive(),
      pick: z.enum(["higher", "lower"]),
    }),
  )
  .handler(async ({ context, data }) => {
    const sql = await getSql();
    const rows = await sql<{ payload: string; status: string; game_id: string }>`
      select payload, status, game_id from game_rounds
      where id = ${data.roundId} and user_id = ${context.userId}
    `;
    const round = rows[0];
    if (!round || round.status !== "open") throw new Error("Round not open");
    const payload = readPayload<HiloPayload>(round.payload);
    if (!payload?.card) throw new Error("No card in play");
    const current = payload.card;
    if (!payload.live) {
      assertBet(data.currency, data.amount);
      await ensureWallets(context.userId);
      await debit(context.userId, data.currency, data.amount, "bet", round.game_id, "hilo");
      payload.live = true;
      payload.amount = data.amount;
      payload.currency = data.currency;
      payload.multiplier = 1;
    }
    const fair = await takeFair(context.userId, 2);
    const next = drawHilo(fair.floats[0]!, fair.floats[1]!);
    const win =
      data.pick === "higher" ? next.rank >= current.rank : next.rank <= current.rank;
    const p = data.pick === "higher" ? (14 - current.rank) / 13 : current.rank / 13;
    const step = 0.99 / p;
    if (win) {
      payload.multiplier = (payload.multiplier ?? 1) * step;
      payload.card = next;
    } else {
      payload.live = false;
      payload.multiplier = 0;
      payload.card = next;
    }
    await sql`
      update game_rounds
      set payload = ${JSON.stringify(payload)}, bet_amount = ${payload.amount ?? data.amount}, currency = ${payload.currency ?? data.currency}
      where id = ${data.roundId} and user_id = ${context.userId}
    `;
    return {
      previous: current,
      card: next,
      win,
      live: Boolean(payload.live),
      multiplier: payload.multiplier ?? 0,
      payout: 0,
      step,
      balances: await snapshot(context.userId),
    };
  });

type HiloPayload = {
  card: HiloCard;
  live?: boolean;
  amount?: number;
  currency?: Currency;
  multiplier?: number;
};

export const cashOutHilo = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator(z.object({ roundId: z.string() }))
  .handler(async ({ context, data }) => {
    const sql = await getSql();
    const rows = await sql<{ payload: string; status: string; game_id: string; bet_amount: string; currency: string }>`
      select payload, status, game_id, bet_amount, currency from game_rounds
      where id = ${data.roundId} and user_id = ${context.userId}
    `;
    const round = rows[0];
    if (!round || round.status !== "open") throw new Error("Round not open");
    const payload = readPayload<HiloPayload>(round.payload);
    if (!payload.live) throw new Error("Nothing to cash out");
    const multiplier = payload.multiplier ?? 1;
    const amount = payload.amount ?? asNumber(round.bet_amount);
    const currency = payload.currency ?? parseCurrency(round.currency);
    const payout = amount * multiplier;
    if (payout > 0) {
      await credit(context.userId, currency, payout, "win", round.game_id, "hilo cash out");
    }
    payload.live = false;
    payload.multiplier = 1;
    await sql`
      update game_rounds set payload = ${JSON.stringify(payload)}
      where id = ${data.roundId} and user_id = ${context.userId}
    `;
    return { payout, multiplier, card: payload.card, balances: await snapshot(context.userId) };
  });

export const playPool = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator(
    z.object({
      gameId: z.string(),
      currency: currencySchema,
      amount: z.number().positive(),
      difficulty: z.enum(["beginner", "intermediate", "expert", "pro"]),
      power: z.number().min(0).max(1),
      aim: z.number(),
    }),
  )
  .handler(async ({ context, data }) => {
    const game = getGame(data.gameId);
    if (!game || game.kind !== "pool") throw new Error("Not pool");
    assertBet(data.currency, data.amount);
    await ensureWallets(context.userId);
    await debit(context.userId, data.currency, data.amount, "bet", game.id, game.title);
    const fair = await takeFair(context.userId, 32);
    const sim = simulateBreak({
      power: data.power,
      aimDeg: data.aim,
      floats: fair.floats,
      difficulty: data.difficulty as PoolDiff,
    });
    const multiplier = poolMultiplier(sim.balls, sim.scratch);
    const payout = data.amount * multiplier;
    if (payout > 0) {
      await credit(context.userId, data.currency, payout, "win", game.id, game.title);
    }
    return {
      balls: sim.balls,
      pocketed: sim.pocketed,
      scratch: sim.scratch,
      multiplier,
      payout,
      floats: fair.floats,
      fair: { serverHash: fair.serverHash, clientSeed: fair.clientSeed, nonce: fair.nonce },
      balances: await snapshot(context.userId),
    };
  });

export type GameWinRow = {
  id: number;
  user: string;
  payout: number;
  currency: Currency;
  multiplier: number | null;
};

export const listGameWins = createServerFn({ method: "GET" })
  .validator(
    z.object({
      gameId: z.string(),
      window: z.enum(["24h", "7d", "30d"]),
      sort: z.enum(["luckiest", "highest"]),
    }),
  )
  .handler(async ({ data }): Promise<GameWinRow[]> => {
    const sql = await getSql();
    const interval =
      data.window === "24h" ? "24 hours" : data.window === "7d" ? "7 days" : "30 days";
    const rows = await sql<{
      id: number;
      amount: string;
      currency: string;
      user_id: string;
      name: string | null;
    }>`
      select t.id, t.amount, t.currency, t.user_id, u.name
      from transactions t
      left join "user" u on u.id = t.user_id
      where t.type = 'win'
        and t.game_id = ${data.gameId}
        and t.created_at > now() - ${interval}::interval
      order by t.amount desc
      limit 10
    `;
    return rows.map((r) => ({
      id: r.id,
      user: r.name?.trim() || r.user_id.slice(0, 8),
      payout: asNumber(r.amount),
      currency: parseCurrency(r.currency),
      multiplier: null,
    }));
  });


