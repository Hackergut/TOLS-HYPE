import { o as __toESM } from "../_runtime.mjs";
import { u as require_react } from "../_libs/@floating-ui/react-dom+[...].mjs";
import { c as require_jsx_runtime } from "../_libs/@radix-ui/react-arrow+[...].mjs";
import { t as Button } from "./button-BZfbrQLK.mjs";
import { n as toast } from "../_libs/sonner.mjs";
import { n as useCurrentUserState } from "./use-current-user-ClOiUQ-z.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/affiliate-C5SSGSL8.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
function AffiliatePage() {
	const { user } = useCurrentUserState();
	const code = user ? `TOLS-${user.id.slice(0, 8).toUpperCase()}` : "TOLS-SIGNIN";
	const [copied, setCopied] = (0, import_react.useState)(false);
	function copy() {
		navigator.clipboard.writeText(`https://tols.fun/?r=${code}`);
		setCopied(true);
		toast.success("Referral link copied");
	}
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("main", {
		className: "mx-auto flex w-full max-w-3xl flex-col gap-6",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("header", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
				className: "font-heading text-3xl font-bold tracking-tight",
				children: "Affiliate Program"
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "mt-1 text-sm text-muted-foreground",
				children: "Earn 25–30% revenue share on referred wagers, for the lifetime of the account."
			})] }),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
				className: "rounded-2xl bg-card p-5 shadow-[var(--shadow-glow)]",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "text-xs text-muted-foreground",
						children: "Your code"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "mt-1 font-mono text-lg",
						children: code
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
						className: "mt-4 h-10",
						onClick: copy,
						disabled: !user,
						children: copied ? "Copied" : "Copy invite link"
					}),
					!user ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "mt-2 text-xs text-muted-foreground",
						children: "Sign in to generate a live code."
					}) : null
				]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("ul", {
				className: "grid gap-2 text-sm text-muted-foreground",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("li", { children: "· No referral limit" }),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("li", { children: "· Lifetime commission" }),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("li", { children: "· Revshare or CPA plan" })
				]
			})
		]
	});
}
//#endregion
export { AffiliatePage as component };
