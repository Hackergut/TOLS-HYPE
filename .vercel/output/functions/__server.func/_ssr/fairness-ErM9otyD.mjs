import { c as require_jsx_runtime } from "../_libs/@radix-ui/react-arrow+[...].mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/fairness-ErM9otyD.js
var import_jsx_runtime = require_jsx_runtime();
function FairnessPage() {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("main", {
		className: "mx-auto w-full max-w-3xl",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
				className: "font-heading text-3xl font-semibold tracking-tight",
				children: "Fairness"
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "mt-3 text-sm leading-relaxed text-muted-foreground",
				children: "Outcomes are drawn on the server at bet time. Crash bust points stay hidden until the round settles. This is a demo house — seeds are not published as a hash chain."
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
				className: "font-heading mt-8 text-xl font-semibold",
				children: "House edge"
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("table", {
				className: "mt-3 w-full text-sm",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("thead", { children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("tr", {
					className: "text-left text-muted-foreground",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
						className: "py-2",
						children: "Game"
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", { children: "Edge" })]
				}) }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("tbody", { children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("tr", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
						className: "py-2",
						children: "Crash"
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", { children: "4%" })] }),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("tr", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
						className: "py-2",
						children: "Roulette"
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", { children: "2.7%" })] }),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("tr", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
						className: "py-2",
						children: "Blackjack"
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", { children: "~0.5%" })] }),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("tr", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
						className: "py-2",
						children: "Dice"
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", { children: "2%" })] }),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("tr", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
						className: "py-2",
						children: "Mines"
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", { children: "~3%" })] })
				] })]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
				className: "font-heading mt-8 text-xl font-semibold",
				children: "What is not real"
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("ul", {
				className: "mt-3 list-disc space-y-1 pl-5 text-sm text-muted-foreground",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("li", { children: "Wallet addresses are derived for display. They do not receive chain deposits." }),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("li", { children: "USDT, BTC, and ETH balances are ledger rows, not tokens." }),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("li", { children: "Sports results settle instantly against a house coin-flip with a vig." })
				]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("pre", {
				className: "mt-8 overflow-x-auto rounded-xl bg-muted p-4 text-xs",
				children: `crashPoint(edge) {
  if (random() < edge) return 1.00
  return floor(100 * (1 - edge) / (1 - random())) / 100
}`
			})
		]
	});
}
//#endregion
export { FairnessPage as component };
