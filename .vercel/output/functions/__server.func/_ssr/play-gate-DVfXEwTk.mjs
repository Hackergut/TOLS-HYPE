import { o as __toESM } from "../_runtime.mjs";
import { u as require_react } from "../_libs/@floating-ui/react-dom+[...].mjs";
import { c as require_jsx_runtime } from "../_libs/@radix-ui/react-arrow+[...].mjs";
import { t as Button } from "./button-BZfbrQLK.mjs";
import { v as Link } from "../_libs/@tanstack/react-router+[...].mjs";
import { n as useCurrentUserState } from "./use-current-user-ClOiUQ-z.mjs";
import { n as loadResponsible, t as isSelfExcluded } from "./responsible-B1NssqY0.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/play-gate-DVfXEwTk.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
function PlayGate({ children }) {
	const { user, isPending } = useCurrentUserState();
	const [excludedUntil, setExcludedUntil] = (0, import_react.useState)(null);
	(0, import_react.useEffect)(() => {
		const s = loadResponsible();
		setExcludedUntil(isSelfExcluded(s) ? s.excludedUntil : null);
	}, []);
	if (isPending) return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "h-72 animate-pulse rounded-2xl bg-muted" });
	if (!user) return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "rounded-2xl bg-card p-8 text-center shadow-[var(--shadow-border)]",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "font-heading text-lg font-semibold",
				children: "Sign in to take a seat"
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "mt-1 text-sm text-muted-foreground",
				children: "Play-money balances mint on first visit."
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
				asChild: true,
				className: "mt-6 h-11",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
					to: "/login",
					children: "Sign in"
				})
			})
		]
	});
	if (excludedUntil) return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "rounded-2xl bg-card p-8 text-center shadow-[var(--shadow-border)]",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "font-heading text-lg font-semibold",
				children: "Self-excluded"
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
				className: "mt-1 text-sm text-muted-foreground",
				children: [
					"Play is blocked until ",
					new Date(excludedUntil).toLocaleString(),
					"."
				]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
				asChild: true,
				variant: "outline",
				className: "mt-6 h-11",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
					to: "/responsible",
					children: "Game Responsibly"
				})
			})
		]
	});
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(import_jsx_runtime.Fragment, { children });
}
//#endregion
export { PlayGate as t };
