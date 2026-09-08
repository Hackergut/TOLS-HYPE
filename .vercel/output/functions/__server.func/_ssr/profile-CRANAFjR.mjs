import { o as __toESM } from "../_runtime.mjs";
import { n as CURRENCIES } from "./games-catalog-kDIyglwq.mjs";
import { u as require_react } from "../_libs/@floating-ui/react-dom+[...].mjs";
import { c as require_jsx_runtime } from "../_libs/@radix-ui/react-arrow+[...].mjs";
import { t as cn } from "../_libs/cn.mjs";
import { v as Link } from "../_libs/@tanstack/react-router+[...].mjs";
import { a as mockAddressFromUserId, o as shortAddress, r as formatMoney } from "./format-RUsy5oTU.mjs";
import { n as toast } from "../_libs/sonner.mjs";
import { t as Input } from "./input-HW-MdT1M.mjs";
import { n as useCurrentUserState } from "./use-current-user-ClOiUQ-z.mjs";
import { t as RedirectToSignIn } from "./gates-BLdEs9lY.mjs";
import { h as useWallet } from "./wallet-context-DCUk16fH.mjs";
import { t as Label$1 } from "./label-BLXCKpH1.mjs";
import { i as saveResponsible, n as loadResponsible } from "./responsible-B1NssqY0.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/profile-CRANAFjR.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
function Table({ className, ...props }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		"data-slot": "table-container",
		className: "relative w-full overflow-x-auto",
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("table", {
			"data-slot": "table",
			className: cn("w-full caption-bottom text-xs", className),
			...props
		})
	});
}
function TableHeader({ className, ...props }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("thead", {
		"data-slot": "table-header",
		className: cn("[&_tr]:border-b", className),
		...props
	});
}
function TableBody({ className, ...props }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("tbody", {
		"data-slot": "table-body",
		className: cn("[&_tr:last-child]:border-0", className),
		...props
	});
}
function TableRow({ className, ...props }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("tr", {
		"data-slot": "table-row",
		className: cn("border-b transition-colors hover:bg-muted/50 has-aria-expanded:bg-muted/50 data-[state=selected]:bg-muted", className),
		...props
	});
}
function TableHead({ className, ...props }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
		"data-slot": "table-head",
		className: cn("h-10 px-2 text-left align-middle font-medium whitespace-nowrap text-foreground [&:has([role=checkbox])]:pr-0", className),
		...props
	});
}
function TableCell({ className, ...props }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
		"data-slot": "table-cell",
		className: cn("p-2 align-middle whitespace-nowrap [&:has([role=checkbox])]:pr-0", className),
		...props
	});
}
var EXCLUDE = [
	{
		label: "Off",
		ms: 0
	},
	{
		label: "24 hours",
		ms: 864e5
	},
	{
		label: "7 days",
		ms: 6048e5
	},
	{
		label: "30 days",
		ms: 2592e6
	},
	{
		label: "6 months",
		ms: 157248e5
	}
];
function ResponsibleTools() {
	const [settings, setSettings] = (0, import_react.useState)(loadResponsible);
	(0, import_react.useEffect)(() => {
		setSettings(loadResponsible());
	}, []);
	function persist(next) {
		setSettings(next);
		saveResponsible(next);
		toast.success("Limits saved");
	}
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
		className: "rounded-2xl bg-card p-5 shadow-[var(--shadow-border)]",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
				className: "font-heading text-xl font-semibold",
				children: "Responsible play"
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
				className: "mt-1 text-sm text-muted-foreground",
				children: [
					"Limits apply on this device.",
					" ",
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
						to: "/responsible",
						className: "text-foreground hover:underline",
						children: "Read the policy"
					})
				]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "mt-4 grid gap-3 sm:grid-cols-2",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
						className: "grid gap-1.5 text-sm",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label$1, { children: "Self-exclusion" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("select", {
							className: "h-11 rounded-lg border border-border bg-muted px-3",
							defaultValue: "0",
							onChange: (e) => {
								const ms = Number(e.target.value);
								persist({
									...settings,
									excludedUntil: ms ? Date.now() + ms : null
								});
							},
							children: EXCLUDE.map((x) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
								value: x.ms,
								children: x.label
							}, x.label))
						})]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(LimitField, {
						label: "Deposit limit (USDT / day)",
						value: settings.depositLimit,
						onChange: (n) => persist({
							...settings,
							depositLimit: n
						})
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(LimitField, {
						label: "Wager limit (USDT / day)",
						value: settings.wagerLimit,
						onChange: (n) => persist({
							...settings,
							wagerLimit: n
						})
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(LimitField, {
						label: "Loss limit (USDT / day)",
						value: settings.lossLimit,
						onChange: (n) => persist({
							...settings,
							lossLimit: n
						})
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(LimitField, {
						label: "Session limit (minutes)",
						value: settings.sessionMinutes,
						onChange: (n) => persist({
							...settings,
							sessionMinutes: n
						})
					})
				]
			}),
			settings.excludedUntil && settings.excludedUntil > Date.now() ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
				className: "mt-3 text-sm text-lime",
				children: ["Excluded until ", new Date(settings.excludedUntil).toLocaleString()]
			}) : null
		]
	});
}
function LimitField({ label, value, onChange }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
		className: "grid gap-1.5 text-sm",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label$1, { children: label }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
			type: "number",
			min: 0,
			className: "h-11",
			placeholder: "No cap",
			value: value ?? "",
			onChange: (e) => onChange(e.target.value === "" ? null : Number(e.target.value))
		})]
	});
}
function vipLabel(wagered) {
	if (wagered >= 25e3) return "Obsidian";
	if (wagered >= 5e3) return "Diamond";
	if (wagered >= 1e3) return "Gold";
	return "Member";
}
function ProfilePage() {
	const { user, isPending } = useCurrentUserState();
	const { balances, transactions, wagered } = useWallet();
	if (isPending) return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "h-64 animate-pulse rounded-2xl bg-muted" });
	if (!user) return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(RedirectToSignIn, {});
	const vip = vipLabel(wagered);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("main", {
		className: "mx-auto flex w-full max-w-4xl flex-col gap-8",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("header", { children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "text-xs font-medium tracking-[0.18em] text-gold uppercase",
					children: vip
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
					className: "font-heading mt-1 text-3xl font-semibold tracking-tight",
					children: user.displayName ?? "Player"
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "mt-1 text-sm text-muted-foreground",
					children: user.primaryEmail
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "mt-2 font-mono text-xs text-muted-foreground",
					children: shortAddress(mockAddressFromUserId(user.id))
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
					to: "/vip",
					className: "mt-3 inline-block text-sm text-primary hover:underline",
					children: "VIP Program"
				})
			] }),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("section", {
				className: "grid gap-3 sm:grid-cols-3",
				children: CURRENCIES.map((c) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "rounded-2xl bg-card p-4 shadow-[var(--shadow-border)]",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "text-xs text-muted-foreground",
						children: c
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "mt-1 font-heading text-2xl font-semibold tabular-nums",
						children: formatMoney(balances[c], c)
					})]
				}, c))
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ResponsibleTools, {}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
				className: "font-heading mb-3 text-xl font-semibold",
				children: "Ledger"
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "overflow-hidden rounded-2xl bg-card shadow-[var(--shadow-border)]",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Table, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableHeader, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(TableRow, { children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableHead, { children: "Type" }),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableHead, { children: "Amount" }),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableHead, { children: "Note" })
				] }) }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableBody, { children: transactions.length === 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableRow, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableCell, {
					colSpan: 3,
					className: "text-muted-foreground",
					children: "No movement yet."
				}) }) : transactions.map((t) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(TableRow, { children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableCell, {
						className: "capitalize",
						children: t.type
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(TableCell, {
						className: "tabular-nums",
						children: [
							formatMoney(t.amount, t.currency),
							" ",
							t.currency
						]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableCell, {
						className: "text-muted-foreground",
						children: t.note ?? t.gameId
					})
				] }, t.id)) })] })
			})] })
		]
	});
}
//#endregion
export { ProfilePage as component };
