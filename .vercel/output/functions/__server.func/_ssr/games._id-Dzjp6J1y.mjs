import { o as __toESM } from "../_runtime.mjs";
import { i as GAMES, r as CURRENCY_META, u as getGame } from "./games-catalog-kDIyglwq.mjs";
import { u as require_react } from "../_libs/@floating-ui/react-dom+[...].mjs";
import { c as require_jsx_runtime } from "../_libs/@radix-ui/react-arrow+[...].mjs";
import { t as Button } from "./button-BZfbrQLK.mjs";
import { v as Link } from "../_libs/@tanstack/react-router+[...].mjs";
import { t as GameGrid } from "./game-grid-9Bb752FD.mjs";
import { D as u1, T as qE, _ as dZ, l as Ov, v as h2 } from "../_libs/remixicon__react.mjs";
import { i as formatMultiplier, r as formatMoney } from "./format-RUsy5oTU.mjs";
import { n as toast } from "../_libs/sonner.mjs";
import { n as Route$1 } from "./router-BdGeUTok.mjs";
import { t as Input } from "./input-HW-MdT1M.mjs";
import { n as TolsT, r as TolsWordmark } from "./tols-mark-D9pVfDGe.mjs";
import { a as dealBlackjack, c as playHilo, d as revealMine, f as startCrash, h as useWallet, i as cashOutMines, l as playInstant, m as startMines, n as blackjackAction, o as peekCrash, p as startHilo, r as cashOutCrash, u as playKeno } from "./wallet-context-DCUk16fH.mjs";
import { i as TabsTrigger, r as TabsList, t as Tabs$1 } from "./tabs-ANMmb7YA.mjs";
import { t as crashMultiplierAt } from "./rng-B_Y3TIj7.mjs";
import { t as PlayGate } from "./play-gate-DVfXEwTk.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/games._id-Dzjp6J1y.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
function GameShell({ controls, play }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "overflow-hidden rounded-2xl bg-card shadow-[var(--shadow-glow)]",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "flex flex-col-reverse lg:grid lg:grid-cols-[280px_minmax(0,1fr)]",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("aside", {
				className: "flex flex-col-reverse gap-4 border-t border-border p-3 lg:flex-col lg:border-t-0 lg:border-r md:p-4",
				children: controls
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("section", {
				className: "flex min-h-64 w-full flex-col justify-center gap-4 p-3 md:min-h-80 md:p-6",
				children: play
			})]
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "flex items-center justify-between border-t border-border px-3 py-2 text-xs text-muted-foreground md:px-4",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "flex items-center gap-3",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Ov, { className: "size-4" }),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(qE, { className: "size-4" }),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(dZ, { className: "size-4" })
					]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TolsWordmark, { className: "h-3.5 w-auto opacity-45" }),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
					to: "/fairness",
					className: "hover:text-primary",
					children: "Provably Fair"
				})
			]
		})]
	});
}
function LimeBet({ children, disabled, onClick }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
		type: "button",
		disabled,
		onClick,
		className: "h-12 w-full rounded-lg bg-primary text-base font-semibold text-primary-foreground shadow-[var(--shadow-fab)] transition-colors hover:bg-primary/90 disabled:opacity-50",
		children
	});
}
function StakeField({ amount, setAmount, disabled, hint }) {
	const { currency, balances } = useWallet();
	const meta = CURRENCY_META[currency];
	const balance = balances[currency];
	function clampBet(n) {
		if (!Number.isFinite(n) || n < 0) return 0;
		return Math.min(meta.maxBet, n);
	}
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
		className: "grid gap-1.5",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
			className: "flex items-center justify-between text-xs text-muted-foreground",
			children: ["Bet Amount", /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
				className: "tabular-nums",
				children: hint ?? `${formatMoney(balance, currency)} ${currency}`
			})]
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "flex overflow-hidden rounded-lg border border-border bg-muted",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
					type: "number",
					min: 0,
					step: "any",
					disabled,
					value: amount,
					onChange: (e) => setAmount(clampBet(Number(e.target.value))),
					className: "h-11 flex-1 rounded-none border-0 bg-transparent tabular-nums shadow-none"
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
					type: "button",
					disabled,
					className: "h-11 border-l border-border px-3 text-xs font-semibold text-muted-foreground hover:text-foreground disabled:opacity-50",
					onClick: () => setAmount(clampBet(amount / 2)),
					children: "½"
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
					type: "button",
					disabled,
					className: "h-11 border-l border-border px-3 text-xs font-semibold text-muted-foreground hover:text-foreground disabled:opacity-50",
					onClick: () => setAmount(clampBet(Math.min(balance, amount * 2 || meta.minBet))),
					children: "2x"
				})
			]
		})]
	});
}
function FieldLabel({ label, hint, children }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
		className: "grid gap-1.5",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
			className: "flex items-center justify-between text-xs text-muted-foreground",
			children: [label, hint ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
				className: "tabular-nums",
				children: hint
			}) : null]
		}), children]
	});
}
var HILO_FACES = [
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
function FeltCard({ rank, suit, hidden, size = "md", stripe }) {
	const dim = size === "lg" ? "h-44 w-32 md:h-52 md:w-36" : size === "sm" ? "h-20 w-14" : "h-28 w-20";
	if (hidden) return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: `relative flex ${dim} items-center justify-center overflow-hidden rounded-xl bg-muted ring-1 ring-border`,
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TolsT, { className: "size-10" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: "absolute inset-x-0 bottom-0 h-1.5 bg-lime" })]
	});
	const face = typeof rank === "number" ? HILO_FACES[rank - 1] ?? String(rank) : rank;
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: `relative flex ${dim} flex-col justify-between overflow-hidden rounded-xl bg-white p-2.5 shadow-lg ${suit === "♥" || suit === "♦" ? "text-destructive" : "text-zinc-900"}`,
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "font-heading text-2xl leading-none font-bold",
				children: face
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "text-lg leading-none",
				children: suit
			})] }),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "self-end text-3xl",
				children: suit
			}),
			stripe ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: "absolute inset-x-0 bottom-0 h-1.5 bg-lime" }) : null
		]
	});
}
function FeltFromPlaying({ card, hidden, size, stripe }) {
	if (hidden || !card) return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(FeltCard, {
		hidden: true,
		size,
		stripe
	});
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(FeltCard, {
		rank: card.rank,
		suit: card.suit,
		size,
		stripe
	});
}
function BlackjackGame({ gameId }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(PlayGate, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(BlackjackTable, { gameId }) });
}
function BlackjackTable({ gameId }) {
	const { currency, applyBalances } = useWallet();
	const meta = CURRENCY_META[currency];
	const [table, setTable] = (0, import_react.useState)(null);
	const [busy, setBusy] = (0, import_react.useState)(false);
	const [amount, setAmount] = (0, import_react.useState)(meta.minBet);
	const [mode, setMode] = (0, import_react.useState)("standard");
	async function deal() {
		setBusy(true);
		try {
			const res = await dealBlackjack({ data: {
				gameId,
				currency,
				amount
			} });
			applyBalances(res.balances);
			setTable({
				roundId: res.roundId,
				player: res.player,
				dealer: res.dealer,
				holeHidden: res.holeHidden,
				status: res.status,
				outcome: res.outcome,
				payout: res.payout,
				playerTotal: res.playerTotal,
				dealerTotal: res.dealerTotal
			});
			if (res.status === "settled") toast.message(res.outcome ?? "Settled");
		} catch (err) {
			toast.error(err instanceof Error ? err.message : "Deal failed");
		} finally {
			setBusy(false);
		}
	}
	async function act(action) {
		if (!table) return;
		setBusy(true);
		try {
			const res = await blackjackAction({ data: {
				roundId: table.roundId,
				action
			} });
			applyBalances(res.balances);
			setTable({
				roundId: table.roundId,
				player: res.player,
				dealer: res.dealer,
				holeHidden: Boolean(res.holeHidden),
				status: res.status,
				outcome: res.outcome,
				payout: res.payout,
				playerTotal: res.playerTotal,
				dealerTotal: res.dealerTotal
			});
			if (res.status === "settled") {
				if (res.payout > 0) toast.success(`${res.outcome} · ${formatMoney(res.payout, currency)}`);
				else toast.message(res.outcome ?? "Lose");
			}
		} catch (err) {
			toast.error(err instanceof Error ? err.message : "Action failed");
		} finally {
			setBusy(false);
		}
	}
	const canDouble = table?.status === "open" && table.player.length === 2;
	const canSplit = table?.status === "open" && table.player.length === 2 && table.player[0]?.rank === table.player[1]?.rank;
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(GameShell, {
		controls: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Tabs$1, {
				value: mode,
				onValueChange: setMode,
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(TabsList, {
					className: "h-10 w-full rounded-lg bg-muted",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TabsTrigger, {
						value: "standard",
						className: "h-8 flex-1",
						children: "Standard"
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(TabsTrigger, {
						value: "side",
						className: "h-8 flex-1",
						children: "Side bet"
					})]
				})
			}),
			mode === "side" ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "text-xs text-muted-foreground",
				children: "Perfect pair pays 11x if your first two cards share a rank. Side bets settle with the deal."
			}) : null,
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(StakeField, {
				amount,
				setAmount,
				disabled: table?.status === "open"
			}),
			table?.status === "open" ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "grid grid-cols-2 gap-2",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
						type: "button",
						disabled: busy || !canSplit,
						className: "h-10 rounded-lg bg-muted text-sm font-medium disabled:opacity-40",
						onClick: () => toast.message("Split is available on matching ranks next drop."),
						children: "Split"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
						type: "button",
						disabled: busy || !canDouble,
						className: "h-10 rounded-lg bg-muted text-sm font-medium disabled:opacity-40",
						onClick: () => void act("double"),
						children: "Double"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
						type: "button",
						disabled: busy,
						className: "h-11 rounded-lg bg-muted text-sm font-semibold",
						onClick: () => void act("hit"),
						children: "Hit"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
						type: "button",
						disabled: busy,
						className: "h-11 rounded-lg bg-muted text-sm font-semibold",
						onClick: () => void act("stand"),
						children: "Stand"
					})
				]
			}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(LimeBet, {
				disabled: busy,
				onClick: () => void deal(),
				children: "Bet"
			})
		] }),
		play: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "flex flex-col items-center gap-10 py-4",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Hand, {
					label: table?.dealerTotal,
					cards: table?.dealer ?? [],
					hidden: Boolean(table?.holeHidden)
				}),
				table?.outcome ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "text-sm font-semibold capitalize text-lime",
					children: table.outcome
				}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "h-5" }),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Hand, {
					label: table?.playerTotal,
					cards: table?.player ?? []
				})
			]
		})
	});
}
function Hand({ label, cards, hidden }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "flex flex-col items-center gap-3",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "flex items-end gap-2",
			children: [cards.length === 0 && !hidden ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "h-28 w-20 rounded-xl bg-tile" }) : cards.map((c, i) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(FeltFromPlaying, {
				card: c,
				size: "md"
			}, `${c.rank}${c.suit}${i}`)), hidden ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(FeltFromPlaying, {
				hidden: true,
				size: "md",
				stripe: true
			}) : null]
		}), typeof label === "number" ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
			className: "rounded-md bg-muted px-2 py-0.5 text-xs font-semibold tabular-nums",
			children: label
		}) : null]
	});
}
function CrashGame({ gameId }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(PlayGate, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(CrashTable, { gameId }) });
}
function CrashTable({ gameId }) {
	const { currency, applyBalances } = useWallet();
	const meta = CURRENCY_META[currency];
	const [phase, setPhase] = (0, import_react.useState)("idle");
	const [display, setDisplay] = (0, import_react.useState)(1);
	const [crashAt, setCrashAt] = (0, import_react.useState)(null);
	const [amount, setAmount] = (0, import_react.useState)(meta.minBet);
	const startedAt = (0, import_react.useRef)(0);
	const raf = (0, import_react.useRef)(0);
	const roundRef = (0, import_react.useRef)(null);
	const phaseRef = (0, import_react.useRef)("idle");
	(0, import_react.useEffect)(() => {
		phaseRef.current = phase;
	}, [phase]);
	(0, import_react.useEffect)(() => {
		return () => {
			if (raf.current) cancelAnimationFrame(raf.current);
		};
	}, []);
	function tick() {
		const elapsed = Date.now() - startedAt.current;
		setDisplay(crashMultiplierAt(elapsed));
		raf.current = requestAnimationFrame(tick);
	}
	async function play() {
		try {
			const res = await startCrash({ data: {
				gameId,
				currency,
				amount
			} });
			roundRef.current = res.roundId;
			startedAt.current = res.startedAt;
			setCrashAt(null);
			setDisplay(1);
			setPhase("running");
			raf.current = requestAnimationFrame(tick);
			watchCrash(res.roundId);
		} catch (err) {
			toast.error(err instanceof Error ? err.message : "Bet failed");
		}
	}
	async function watchCrash(id) {
		while (phaseRef.current === "running" && roundRef.current === id) {
			try {
				const peek = await peekCrash({ data: { roundId: id } });
				if (peek.crashed && phaseRef.current === "running") {
					if (raf.current) cancelAnimationFrame(raf.current);
					setPhase("crashed");
					setCrashAt(peek.crashAt);
					setDisplay(peek.crashAt ?? 1);
					toast.error(`Crashed at ${formatMultiplier(peek.crashAt ?? 1)}`);
					return;
				}
			} catch {
				return;
			}
			await new Promise((r) => setTimeout(r, 120));
		}
	}
	async function cash() {
		if (!roundRef.current || phaseRef.current !== "running") return;
		try {
			const res = await cashOutCrash({ data: { roundId: roundRef.current } });
			if (raf.current) cancelAnimationFrame(raf.current);
			applyBalances(res.balances);
			if (res.crashed) {
				setPhase("crashed");
				setCrashAt(res.crashAt);
				setDisplay(res.crashAt);
				toast.error(`Crashed at ${formatMultiplier(res.crashAt)}`);
			} else {
				setPhase("cashed");
				setDisplay(res.multiplier);
				toast.success(`Cashed out at ${formatMultiplier(res.multiplier)}`);
			}
		} catch (err) {
			toast.error(err instanceof Error ? err.message : "Cash out failed");
		}
	}
	const color = phase === "crashed" ? "text-destructive" : phase === "cashed" ? "text-lime" : "text-foreground";
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(GameShell, {
		controls: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(StakeField, {
			amount,
			setAmount,
			disabled: phase === "running"
		}), phase === "running" ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(LimeBet, {
			onClick: () => void cash(),
			children: ["Cash out ", formatMultiplier(display)]
		}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(LimeBet, {
			onClick: () => void play(),
			children: "Bet"
		})] }),
		play: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "flex flex-col items-center justify-center py-8",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "text-xs font-medium tracking-widest text-muted-foreground uppercase",
					children: "Multiplier"
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: `mt-4 font-heading text-6xl font-semibold tabular-nums tracking-tight ${color}`,
					children: formatMultiplier(display)
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "mt-10 h-1.5 w-full max-w-md overflow-hidden rounded-full bg-muted",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: `h-full rounded-full ${phase === "crashed" ? "bg-destructive" : phase === "cashed" ? "bg-lime" : "bg-primary"}`,
						style: { width: `${Math.min(100, Math.log(display) * 40)}%` }
					})
				}),
				crashAt && phase === "crashed" ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
					className: "mt-4 text-sm text-muted-foreground",
					children: ["Round busted at ", formatMultiplier(crashAt)]
				}) : null
			]
		})
	});
}
var MIN_CHANCE = 1;
var MAX_CHANCE = 98;
var AUTO_CAP = 25;
function clamp(n, a, b) {
	return Math.min(b, Math.max(a, n));
}
function chanceFromTarget(target, over) {
	return clamp(over ? 100 - target : target, MIN_CHANCE, MAX_CHANCE);
}
function multiplierFromChance(chance) {
	return 99 / chance;
}
function DiceGame({ gameId }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(PlayGate, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(DiceTable, { gameId }) });
}
function DiceTable({ gameId }) {
	const { currency, applyBalances } = useWallet();
	const meta = CURRENCY_META[currency];
	const [over, setOver] = (0, import_react.useState)(false);
	const [target, setTarget] = (0, import_react.useState)(49.5);
	const [amount, setAmount] = (0, import_react.useState)(meta.minBet);
	const [busy, setBusy] = (0, import_react.useState)(false);
	const [history, setHistory] = (0, import_react.useState)([]);
	const [last, setLast] = (0, import_react.useState)(null);
	const [lastWin, setLastWin] = (0, import_react.useState)(null);
	const [tab, setTab] = (0, import_react.useState)("manual");
	const [autoN, setAutoN] = (0, import_react.useState)(0);
	const [onWinInc, setOnWinInc] = (0, import_react.useState)(0);
	const [onLossInc, setOnLossInc] = (0, import_react.useState)(100);
	const [stopProfit, setStopProfit] = (0, import_react.useState)(0);
	const [stopLoss, setStopLoss] = (0, import_react.useState)(0);
	const chance = chanceFromTarget(target, over);
	const multiplier = multiplierFromChance(chance);
	const profit = amount * (multiplier - 1);
	const ticks = (0, import_react.useMemo)(() => [
		0,
		25,
		50,
		75,
		100
	], []);
	const greenLeft = !over;
	function setChance(next) {
		const c = clamp(next, MIN_CHANCE, MAX_CHANCE);
		setTarget(over ? 100 - c : c);
	}
	function setMultiplier(next) {
		if (!Number.isFinite(next) || next <= 1) return;
		setChance(clamp(99 / next, MIN_CHANCE, MAX_CHANCE));
	}
	function wonRoll(roll) {
		return over ? roll >= target : roll < target;
	}
	async function playOnce(bet) {
		const res = await playInstant({ data: {
			gameId,
			currency,
			amount: bet,
			choice: over ? "over" : "under",
			target
		} });
		applyBalances(res.balances);
		const roll = Number(res.detail.roll);
		const win = wonRoll(roll);
		setLast(roll);
		setLastWin(win);
		setHistory((h) => [{
			n: roll,
			win
		}, ...h].slice(0, 8));
		if (res.payout > 0) toast.success(`Won ${formatMoney(res.payout, currency)} ${currency}`);
		else toast.message("Missed");
		return {
			win,
			payout: res.payout
		};
	}
	async function onBet() {
		setBusy(true);
		try {
			if (tab === "manual") {
				await playOnce(amount);
				return;
			}
			const n = autoN > 0 ? Math.min(autoN, AUTO_CAP) : AUTO_CAP;
			let bet = amount;
			let pnl = 0;
			for (let i = 0; i < n; i += 1) {
				const { win, payout } = await playOnce(bet);
				pnl += payout - bet;
				if (stopProfit > 0 && pnl >= stopProfit) break;
				if (stopLoss > 0 && pnl <= -stopLoss) break;
				if (win) bet = onWinInc > 0 ? Math.min(meta.maxBet, bet * (1 + onWinInc / 100)) : amount;
				else bet = onLossInc > 0 ? Math.min(meta.maxBet, bet * (1 + onLossInc / 100)) : amount;
			}
		} catch (err) {
			toast.error(err instanceof Error ? err.message : "Bet failed");
		} finally {
			setBusy(false);
		}
	}
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(GameShell, {
		controls: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Tabs$1, {
				value: tab,
				onValueChange: setTab,
				className: "gap-0",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(TabsList, {
					className: "h-10 w-full rounded-lg bg-muted",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TabsTrigger, {
							value: "manual",
							className: "h-8 flex-1",
							children: "Manual"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TabsTrigger, {
							value: "auto",
							className: "h-8 flex-1",
							children: "Auto"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TabsTrigger, {
							value: "advanced",
							className: "h-8 flex-1",
							children: "Advanced"
						})
					]
				})
			}),
			tab === "manual" ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "space-y-3",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(StakeField, {
					amount,
					setAmount
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(FieldLabel, {
					label: "Profit",
					hint: `${formatMoney(profit, currency)} ${currency}`,
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
						readOnly: true,
						value: profit.toFixed(8),
						className: "h-11 tabular-nums"
					})
				})]
			}) : tab === "auto" ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "space-y-3",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(StakeField, {
						amount,
						setAmount
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(FieldLabel, {
						label: "Number of bets",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
							type: "number",
							min: 0,
							value: autoN,
							onChange: (e) => setAutoN(Number(e.target.value)),
							className: "h-11 tabular-nums"
						})
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "grid grid-cols-2 gap-2 rounded-lg bg-muted p-3",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(FieldLabel, {
								label: "On win %",
								children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
									type: "number",
									min: 0,
									value: onWinInc,
									onChange: (e) => setOnWinInc(Number(e.target.value)),
									className: "h-10 tabular-nums"
								})
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(FieldLabel, {
								label: "On loss %",
								children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
									type: "number",
									min: 0,
									value: onLossInc,
									onChange: (e) => setOnLossInc(Number(e.target.value)),
									className: "h-10 tabular-nums"
								})
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(FieldLabel, {
								label: "Stop profit",
								children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
									type: "number",
									min: 0,
									value: stopProfit,
									onChange: (e) => setStopProfit(Number(e.target.value)),
									className: "h-10 tabular-nums"
								})
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(FieldLabel, {
								label: "Stop loss",
								children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
									type: "number",
									min: 0,
									value: stopLoss,
									onChange: (e) => setStopLoss(Number(e.target.value)),
									className: "h-10 tabular-nums"
								})
							})
						]
					})
				]
			}) : /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "space-y-3",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(StakeField, {
						amount,
						setAmount
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(FieldLabel, {
						label: "Number of bets",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
							type: "number",
							min: 0,
							value: autoN,
							onChange: (e) => setAutoN(Number(e.target.value)),
							className: "h-11 tabular-nums"
						})
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(FieldLabel, {
						label: "Strategy",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: "flex h-11 items-center rounded-lg border border-border bg-muted px-3 text-sm",
							children: "Martingale"
						})
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "text-xs text-muted-foreground",
						children: "On loss, stake doubles. On win, reset."
					})
				]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(LimeBet, {
				disabled: busy,
				onClick: () => void onBet(),
				children: tab === "manual" ? "Bet" : "Start Autobet"
			})
		] }),
		play: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "flex min-h-8 flex-wrap justify-center gap-1.5",
				children: history.map((h, idx) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
					className: `rounded-md px-2 py-1 text-xs font-semibold tabular-nums ${h.win ? "bg-win-bar text-primary-foreground" : "bg-muted text-foreground"} ${idx === 0 ? "ring-2 ring-primary" : ""}`,
					children: h.n.toFixed(2)
				}, `${h.n}-${idx}`))
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "px-1 md:px-8",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "relative mb-2 h-7",
						children: last !== null ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: `absolute -translate-x-1/2 rounded-md border-2 px-2 py-0.5 text-xs font-bold tabular-nums ${lastWin ? "border-win-bar bg-card text-win-bar" : "border-loss-bar bg-card text-loss-bar"}`,
							style: { left: `${clamp(last, 2, 98)}%` },
							children: last.toFixed(2)
						}) : null
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "rounded-lg border-2 border-border bg-muted/60 px-3 py-3",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "relative h-8",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "absolute inset-x-0 top-1/2 h-2.5 -translate-y-1/2 overflow-hidden rounded-full",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
									className: `absolute inset-y-0 left-0 ${greenLeft ? "bg-win-bar" : "bg-loss-bar"}`,
									style: { width: `${target}%` }
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
									className: `absolute inset-y-0 right-0 ${greenLeft ? "bg-loss-bar" : "bg-win-bar"}`,
									style: { width: `${100 - target}%` }
								})]
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
								type: "range",
								min: 2,
								max: 98,
								step: .5,
								value: target,
								onChange: (e) => setTarget(Number(e.target.value)),
								className: "dice-range absolute inset-0 w-full cursor-pointer",
								"aria-label": "Roll target"
							})]
						})
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "mt-2 flex justify-between px-1 text-xs text-muted-foreground",
						children: ticks.map((t) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: t }, t))
					})
				]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "grid grid-cols-3 gap-2",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(MiniField, {
						label: "Multiplier",
						value: multiplier.toFixed(4),
						onChange: (v) => setMultiplier(Number(v))
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(MiniField, {
						label: over ? "Roll Over" : "Roll Under",
						value: target.toFixed(2),
						onChange: (v) => setTarget(clamp(Number(v), 2, 98)),
						action: () => setOver((o) => !o)
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(MiniField, {
						label: "Chance",
						value: chance.toFixed(4),
						suffix: "%",
						onChange: (v) => setChance(Number(v))
					})
				]
			})
		] })
	});
}
function MiniField({ label, value, suffix, onChange, action }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
		className: "rounded-lg bg-muted p-2",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
			className: "text-[0.65rem] tracking-wide text-muted-foreground uppercase",
			children: label
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
			className: "mt-1 flex items-center gap-1",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
					value,
					onChange: (e) => onChange(e.target.value),
					className: "h-9 border-0 bg-transparent px-0 tabular-nums shadow-none"
				}),
				suffix ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
					className: "text-xs text-muted-foreground",
					children: suffix
				}) : null,
				action ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
					type: "button",
					onClick: action,
					className: "text-muted-foreground hover:text-foreground",
					"aria-label": "Flip",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(dZ, { className: "size-4" })
				}) : null
			]
		})]
	});
}
function HiloGame({ gameId }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(PlayGate, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(HiloTable, { gameId }) });
}
function HiloTable({ gameId }) {
	const { currency, applyBalances } = useWallet();
	const meta = CURRENCY_META[currency];
	const [roundId, setRoundId] = (0, import_react.useState)(null);
	const [card, setCard] = (0, import_react.useState)(null);
	const [prev, setPrev] = (0, import_react.useState)(null);
	const [amount, setAmount] = (0, import_react.useState)(meta.minBet);
	const [busy, setBusy] = (0, import_react.useState)(false);
	const [dir, setDir] = (0, import_react.useState)("higher");
	async function dealFresh() {
		const res = await startHilo({ data: { gameId } });
		setRoundId(res.roundId);
		setCard(res.card);
		setPrev(null);
	}
	(0, import_react.useEffect)(() => {
		dealFresh();
	}, [gameId]);
	const pHigher = card ? (14 - card.rank) / 13 : .5;
	const pLower = card ? card.rank / 13 : .5;
	async function pick(next) {
		if (!roundId) return;
		setDir(next);
		setBusy(true);
		try {
			const res = await playHilo({ data: {
				roundId,
				currency,
				amount,
				pick: next
			} });
			applyBalances(res.balances);
			setPrev(res.previous);
			setCard(res.card);
			if (res.win) toast.success(`${formatMoney(res.payout, currency)} ${currency}`);
			else toast.message("Miss");
		} catch (err) {
			toast.error(err instanceof Error ? err.message : "Bet failed");
		} finally {
			setBusy(false);
		}
	}
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(GameShell, {
		controls: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(StakeField, {
			amount,
			setAmount
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(LimeBet, {
			disabled: busy || !roundId,
			onClick: () => void pick(dir),
			children: "Bet"
		})] }),
		play: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "mx-auto grid w-full max-w-lg grid-cols-[1fr_auto] items-center gap-4",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "flex flex-col items-start gap-3",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "relative",
					children: [card ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(FeltCard, {
						rank: card.rank,
						suit: card.suit,
						size: "lg",
						stripe: true
					}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(FeltCard, {
						hidden: true,
						size: "lg",
						stripe: true
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
						type: "button",
						"aria-label": "Skip card",
						className: "absolute top-2 right-2 grid size-8 place-items-center rounded-md bg-black/40 text-white hover:bg-black/60",
						onClick: () => void dealFresh(),
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(dZ, { className: "size-4" })
					})]
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "relative",
					children: prev ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(FeltCard, {
						rank: prev.rank,
						suit: prev.suit,
						size: "sm"
					}) : card ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "relative",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(FeltCard, {
							rank: card.rank,
							suit: card.suit,
							size: "sm"
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							className: "absolute inset-x-1 bottom-1 rounded bg-white px-1 text-center text-[0.6rem] font-semibold text-zinc-900",
							children: "Start"
						})]
					}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(FeltCard, {
						hidden: true,
						size: "sm"
					})
				})]
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "flex items-stretch gap-2",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "flex w-36 flex-col gap-2",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
						type: "button",
						disabled: busy,
						onClick: () => void pick("higher"),
						className: "flex min-h-16 flex-col items-start justify-center rounded-xl bg-muted px-3 py-2 text-left hover:bg-muted/80",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							className: "text-xs text-muted-foreground",
							children: "Higher or Same"
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
							className: "mt-1 flex items-center gap-1 text-sm font-semibold text-gold",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(h2, { className: "size-4" }),
								(pHigher * 100).toFixed(2),
								"%"
							]
						})]
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
						type: "button",
						disabled: busy,
						onClick: () => void pick("lower"),
						className: "flex min-h-16 flex-col items-start justify-center rounded-xl bg-muted px-3 py-2 text-left hover:bg-muted/80",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							className: "text-xs text-muted-foreground",
							children: "Lower or Same"
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
							className: "mt-1 flex items-center gap-1 text-sm font-semibold text-primary",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(u1, { className: "size-4" }),
								(pLower * 100).toFixed(2),
								"%"
							]
						})]
					})]
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "flex flex-col items-center justify-between py-1 text-[0.65rem] font-semibold text-muted-foreground",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "K" }),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: "w-px flex-1 bg-border" }),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "A" })
					]
				})]
			})]
		})
	});
}
var RISKS = [
	"classic",
	"low",
	"normie",
	"degen"
];
function KenoGame({ gameId }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(PlayGate, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(KenoTable, { gameId }) });
}
function KenoTable({ gameId }) {
	const { currency, applyBalances } = useWallet();
	const meta = CURRENCY_META[currency];
	const [picks, setPicks] = (0, import_react.useState)([]);
	const [drawn, setDrawn] = (0, import_react.useState)([]);
	const [hits, setHits] = (0, import_react.useState)(null);
	const [amount, setAmount] = (0, import_react.useState)(meta.minBet);
	const [risk, setRisk] = (0, import_react.useState)("classic");
	const [busy, setBusy] = (0, import_react.useState)(false);
	function toggle(n) {
		setDrawn([]);
		setHits(null);
		setPicks((p) => {
			if (p.includes(n)) return p.filter((x) => x !== n);
			if (p.length >= 10) return p;
			return [...p, n].sort((a, b) => a - b);
		});
	}
	function autoPick() {
		const next = [];
		while (next.length < 8) {
			const n = 1 + Math.floor(Math.random() * 40);
			if (!next.includes(n)) next.push(n);
		}
		setPicks(next.sort((a, b) => a - b));
		setDrawn([]);
		setHits(null);
	}
	async function play() {
		if (picks.length < 1) {
			toast.message("Select 1–10 numbers");
			return;
		}
		setBusy(true);
		try {
			const res = await playKeno({ data: {
				gameId,
				currency,
				amount,
				picks,
				risk
			} });
			applyBalances(res.balances);
			setDrawn(res.drawn);
			setHits(res.hits);
			if (res.payout > 0) toast.success(`${res.hits} hits · ${formatMoney(res.payout, currency)}`);
			else toast.message(`${res.hits} hits`);
		} catch (err) {
			toast.error(err instanceof Error ? err.message : "Bet failed");
		} finally {
			setBusy(false);
		}
	}
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(GameShell, {
		controls: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(StakeField, {
				amount,
				setAmount
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "mb-2 text-xs text-muted-foreground",
				children: "Risk"
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "grid grid-cols-4 gap-1",
				children: RISKS.map((r) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
					type: "button",
					className: `h-10 rounded-lg text-xs capitalize ${risk === r ? "bg-primary font-semibold text-primary-foreground" : "bg-muted text-muted-foreground hover:text-foreground"}`,
					onClick: () => setRisk(r),
					children: r
				}, r))
			})] }),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(LimeBet, {
				disabled: busy,
				onClick: () => void play(),
				children: "Bet"
			})
		] }),
		play: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "mx-auto flex w-full max-w-lg flex-col items-stretch gap-4",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "grid grid-cols-8 gap-1.5",
					children: Array.from({ length: 40 }, (_, i) => i + 1).map((n) => {
						const selected = picks.includes(n);
						const hit = drawn.includes(n) && selected;
						const house = drawn.includes(n) && !selected;
						return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
							type: "button",
							onClick: () => toggle(n),
							className: `aspect-square rounded-lg text-xs font-semibold tabular-nums ${hit ? "bg-lime text-background" : house ? "bg-destructive/70 text-white" : selected ? "bg-primary/20 text-primary ring-1 ring-primary" : "bg-tile text-foreground"}`,
							children: n
						}, n);
					})
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "text-center text-xs text-muted-foreground",
					children: hits !== null ? `${hits} hits this round` : "Select 1–10 numbers to play"
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "grid grid-cols-2 gap-2",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
						variant: "outline",
						className: "h-11",
						onClick: autoPick,
						children: "Auto pick"
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
						variant: "outline",
						className: "h-11",
						onClick: () => {
							setPicks([]);
							setDrawn([]);
							setHits(null);
						},
						children: "Clear table"
					})]
				})
			]
		})
	});
}
function MinesGame({ gameId }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(PlayGate, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(MinesTable, { gameId }) });
}
function MinesTable({ gameId }) {
	const { currency, applyBalances } = useWallet();
	const meta = CURRENCY_META[currency];
	const [roundId, setRoundId] = (0, import_react.useState)(null);
	const [revealed, setRevealed] = (0, import_react.useState)([]);
	const [mines, setMines] = (0, import_react.useState)(null);
	const [multiplier, setMultiplier] = (0, import_react.useState)(1);
	const [busy, setBusy] = (0, import_react.useState)(false);
	const [amount, setAmount] = (0, import_react.useState)(meta.minBet);
	const [mineCount, setMineCount] = (0, import_react.useState)(3);
	async function start() {
		setBusy(true);
		try {
			const res = await startMines({ data: {
				gameId,
				currency,
				amount,
				mineCount
			} });
			setRoundId(res.roundId);
			setRevealed([]);
			setMines(null);
			setMultiplier(1);
		} catch (err) {
			toast.error(err instanceof Error ? err.message : "Bet failed");
		} finally {
			setBusy(false);
		}
	}
	async function reveal(index) {
		if (!roundId || mines) return;
		try {
			const res = await revealMine({ data: {
				roundId,
				index
			} });
			setRevealed(res.revealed);
			setMultiplier(res.multiplier);
			if (res.boom) {
				setMines(res.mines);
				if (res.balances) applyBalances(res.balances);
				setRoundId(null);
				toast.error("Mine. Round over.");
			}
		} catch (err) {
			toast.error(err instanceof Error ? err.message : "Reveal failed");
		}
	}
	async function cash() {
		if (!roundId) return;
		try {
			const res = await cashOutMines({ data: { roundId } });
			applyBalances(res.balances);
			setMines(res.mines);
			setRoundId(null);
			toast.success(`Cashed ${formatMoney(res.payout, currency)} ${currency}`);
		} catch (err) {
			toast.error(err instanceof Error ? err.message : "Cash out failed");
		}
	}
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(GameShell, {
		controls: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(StakeField, {
				amount,
				setAmount,
				disabled: Boolean(roundId)
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(FieldLabel, {
				label: "Mines",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("select", {
					className: "h-11 w-full rounded-lg border border-border bg-muted px-3",
					value: mineCount,
					disabled: Boolean(roundId),
					onChange: (e) => setMineCount(Number(e.target.value)),
					children: Array.from({ length: 24 }, (_, i) => i + 1).map((n) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
						value: n,
						children: n
					}, n))
				})
			}),
			roundId ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(LimeBet, {
				onClick: () => void cash(),
				children: ["Cash out ", formatMultiplier(multiplier)]
			}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(LimeBet, {
				disabled: busy,
				onClick: () => void start(),
				children: "Bet"
			})
		] }),
		play: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
			className: "mx-auto grid w-full max-w-md grid-cols-5 gap-2",
			children: Array.from({ length: 25 }).map((_, i) => {
				const isMine = mines?.includes(i);
				const isSafe = revealed.includes(i);
				return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
					type: "button",
					disabled: !roundId || Boolean(mines) || isSafe,
					onClick: () => void reveal(i),
					className: `aspect-square rounded-xl transition-colors duration-(--motion-quick) ${isMine ? "bg-destructive/80" : isSafe ? "bg-lime/80" : "bg-tile hover:bg-tile/80"}`,
					"aria-label": `Tile ${i + 1}`,
					children: isMine ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Bomb, {}) : isSafe ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Gem, {}) : null
				}, i);
			})
		})
	});
}
function Gem() {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("svg", {
		viewBox: "0 0 24 24",
		className: "mx-auto size-1/2 text-primary-foreground",
		fill: "currentColor",
		"aria-hidden": true,
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("path", { d: "M12 2 4 9l8 13 8-13-8-7zm0 3.2 4.6 4.3L12 18.4 7.4 9.5 12 5.2z" })
	});
}
function Bomb() {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("svg", {
		viewBox: "0 0 24 24",
		className: "mx-auto size-1/2 text-white",
		fill: "currentColor",
		"aria-hidden": true,
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("circle", {
				cx: "11",
				cy: "14",
				r: "7"
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("path", { d: "M14 8.5 17 5l1.5 1.5-2 3z" }),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("rect", {
				x: "16.5",
				y: "3.2",
				width: "3",
				height: "1.6",
				rx: "0.4",
				transform: "rotate(45 18 4)"
			})
		]
	});
}
var CHOICES = [
	{
		id: "red",
		label: "Red"
	},
	{
		id: "black",
		label: "Black"
	},
	{
		id: "green",
		label: "Zero"
	}
];
function RouletteGame({ gameId }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(PlayGate, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(RouletteTable, { gameId }) });
}
function RouletteTable({ gameId }) {
	const { currency, applyBalances } = useWallet();
	const meta = CURRENCY_META[currency];
	const [choice, setChoice] = (0, import_react.useState)("red");
	const [spinning, setSpinning] = (0, import_react.useState)(false);
	const [amount, setAmount] = (0, import_react.useState)(meta.minBet);
	const [result, setResult] = (0, import_react.useState)(null);
	async function play() {
		setSpinning(true);
		try {
			const res = await playInstant({ data: {
				gameId,
				currency,
				amount,
				choice
			} });
			applyBalances(res.balances);
			setResult({
				number: Number(res.detail.number),
				color: String(res.detail.color),
				payout: res.payout
			});
			if (res.payout > 0) toast.success(`Won ${formatMoney(res.payout, currency)} ${currency}`);
			else toast.message("No hit");
		} catch (err) {
			toast.error(err instanceof Error ? err.message : "Spin failed");
		} finally {
			setSpinning(false);
		}
	}
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(GameShell, {
		controls: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(StakeField, {
				amount,
				setAmount,
				disabled: spinning
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "grid grid-cols-3 gap-2",
				children: CHOICES.map((c) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
					type: "button",
					onClick: () => setChoice(c.id),
					className: `h-11 rounded-lg text-sm font-medium ${choice === c.id ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:text-foreground"}`,
					children: c.label
				}, c.id))
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(LimeBet, {
				disabled: spinning,
				onClick: () => void play(),
				children: "Bet"
			})
		] }),
		play: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "flex flex-col items-center justify-center py-8",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: `grid size-40 place-items-center rounded-full border-4 font-heading text-5xl font-semibold tabular-nums ${result?.color === "red" ? "border-destructive bg-destructive/20 text-destructive" : result?.color === "green" ? "border-lime bg-lime/15 text-lime" : "border-foreground/30 bg-tile text-foreground"}`,
				children: result ? result.number : "—"
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "mt-4 text-sm text-muted-foreground",
				children: result ? `${result.color} · European single zero` : "Pick a color, then bet"
			})]
		})
	});
}
function SlotsGame({ gameId }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(PlayGate, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SlotsTable, { gameId }) });
}
function SlotsTable({ gameId }) {
	const { currency, applyBalances } = useWallet();
	const meta = CURRENCY_META[currency];
	const [reels, setReels] = (0, import_react.useState)([
		"A",
		"K",
		"Q"
	]);
	const [busy, setBusy] = (0, import_react.useState)(false);
	const [amount, setAmount] = (0, import_react.useState)(meta.minBet);
	async function play() {
		setBusy(true);
		try {
			const res = await playInstant({ data: {
				gameId,
				currency,
				amount
			} });
			applyBalances(res.balances);
			setReels(res.detail.reels);
			if (res.payout > 0) toast.success(`Won ${formatMoney(res.payout, currency)} ${currency}`);
			else toast.message("No line");
		} catch (err) {
			toast.error(err instanceof Error ? err.message : "Spin failed");
		} finally {
			setBusy(false);
		}
	}
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(GameShell, {
		controls: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(StakeField, {
				amount,
				setAmount,
				disabled: busy
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "text-xs text-muted-foreground",
				children: "Three of a kind pays 5–25x. Two matching symbols pay 1.5x."
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(LimeBet, {
				disabled: busy,
				onClick: () => void play(),
				children: "Bet"
			})
		] }),
		play: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
			className: "mx-auto grid w-full max-w-md grid-cols-3 gap-3",
			children: reels.map((s, i) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "grid aspect-3/4 place-items-center rounded-xl bg-tile font-heading text-3xl font-semibold",
				children: s
			}, `${s}-${i}`))
		})
	});
}
function GamePage() {
	const { id } = Route$1.useParams();
	const game = getGame(id);
	if (!game) return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("main", {
		className: "mx-auto max-w-lg py-16 text-center",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
				className: "font-heading text-2xl font-semibold",
				children: "Table closed"
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "mt-2 text-sm text-muted-foreground",
				children: "That id is not in the catalog."
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
				to: "/casino",
				className: "mt-4 inline-block text-sm text-primary",
				children: "Return to casino"
			})
		]
	});
	const more = GAMES.filter((g) => g.id !== game.id).slice(0, 6);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("main", {
		className: "mx-auto flex w-full max-w-6xl flex-col gap-8",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(GameSwitch, {
				kind: game.kind,
				id: game.id
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "flex items-center justify-between rounded-2xl bg-card px-4 py-3",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
					className: "font-heading text-lg font-bold",
					children: game.title
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "text-xs text-muted-foreground",
					children: game.provider
				})] }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
					className: "text-xs tabular-nums text-lime",
					children: [game.rtp.toFixed(1), "% RTP"]
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "mb-4 flex items-center justify-between",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
					className: "font-heading text-lg font-bold",
					children: "More from TOLS"
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
					to: "/casino",
					className: "text-xs text-muted-foreground hover:text-foreground",
					children: "View all"
				})]
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(GameGrid, { games: more })] })
		]
	});
}
function GameSwitch({ kind, id }) {
	switch (kind) {
		case "crash": return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(CrashGame, { gameId: id });
		case "roulette": return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(RouletteGame, { gameId: id });
		case "blackjack": return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(BlackjackGame, { gameId: id });
		case "slots": return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SlotsGame, { gameId: id });
		case "dice": return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(DiceGame, { gameId: id });
		case "mines": return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(MinesGame, { gameId: id });
		case "keno": return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(KenoGame, { gameId: id });
		case "hilo": return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(HiloGame, { gameId: id });
		default: return null;
	}
}
//#endregion
export { GamePage as component };
