import { o as __toESM } from "../_runtime.mjs";
import { s as SPORTS } from "./games-catalog-kDIyglwq.mjs";
import { u as require_react } from "../_libs/@floating-ui/react-dom+[...].mjs";
import { c as require_jsx_runtime } from "../_libs/@radix-ui/react-arrow+[...].mjs";
import { t as Button } from "./button-BZfbrQLK.mjs";
import { r as formatMoney } from "./format-RUsy5oTU.mjs";
import { n as toast } from "../_libs/sonner.mjs";
import { t as Input } from "./input-HW-MdT1M.mjs";
import { h as useWallet, s as placeSportBet } from "./wallet-context-DCUk16fH.mjs";
import { t as PlayGate } from "./play-gate-DVfXEwTk.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/sports-6WwbIocJ.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
function SportsPage() {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(PlayGate, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SportsBook, {}) });
}
function SportsBook() {
	const { currency, applyBalances } = useWallet();
	const [amount, setAmount] = (0, import_react.useState)(10);
	async function bet(eventId, side, odds) {
		try {
			const res = await placeSportBet({ data: {
				eventId,
				side,
				odds,
				amount,
				currency
			} });
			applyBalances(res.balances);
			if (res.win) toast.success(`Hit · ${formatMoney(res.payout, currency)} ${currency}`);
			else toast.message("The other side closed it");
		} catch (err) {
			toast.error(err instanceof Error ? err.message : "Bet failed");
		}
	}
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("main", {
		className: "mx-auto flex w-full max-w-3xl flex-col gap-6",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("header", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
				className: "font-heading text-3xl font-semibold tracking-tight",
				children: "Sportsbook"
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "mt-1 text-sm text-muted-foreground",
				children: "Instant settle against the house. Stake in the currency selected in the header."
			})] }),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "flex items-center gap-3 rounded-2xl bg-card p-4 shadow-[var(--shadow-border)]",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
						className: "text-sm text-muted-foreground",
						children: "Stake"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
						type: "number",
						className: "h-11 max-w-40 tabular-nums",
						value: amount,
						onChange: (e) => setAmount(Number(e.target.value))
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
						className: "text-sm",
						children: currency
					})
				]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("ul", {
				className: "grid gap-3",
				children: SPORTS.map((ev) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", {
					className: "rounded-2xl bg-card p-4 shadow-[var(--shadow-border)]",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "flex items-center justify-between gap-3",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
								className: "text-[0.65rem] font-medium tracking-[0.16em] text-muted-foreground uppercase",
								children: [ev.league, ev.live ? " · live" : ""]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("h2", {
								className: "font-heading mt-1 text-lg font-semibold",
								children: [
									ev.home,
									" vs ",
									ev.away
								]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "text-xs text-muted-foreground",
								children: ev.start
							})
						] })
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "mt-4 grid grid-cols-2 gap-2",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
							variant: "outline",
							className: "h-11 justify-between",
							onClick: () => void bet(ev.id, "home", ev.moneyline[0]),
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: ev.home }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: "tabular-nums",
								children: ev.moneyline[0].toFixed(2)
							})]
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
							variant: "outline",
							className: "h-11 justify-between",
							onClick: () => void bet(ev.id, "away", ev.moneyline[1]),
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: ev.away }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: "tabular-nums",
								children: ev.moneyline[1].toFixed(2)
							})]
						})]
					})]
				}, ev.id))
			})
		]
	});
}
//#endregion
export { SportsPage as component };
