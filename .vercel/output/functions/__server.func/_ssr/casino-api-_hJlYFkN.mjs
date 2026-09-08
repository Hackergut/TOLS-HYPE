import { c as STARTING_BALANCES, n as CURRENCIES, r as CURRENCY_META, u as getGame } from "./games-catalog-kDIyglwq.mjs";
import { i as TSS_SERVER_FUNCTION, r as createServerFn } from "./ssr.mjs";
import { n as authMiddleware, t as asNumber } from "./format-RUsy5oTU.mjs";
import { D as _enum, F as object, P as number, R as string, k as array } from "../_libs/@better-auth/core+[...].mjs";
import { r as getSql } from "./db-DmPnRDtJ.mjs";
import { a as isBlackjack, c as slotsPayout, i as handValue, l as spinReel, n as crashPoint, o as newRoundId, r as freshShoe, s as rouletteColor, t as crashMultiplierAt } from "./rng-B_Y3TIj7.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/casino-api-_hJlYFkN.js
var createServerRpc = (serverFnMeta, splitImportFn) => {
	const url = "/_serverFn/" + serverFnMeta.id;
	return Object.assign(splitImportFn, {
		url,
		serverFnMeta,
		[TSS_SERVER_FUNCTION]: true
	});
};
var currencySchema = _enum(CURRENCIES);
function parseCurrency(value) {
	if (CURRENCIES.includes(value)) return value;
	return "USDT";
}
async function ensureWallets(userId) {
	const sql = await getSql();
	for (const currency of CURRENCIES) await sql`
      insert into wallets (user_id, currency, balance)
      values (${userId}, ${currency}, ${STARTING_BALANCES[currency]})
      on conflict (user_id, currency) do nothing
    `;
}
async function debit(userId, currency, amount, type, gameId, note) {
	const sql = await getSql();
	const updated = await sql`
    update wallets
    set balance = balance - ${amount}
    where user_id = ${userId}
      and currency = ${currency}
      and balance >= ${amount}
    returning balance
  `;
	if (!updated[0]) throw new Error("Insufficient balance");
	await sql`
    insert into transactions (user_id, type, amount, currency, game_id, note)
    values (${userId}, ${type}, ${amount}, ${currency}, ${gameId ?? null}, ${note ?? null})
  `;
	return asNumber(updated[0].balance);
}
async function credit(userId, currency, amount, type, gameId, note) {
	const sql = await getSql();
	const updated = await sql`
    update wallets
    set balance = balance + ${amount}
    where user_id = ${userId} and currency = ${currency}
    returning balance
  `;
	if (!updated[0]) throw new Error("Wallet missing");
	if (amount > 0) await sql`
      insert into transactions (user_id, type, amount, currency, game_id, note)
      values (${userId}, ${type}, ${amount}, ${currency}, ${gameId ?? null}, ${note ?? null})
    `;
	return asNumber(updated[0].balance);
}
var getWallet_createServerFn_handler = createServerRpc({
	id: "dd28cfe795d1dbefb28f361d43d3a93d1841bbe513d4afba8eb4354ffa6034fe",
	name: "getWallet",
	filename: "src/lib/casino-api.ts"
}, (opts) => getWallet.__executeServer(opts));
var getWallet = createServerFn({ method: "GET" }).middleware([authMiddleware]).handler(getWallet_createServerFn_handler, async ({ context }) => {
	await ensureWallets(context.userId);
	const sql = await getSql();
	const rows = await sql`
      select currency, balance from wallets where user_id = ${context.userId}
    `;
	const balances = {
		USDT: 0,
		BTC: 0,
		ETH: 0
	};
	for (const row of rows) balances[parseCurrency(row.currency)] = asNumber(row.balance);
	const tx = await sql`
      select id, type, amount, currency, status, game_id, note, created_at
      from transactions
      where user_id = ${context.userId}
      order by created_at desc
      limit 40
    `;
	const wageredRows = await sql`
      select coalesce(sum(amount), 0) as total
      from transactions
      where user_id = ${context.userId} and type = 'bet' and currency = 'USDT'
    `;
	return {
		balances,
		wagered: asNumber(wageredRows[0]?.total),
		transactions: tx.map((t) => ({
			id: t.id,
			type: t.type,
			amount: asNumber(t.amount),
			currency: parseCurrency(t.currency),
			status: t.status,
			gameId: t.game_id,
			note: t.note,
			createdAt: t.created_at
		}))
	};
});
var cashier_createServerFn_handler = createServerRpc({
	id: "93e3a52548e5d8428a36bc2c7e061a63bf2af542df1c6e23634800531e04d885",
	name: "cashier",
	filename: "src/lib/casino-api.ts"
}, (opts) => cashier.__executeServer(opts));
var cashier = createServerFn({ method: "POST" }).middleware([authMiddleware]).validator(object({
	action: _enum(["deposit", "withdraw"]),
	currency: currencySchema,
	amount: number().positive()
})).handler(cashier_createServerFn_handler, async ({ context, data }) => {
	await ensureWallets(context.userId);
	const cap = data.currency === "USDT" ? 5e3 : data.currency === "ETH" ? 5 : .5;
	if (data.amount > cap) throw new Error(`Max ${data.action} is ${cap} ${data.currency}`);
	if (data.action === "deposit") await credit(context.userId, data.currency, data.amount, "deposit");
	else await debit(context.userId, data.currency, data.amount, "withdrawal");
	return { balances: await snapshot(context.userId) };
});
function assertBet(currency, amount) {
	const meta = CURRENCY_META[currency];
	if (amount < meta.minBet) throw new Error(`Minimum bet is ${meta.minBet} ${currency}`);
	if (amount > meta.maxBet) throw new Error(`Maximum bet is ${meta.maxBet} ${currency}`);
}
async function snapshot(userId) {
	const rows = await (await getSql())`
    select currency, balance from wallets where user_id = ${userId}
  `;
	const balances = {
		USDT: 0,
		BTC: 0,
		ETH: 0
	};
	for (const row of rows) balances[parseCurrency(row.currency)] = asNumber(row.balance);
	return balances;
}
var playInstant_createServerFn_handler = createServerRpc({
	id: "9d47c4f3eaba3984dbd497fee465e1f0e2a064c7e11e1b140a45fc0872cd85de",
	name: "playInstant",
	filename: "src/lib/casino-api.ts"
}, (opts) => playInstant.__executeServer(opts));
var playInstant = createServerFn({ method: "POST" }).middleware([authMiddleware]).validator(object({
	gameId: string(),
	currency: currencySchema,
	amount: number().positive(),
	choice: string().optional(),
	target: number().min(.01).max(98).optional()
})).handler(playInstant_createServerFn_handler, async ({ context, data }) => {
	const game = getGame(data.gameId);
	if (!game) throw new Error("Unknown game");
	assertBet(data.currency, data.amount);
	await ensureWallets(context.userId);
	await debit(context.userId, data.currency, data.amount, "bet", game.id, game.title);
	let payout = 0;
	let multiplier = 0;
	const detail = {};
	if (game.kind === "dice") {
		const roll = Math.floor(Math.random() * 1e4) / 100;
		const over = data.choice === "over";
		const target = data.target ?? 50;
		const chance = over ? 100 - target : target;
		const multiplierWin = 99 / Math.min(98, Math.max(1, chance));
		const win = over ? roll >= target : roll < target;
		multiplier = win ? multiplierWin : 0;
		payout = win ? data.amount * multiplierWin : 0;
		detail.roll = roll;
		detail.over = over;
	} else if (game.kind === "roulette") {
		const number = Math.floor(Math.random() * 37);
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
			const win = Number(choice) === number;
			multiplier = win ? 36 : 0;
			payout = win ? data.amount * 36 : 0;
		}
		detail.number = number;
		detail.color = color;
	} else if (game.kind === "slots") {
		const reels = [
			spinReel(),
			spinReel(),
			spinReel()
		];
		payout = slotsPayout(reels, data.amount);
		multiplier = payout > 0 ? payout / data.amount : 0;
		detail.reels = reels;
	} else if (game.kind === "crash") throw new Error("Use startCrash for this game");
	else if (game.kind === "blackjack") throw new Error("Use dealBlackjack for this game");
	else if (game.kind === "mines" || game.kind === "keno" || game.kind === "hilo") throw new Error("Use the dedicated play function for this game");
	if (payout > 0) await credit(context.userId, data.currency, payout, "win", game.id, game.title);
	return {
		payout,
		multiplier,
		detail,
		balances: await snapshot(context.userId)
	};
});
var placeSportBet_createServerFn_handler = createServerRpc({
	id: "ca51cf478f03db9c49032bafe31be930e6576575c2f21f5fb4b9a27dcd517233",
	name: "placeSportBet",
	filename: "src/lib/casino-api.ts"
}, (opts) => placeSportBet.__executeServer(opts));
var placeSportBet = createServerFn({ method: "POST" }).middleware([authMiddleware]).validator(object({
	eventId: string(),
	side: _enum(["home", "away"]),
	odds: number().positive(),
	amount: number().positive(),
	currency: currencySchema
})).handler(placeSportBet_createServerFn_handler, async ({ context, data }) => {
	assertBet(data.currency, data.amount);
	await ensureWallets(context.userId);
	await debit(context.userId, data.currency, data.amount, "bet", data.eventId, "sports");
	const win = Math.random() < 1 / data.odds - .04;
	const payout = win ? data.amount * data.odds : 0;
	if (payout > 0) await credit(context.userId, data.currency, payout, "win", data.eventId, "sports");
	return {
		win,
		payout,
		balances: await snapshot(context.userId)
	};
});
var startCrash_createServerFn_handler = createServerRpc({
	id: "1504078ce54c1d717a1029fd8a375985efa2b3618fc3978b5d9a388b22c8065e",
	name: "startCrash",
	filename: "src/lib/casino-api.ts"
}, (opts) => startCrash.__executeServer(opts));
var startCrash = createServerFn({ method: "POST" }).middleware([authMiddleware]).validator(object({
	gameId: string(),
	currency: currencySchema,
	amount: number().positive()
})).handler(startCrash_createServerFn_handler, async ({ context, data }) => {
	const game = getGame(data.gameId);
	if (!game || game.kind !== "crash") throw new Error("Not a crash game");
	assertBet(data.currency, data.amount);
	await ensureWallets(context.userId);
	await debit(context.userId, data.currency, data.amount, "bet", game.id, game.title);
	const id = newRoundId();
	const payload = {
		crashAt: crashPoint(game.edge),
		startedAt: Date.now()
	};
	await (await getSql())`
      insert into game_rounds (id, user_id, game_id, status, bet_amount, currency, payload)
      values (${id}, ${context.userId}, ${game.id}, 'open', ${data.amount}, ${data.currency}, ${JSON.stringify(payload)})
    `;
	return {
		roundId: id,
		startedAt: payload.startedAt
	};
});
var cashOutCrash_createServerFn_handler = createServerRpc({
	id: "df55947c78642a56fd011a5d62b399f03ec332905f91c84906979f11879096e1",
	name: "cashOutCrash",
	filename: "src/lib/casino-api.ts"
}, (opts) => cashOutCrash.__executeServer(opts));
var cashOutCrash = createServerFn({ method: "POST" }).middleware([authMiddleware]).validator(object({ roundId: string() })).handler(cashOutCrash_createServerFn_handler, async ({ context, data }) => {
	const sql = await getSql();
	const round = (await sql`
      select id, user_id, game_id, status, bet_amount, currency, payload
      from game_rounds
      where id = ${data.roundId} and user_id = ${context.userId}
    `)[0];
	if (!round) throw new Error("Round not found");
	if (round.status !== "open") throw new Error("Round already settled");
	const payload = JSON.parse(round.payload);
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
		crashed
	})}
      where id = ${round.id} and user_id = ${context.userId}
    `;
	return {
		crashed,
		crashAt: payload.crashAt,
		multiplier,
		payout,
		balances: await snapshot(context.userId)
	};
});
var peekCrash_createServerFn_handler = createServerRpc({
	id: "faee627521a3bc42526668ee48da04eb79d9d7143781ed9d67318bb914556fa7",
	name: "peekCrash",
	filename: "src/lib/casino-api.ts"
}, (opts) => peekCrash.__executeServer(opts));
var peekCrash = createServerFn({ method: "POST" }).middleware([authMiddleware]).validator(object({ roundId: string() })).handler(peekCrash_createServerFn_handler, async ({ context, data }) => {
	const sql = await getSql();
	const round = (await sql`
      select payload, status from game_rounds
      where id = ${data.roundId} and user_id = ${context.userId}
    `)[0];
	if (!round) throw new Error("Round not found");
	const payload = JSON.parse(round.payload);
	const elapsed = Date.now() - payload.startedAt;
	if (crashMultiplierAt(elapsed) >= payload.crashAt) {
		if (round.status === "open") await sql`
          update game_rounds set status = 'settled'
          where id = ${data.roundId} and user_id = ${context.userId} and status = 'open'
        `;
		return {
			crashed: true,
			crashAt: payload.crashAt
		};
	}
	return {
		crashed: false,
		crashAt: null
	};
});
function minesMultiplier(revealed, mineCount, size) {
	let m = 1;
	for (let i = 0; i < revealed; i += 1) {
		const remaining = size - i;
		const safe = remaining - mineCount;
		m *= remaining / safe;
	}
	return Math.floor(m * .97 * 100) / 100;
}
var startMines_createServerFn_handler = createServerRpc({
	id: "f71d555fa0d442092cda5cc44942511c5f677f6ec581470d49dbddcb1aeed965",
	name: "startMines",
	filename: "src/lib/casino-api.ts"
}, (opts) => startMines.__executeServer(opts));
var startMines = createServerFn({ method: "POST" }).middleware([authMiddleware]).validator(object({
	gameId: string(),
	currency: currencySchema,
	amount: number().positive(),
	mineCount: number().int().min(1).max(24).optional()
})).handler(startMines_createServerFn_handler, async ({ context, data }) => {
	const game = getGame(data.gameId);
	if (!game || game.kind !== "mines") throw new Error("Not a mines game");
	assertBet(data.currency, data.amount);
	await ensureWallets(context.userId);
	await debit(context.userId, data.currency, data.amount, "bet", game.id, game.title);
	const size = 25;
	const mineCount = data.mineCount ?? 3;
	const mines = [];
	while (mines.length < mineCount) {
		const n = Math.floor(Math.random() * size);
		if (!mines.includes(n)) mines.push(n);
	}
	const payload = {
		mines,
		revealed: [],
		mineCount,
		size
	};
	const id = newRoundId();
	await (await getSql())`
      insert into game_rounds (id, user_id, game_id, status, bet_amount, currency, payload)
      values (${id}, ${context.userId}, ${game.id}, 'open', ${data.amount}, ${data.currency}, ${JSON.stringify(payload)})
    `;
	return {
		roundId: id,
		size,
		mineCount
	};
});
var revealMine_createServerFn_handler = createServerRpc({
	id: "9a71d3ebeda9d01fe68123d22413cc35c6d64b6acb712bf4d425bff5d360d7e2",
	name: "revealMine",
	filename: "src/lib/casino-api.ts"
}, (opts) => revealMine.__executeServer(opts));
var revealMine = createServerFn({ method: "POST" }).middleware([authMiddleware]).validator(object({
	roundId: string(),
	index: number().int().min(0).max(24)
})).handler(revealMine_createServerFn_handler, async ({ context, data }) => {
	const sql = await getSql();
	const round = (await sql`
      select payload, status, bet_amount, currency, game_id
      from game_rounds
      where id = ${data.roundId} and user_id = ${context.userId}
    `)[0];
	if (!round || round.status !== "open") throw new Error("Round not open");
	const payload = JSON.parse(round.payload);
	if (payload.revealed.includes(data.index)) return {
		hit: false,
		revealed: payload.revealed,
		multiplier: minesMultiplier(payload.revealed.length, payload.mineCount, payload.size),
		boom: false,
		mines: null
	};
	if (payload.mines.includes(data.index)) {
		await sql`
        update game_rounds set status = 'settled', payload = ${JSON.stringify({
			...payload,
			revealed: [...payload.revealed, data.index]
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
			balances: await snapshot(context.userId)
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
		multiplier
	};
});
var cashOutMines_createServerFn_handler = createServerRpc({
	id: "c7be0a6d740a409207a2efd1559b8c4bdf27db530fdfa244fc726e0158bddcd7",
	name: "cashOutMines",
	filename: "src/lib/casino-api.ts"
}, (opts) => cashOutMines.__executeServer(opts));
var cashOutMines = createServerFn({ method: "POST" }).middleware([authMiddleware]).validator(object({ roundId: string() })).handler(cashOutMines_createServerFn_handler, async ({ context, data }) => {
	const sql = await getSql();
	const round = (await sql`
      select payload, status, bet_amount, currency, game_id
      from game_rounds
      where id = ${data.roundId} and user_id = ${context.userId}
    `)[0];
	if (!round || round.status !== "open") throw new Error("Round not open");
	const payload = JSON.parse(round.payload);
	if (payload.revealed.length === 0) throw new Error("Reveal a tile first");
	const multiplier = minesMultiplier(payload.revealed.length, payload.mineCount, payload.size);
	const payout = asNumber(round.bet_amount) * multiplier;
	await credit(context.userId, parseCurrency(round.currency), payout, "win", round.game_id, "mines cash out");
	await sql`
      update game_rounds set status = 'settled', payload = ${JSON.stringify({
		...payload,
		cashed: true
	})}
      where id = ${data.roundId} and user_id = ${context.userId}
    `;
	return {
		multiplier,
		payout,
		mines: payload.mines,
		balances: await snapshot(context.userId)
	};
});
var dealBlackjack_createServerFn_handler = createServerRpc({
	id: "f1649fd2349f64636824abb3ad298c9bc2bd70dc3378067bd3922e8fb88ae8cd",
	name: "dealBlackjack",
	filename: "src/lib/casino-api.ts"
}, (opts) => dealBlackjack.__executeServer(opts));
var dealBlackjack = createServerFn({ method: "POST" }).middleware([authMiddleware]).validator(object({
	gameId: string(),
	currency: currencySchema,
	amount: number().positive()
})).handler(dealBlackjack_createServerFn_handler, async ({ context, data }) => {
	const game = getGame(data.gameId);
	if (!game || game.kind !== "blackjack") throw new Error("Not blackjack");
	assertBet(data.currency, data.amount);
	await ensureWallets(context.userId);
	await debit(context.userId, data.currency, data.amount, "bet", game.id, game.title);
	const shoe = freshShoe(4);
	const player = [shoe.pop(), shoe.pop()];
	const dealer = [shoe.pop(), shoe.pop()];
	const payload = {
		shoe,
		player,
		dealer
	};
	const id = newRoundId();
	const sql = await getSql();
	const playerBj = isBlackjack(player);
	const dealerBj = isBlackjack(dealer);
	if (playerBj || dealerBj) {
		let payout = 0;
		let outcome = "lose";
		if (playerBj && dealerBj) {
			payout = data.amount;
			outcome = "push";
		} else if (playerBj) {
			payout = data.amount * 2.5;
			outcome = "blackjack";
		}
		if (payout > 0) await credit(context.userId, data.currency, payout, "win", game.id, outcome);
		await sql`
        insert into game_rounds (id, user_id, game_id, status, bet_amount, currency, payload)
        values (${id}, ${context.userId}, ${game.id}, 'settled', ${data.amount}, ${data.currency}, ${JSON.stringify(payload)})
      `;
		return {
			roundId: id,
			player,
			dealer,
			status: "settled",
			outcome,
			payout,
			playerTotal: handValue(player).total,
			dealerTotal: handValue(dealer).total,
			holeHidden: false,
			balances: await snapshot(context.userId)
		};
	}
	await sql`
      insert into game_rounds (id, user_id, game_id, status, bet_amount, currency, payload)
      values (${id}, ${context.userId}, ${game.id}, 'open', ${data.amount}, ${data.currency}, ${JSON.stringify(payload)})
    `;
	return {
		roundId: id,
		player,
		dealer: [dealer[0]],
		holeHidden: true,
		status: "open",
		outcome: null,
		payout: 0,
		playerTotal: handValue(player).total,
		dealerTotal: handValue([dealer[0]]).total,
		balances: await snapshot(context.userId)
	};
});
var blackjackAction_createServerFn_handler = createServerRpc({
	id: "4201008c36c3d839411dceb4863018a797c6adf0c4a186053710ca7501372c41",
	name: "blackjackAction",
	filename: "src/lib/casino-api.ts"
}, (opts) => blackjackAction.__executeServer(opts));
var blackjackAction = createServerFn({ method: "POST" }).middleware([authMiddleware]).validator(object({
	roundId: string(),
	action: _enum([
		"hit",
		"stand",
		"double"
	])
})).handler(blackjackAction_createServerFn_handler, async ({ context, data }) => {
	const sql = await getSql();
	const round = (await sql`
      select payload, status, bet_amount, currency, game_id
      from game_rounds
      where id = ${data.roundId} and user_id = ${context.userId}
    `)[0];
	if (!round || round.status !== "open") throw new Error("Round not open");
	const payload = JSON.parse(round.payload);
	let bet = asNumber(round.bet_amount);
	const currency = parseCurrency(round.currency);
	const settle = async (outcome, payout) => {
		if (payout > 0) await credit(context.userId, currency, payout, "win", round.game_id, outcome);
		await sql`
        update game_rounds set status = 'settled', payload = ${JSON.stringify(payload)}
        where id = ${data.roundId} and user_id = ${context.userId}
      `;
		return {
			player: payload.player,
			dealer: payload.dealer,
			holeHidden: false,
			status: "settled",
			outcome,
			payout,
			playerTotal: handValue(payload.player).total,
			dealerTotal: handValue(payload.dealer).total,
			balances: await snapshot(context.userId)
		};
	};
	if (data.action === "double") {
		if (payload.player.length !== 2) throw new Error("Double only on first two cards");
		await debit(context.userId, currency, bet, "bet", round.game_id, "double");
		bet *= 2;
		payload.player.push(payload.shoe.pop());
		await sql`
        update game_rounds set bet_amount = ${bet}, payload = ${JSON.stringify(payload)}
        where id = ${data.roundId} and user_id = ${context.userId}
      `;
		if (handValue(payload.player).total > 21) return settle("bust", 0);
	} else if (data.action === "hit") {
		payload.player.push(payload.shoe.pop());
		const v = handValue(payload.player).total;
		if (v > 21) return settle("bust", 0);
		await sql`
        update game_rounds set payload = ${JSON.stringify(payload)}
        where id = ${data.roundId} and user_id = ${context.userId}
      `;
		return {
			player: payload.player,
			dealer: [payload.dealer[0]],
			holeHidden: true,
			status: "open",
			outcome: null,
			payout: 0,
			playerTotal: v,
			dealerTotal: handValue([payload.dealer[0]]).total,
			balances: await snapshot(context.userId)
		};
	}
	while (handValue(payload.dealer).total < 17) payload.dealer.push(payload.shoe.pop());
	const p = handValue(payload.player).total;
	const d = handValue(payload.dealer).total;
	if (d > 21 || p > d) return settle("win", bet * 2);
	if (p === d) return settle("push", bet);
	return settle("lose", 0);
});
var KENO_PAY = {
	1: [0, 3.8],
	2: [
		0,
		1.8,
		4.6
	],
	3: [
		0,
		1,
		3,
		10
	],
	4: [
		0,
		.7,
		1.8,
		5,
		22
	],
	5: [
		0,
		.4,
		1.4,
		3.2,
		12,
		48
	],
	6: [
		0,
		0,
		1.1,
		2.4,
		8,
		28,
		90
	],
	7: [
		0,
		0,
		.8,
		1.8,
		5,
		16,
		50,
		200
	],
	8: [
		0,
		0,
		.5,
		1.4,
		3.5,
		10,
		30,
		100,
		400
	],
	9: [
		0,
		0,
		.4,
		1.1,
		2.5,
		7,
		20,
		60,
		250,
		800
	],
	10: [
		0,
		0,
		.3,
		.9,
		2,
		5,
		14,
		40,
		150,
		500,
		1200
	]
};
var RISK_MULT = {
	classic: 1,
	low: .7,
	normie: 1.25,
	degen: 1.7
};
function drawUnique(count, max) {
	const out = [];
	while (out.length < count) {
		const n = 1 + Math.floor(Math.random() * max);
		if (!out.includes(n)) out.push(n);
	}
	return out;
}
var playKeno_createServerFn_handler = createServerRpc({
	id: "10d3709ddbe0846f809aa5f4c3f29de518d245935f37dbff1a297b21b5535791",
	name: "playKeno",
	filename: "src/lib/casino-api.ts"
}, (opts) => playKeno.__executeServer(opts));
var playKeno = createServerFn({ method: "POST" }).middleware([authMiddleware]).validator(object({
	gameId: string(),
	currency: currencySchema,
	amount: number().positive(),
	picks: array(number().int().min(1).max(40)).min(1).max(10),
	risk: _enum([
		"classic",
		"low",
		"normie",
		"degen"
	])
})).handler(playKeno_createServerFn_handler, async ({ context, data }) => {
	const game = getGame(data.gameId);
	if (!game || game.kind !== "keno") throw new Error("Not keno");
	const picks = [...new Set(data.picks)];
	if (picks.length < 1 || picks.length > 10) throw new Error("Pick 1–10 numbers");
	assertBet(data.currency, data.amount);
	await ensureWallets(context.userId);
	await debit(context.userId, data.currency, data.amount, "bet", game.id, game.title);
	const drawn = drawUnique(10, 40);
	const hits = picks.filter((n) => drawn.includes(n)).length;
	const multiplier = ((KENO_PAY[picks.length] ?? [0])[hits] ?? 0) * RISK_MULT[data.risk];
	const payout = data.amount * multiplier;
	if (payout > 0) await credit(context.userId, data.currency, payout, "win", game.id, game.title);
	return {
		drawn,
		hits,
		multiplier,
		payout,
		balances: await snapshot(context.userId)
	};
});
var HILO_SUITS = [
	"♠",
	"♥",
	"♦",
	"♣"
];
function drawHilo() {
	return {
		rank: 1 + Math.floor(Math.random() * 13),
		suit: HILO_SUITS[Math.floor(Math.random() * 4)]
	};
}
var startHilo_createServerFn_handler = createServerRpc({
	id: "75e56d5af3994a7d4d1f5d3c7338a245dc841ce84e1551b6d8540f5c6a1eaec6",
	name: "startHilo",
	filename: "src/lib/casino-api.ts"
}, (opts) => startHilo.__executeServer(opts));
var startHilo = createServerFn({ method: "POST" }).middleware([authMiddleware]).validator(object({ gameId: string() })).handler(startHilo_createServerFn_handler, async ({ context, data }) => {
	const game = getGame(data.gameId);
	if (!game || game.kind !== "hilo") throw new Error("Not hi-lo");
	const card = drawHilo();
	const id = newRoundId();
	await (await getSql())`
      insert into game_rounds (id, user_id, game_id, status, bet_amount, currency, payload)
      values (${id}, ${context.userId}, ${game.id}, 'open', ${0}, ${"USDT"}, ${JSON.stringify({ card })})
    `;
	return {
		roundId: id,
		card
	};
});
var playHilo_createServerFn_handler = createServerRpc({
	id: "976553eab12d5bdd698a9c3f4fc1f36a872c8dc2f3d37cd96c717ea4e3ab5e63",
	name: "playHilo",
	filename: "src/lib/casino-api.ts"
}, (opts) => playHilo.__executeServer(opts));
var playHilo = createServerFn({ method: "POST" }).middleware([authMiddleware]).validator(object({
	roundId: string(),
	currency: currencySchema,
	amount: number().positive(),
	pick: _enum(["higher", "lower"])
})).handler(playHilo_createServerFn_handler, async ({ context, data }) => {
	const sql = await getSql();
	const round = (await sql`
      select payload, status, game_id from game_rounds
      where id = ${data.roundId} and user_id = ${context.userId}
    `)[0];
	if (!round || round.status !== "open") throw new Error("Round not open");
	assertBet(data.currency, data.amount);
	await ensureWallets(context.userId);
	await debit(context.userId, data.currency, data.amount, "bet", round.game_id, "hilo");
	const current = JSON.parse(round.payload).card;
	const next = drawHilo();
	const pHigher = (14 - current.rank) / 13;
	const pLower = current.rank / 13;
	const p = data.pick === "higher" ? pHigher : pLower;
	const win = data.pick === "higher" ? next.rank >= current.rank : next.rank <= current.rank;
	const multiplier = win ? .99 / p : 0;
	const payout = win ? data.amount * multiplier : 0;
	if (payout > 0) await credit(context.userId, data.currency, payout, "win", round.game_id, "hilo");
	await sql`
      update game_rounds
      set payload = ${JSON.stringify({ card: next })}, bet_amount = ${data.amount}, currency = ${data.currency}
      where id = ${data.roundId} and user_id = ${context.userId}
    `;
	return {
		previous: current,
		card: next,
		win,
		multiplier,
		payout,
		pHigher,
		pLower,
		balances: await snapshot(context.userId)
	};
});
//#endregion
export { blackjackAction_createServerFn_handler, cashOutCrash_createServerFn_handler, cashOutMines_createServerFn_handler, cashier_createServerFn_handler, dealBlackjack_createServerFn_handler, getWallet_createServerFn_handler, peekCrash_createServerFn_handler, placeSportBet_createServerFn_handler, playHilo_createServerFn_handler, playInstant_createServerFn_handler, playKeno_createServerFn_handler, revealMine_createServerFn_handler, startCrash_createServerFn_handler, startHilo_createServerFn_handler, startMines_createServerFn_handler };
