//#region node_modules/.nitro/vite/services/ssr/assets/rng-B_Y3TIj7.js
/** House-edge crash point, Bustabit-style. Instant 1.00x with probability = edge. */
function crashPoint(edge = .04) {
	const r = Math.random();
	if (r < edge) return 1;
	const raw = (1 - edge) / (1 - r);
	return Math.max(1, Math.floor(raw * 100) / 100);
}
var CRASH_GROWTH = .08;
function crashMultiplierAt(elapsedMs) {
	const t = Math.max(0, elapsedMs) / 1e3;
	return Math.floor(100 * Math.exp(CRASH_GROWTH * t)) / 100;
}
function newRoundId() {
	if (typeof crypto !== "undefined" && "randomUUID" in crypto) return crypto.randomUUID();
	return `r_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 10)}`;
}
var ROULETTE_REDS = /* @__PURE__ */ new Set([
	1,
	3,
	5,
	7,
	9,
	12,
	14,
	16,
	18,
	19,
	21,
	23,
	25,
	27,
	30,
	32,
	34,
	36
]);
function rouletteColor(n) {
	if (n === 0) return "green";
	return ROULETTE_REDS.has(n) ? "red" : "black";
}
var SLOT_SYMBOLS = [
	"7",
	"BAR",
	"A",
	"K",
	"Q",
	"J",
	"◆"
];
var SLOT_WEIGHTS = [
	4,
	6,
	10,
	12,
	14,
	16,
	18
];
function spinReel() {
	const total = SLOT_WEIGHTS.reduce((a, b) => a + b, 0);
	let r = Math.random() * total;
	for (let i = 0; i < SLOT_SYMBOLS.length; i += 1) {
		r -= SLOT_WEIGHTS[i];
		if (r <= 0) return SLOT_SYMBOLS[i];
	}
	return SLOT_SYMBOLS[SLOT_SYMBOLS.length - 1];
}
function slotsPayout(reels, bet) {
	const [a, b, c] = reels;
	if (a === b && b === c) {
		if (a === "7") return bet * 25;
		if (a === "BAR") return bet * 12;
		if (a === "◆") return bet * 8;
		return bet * 5;
	}
	if (a === b || b === c || a === c) return bet * 1.5;
	return 0;
}
var RANKS = [
	"A",
	"2",
	"3",
	"4",
	"5",
	"6",
	"7",
	"8",
	"9",
	"10",
	"J",
	"Q",
	"K"
];
var SUITS = [
	"♠",
	"♥",
	"♦",
	"♣"
];
function freshShoe(decks = 6) {
	const cards = [];
	for (let d = 0; d < decks; d += 1) for (const suit of SUITS) for (const rank of RANKS) cards.push({
		rank,
		suit
	});
	for (let i = cards.length - 1; i > 0; i -= 1) {
		const j = Math.floor(Math.random() * (i + 1));
		const tmp = cards[i];
		cards[i] = cards[j];
		cards[j] = tmp;
	}
	return cards;
}
function handValue(cards) {
	let total = 0;
	let aces = 0;
	for (const c of cards) if (c.rank === "A") {
		aces += 1;
		total += 11;
	} else if (c.rank === "K" || c.rank === "Q" || c.rank === "J") total += 10;
	else total += Number(c.rank);
	while (total > 21 && aces > 0) {
		total -= 10;
		aces -= 1;
	}
	return {
		total,
		soft: aces > 0
	};
}
function isBlackjack(cards) {
	return cards.length === 2 && handValue(cards).total === 21;
}
//#endregion
export { isBlackjack as a, slotsPayout as c, handValue as i, spinReel as l, crashPoint as n, newRoundId as o, freshShoe as r, rouletteColor as s, crashMultiplierAt as t };
