import { c as require_jsx_runtime } from "../_libs/@radix-ui/react-arrow+[...].mjs";
import { t as Button } from "./button-BZfbrQLK.mjs";
import { v as Link } from "../_libs/@tanstack/react-router+[...].mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/vip-Bq5U7Fsv.js
var import_jsx_runtime = require_jsx_runtime();
var TIERS = [
	{
		name: "Member",
		wager: "$0",
		rake: "5%",
		cash: "—",
		perk: "Welcome bonus"
	},
	{
		name: "Gold",
		wager: "$1,000",
		rake: "10%",
		cash: "—",
		perk: "Faster cashier"
	},
	{
		name: "Diamond",
		wager: "$5,000",
		rake: "15%",
		cash: "10% monthly",
		perk: "Priority support"
	},
	{
		name: "Obsidian",
		wager: "$25,000",
		rake: "20%",
		cash: "10% monthly",
		perk: "Host + reload"
	}
];
function VipPage() {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("main", {
		className: "mx-auto flex w-full max-w-4xl flex-col gap-6",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("header", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
				className: "font-heading text-3xl font-bold tracking-tight",
				children: "VIP Program"
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "mt-1 text-sm text-muted-foreground",
				children: "1 point per $1 wagered. Tiers auto-upgrade. Perks stack."
			})] }),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "grid gap-3 sm:grid-cols-2",
				children: TIERS.map((t) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("article", {
					className: "rounded-2xl bg-card p-5 shadow-[var(--shadow-border)]",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "text-xs font-medium tracking-[0.18em] text-gold uppercase",
							children: t.name
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
							className: "mt-2 text-sm text-muted-foreground",
							children: ["Wagered ", t.wager]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
							className: "mt-3 text-2xl font-bold text-lime",
							children: [t.rake, " rakeback"]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
							className: "mt-1 text-sm text-muted-foreground",
							children: ["Cashback ", t.cash]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "mt-2 text-sm",
							children: t.perk
						})
					]
				}, t.name))
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
				asChild: true,
				className: "h-11 w-fit",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
					to: "/casino",
					children: "Play Originals"
				})
			})
		]
	});
}
//#endregion
export { VipPage as component };
