import { c as require_jsx_runtime } from "../_libs/@radix-ui/react-arrow+[...].mjs";
import { t as Button } from "./button-BZfbrQLK.mjs";
import { v as Link } from "../_libs/@tanstack/react-router+[...].mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/help-Cr14W53Q.js
var import_jsx_runtime = require_jsx_runtime();
var FAQS = [
	{
		q: "Is this real-money gambling?",
		a: "This preview uses play-money balances. Tols.fun Terms of Service describe the live service."
	},
	{
		q: "How do I deposit?",
		a: "Sign in, open Wallet, and credit play-money USDT, BTC, or ETH. Live deposits use a wallet you control."
	},
	{
		q: "How do I set limits?",
		a: "Profile → Responsible play. Self-exclusion and deposit, wager, loss, and session limits are there."
	},
	{
		q: "Are games fair?",
		a: "Originals settle on the server at bet time. Read Provably Fair for house edge and what is demo-only."
	},
	{
		q: "I need to talk to someone.",
		a: "Email support@tols.fun. For gambling harm, use BeGambleAware or Gamblers Anonymous."
	}
];
function HelpPage() {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("main", {
		className: "mx-auto flex w-full max-w-3xl flex-col gap-6",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("header", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
				className: "font-heading text-3xl font-bold tracking-tight",
				children: "Help Center"
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "mt-1 text-sm text-muted-foreground",
				children: "Live Support · answers in one place"
			})] }),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
				id: "live",
				className: "rounded-2xl bg-card p-5 shadow-[var(--shadow-glow)]",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
						className: "font-heading text-lg font-semibold",
						children: "Live Support"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "mt-1 text-sm text-muted-foreground",
						children: "We reply around the clock. Include your account email."
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
						asChild: true,
						className: "mt-4 h-10",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("a", {
							href: "mailto:support@tols.fun",
							children: "Email support@tols.fun"
						})
					})
				]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("ul", {
				className: "grid gap-3",
				children: FAQS.map((f) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", {
					className: "rounded-2xl bg-card p-5",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
						className: "font-heading text-base font-semibold",
						children: f.q
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "mt-2 text-sm leading-relaxed text-muted-foreground",
						children: f.a
					})]
				}, f.q))
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
				className: "text-sm text-muted-foreground",
				children: [
					"Play within limits.",
					" ",
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
						to: "/responsible",
						className: "text-foreground hover:underline",
						children: "Game Responsibly"
					})
				]
			})
		]
	});
}
//#endregion
export { HelpPage as component };
