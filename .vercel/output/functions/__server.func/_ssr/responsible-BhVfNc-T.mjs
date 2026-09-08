import { c as require_jsx_runtime } from "../_libs/@radix-ui/react-arrow+[...].mjs";
import { v as Link } from "../_libs/@tanstack/react-router+[...].mjs";
import { t as LegalPage } from "./legal-page-DrCe3aMs.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/responsible-BhVfNc-T.js
var import_jsx_runtime = require_jsx_runtime();
function ResponsibleContent() {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", { children: "Responsible Gambling" }),
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", { children: "TOLS Casino is committed to responsible gaming. Gambling should be entertainment, not a way to make money." }),
		/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("strong", { children: "18+ only." }), " TOLS Casino is restricted to players aged 18 or over — or the minimum legal age in your jurisdiction, whichever is higher. Gambling under the legal age is a breach of these terms; accounts are verified and closed when it is detected. If you share a device, use parental controls to keep the games away from minors."] }),
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", { children: "Tools Available" }),
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", { children: "You can set the following limits from your profile:" }),
		/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("ul", { children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("strong", { children: "Self-exclusion" }), " — block yourself from playing for a set period."] }),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("strong", { children: "Deposit limit" }), " — cap how much you can deposit per day/week/month."] }),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("strong", { children: "Wager limit" }), " — cap how much you can bet per period."] }),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("strong", { children: "Loss limit" }), " — cap your net losses per period."] }),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("strong", { children: "Session limit" }), " — limit how long you play per session."] })
		] }),
		/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", { children: [
			"Open",
			" ",
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
				to: "/profile",
				className: "not-typeset text-primary",
				children: "your profile"
			}),
			" ",
			"to apply these tools. Self-exclusion takes effect immediately."
		] }),
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", { children: "Need Help?" }),
		/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", { children: [
			"If gambling is affecting your life, contact",
			" ",
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("a", {
				href: "https://www.begambleaware.org/",
				rel: "noreferrer",
				target: "_blank",
				children: "BeGambleAware"
			}),
			" ",
			"or",
			" ",
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("a", {
				href: "https://www.gamblersanonymous.org/",
				rel: "noreferrer",
				target: "_blank",
				children: "Gamblers Anonymous"
			}),
			"."
		] }),
		/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", { children: [
			"You can also email",
			" ",
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("a", {
				href: "mailto:support@tols.fun",
				children: "support@tols.fun"
			}),
			" to request account closure or a cooling-off period. See also our",
			" ",
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
				to: "/terms",
				className: "not-typeset text-primary",
				children: "Terms of Service"
			}),
			"."
		] })
	] });
}
function ResponsiblePage() {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(LegalPage, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ResponsibleContent, {}) });
}
//#endregion
export { ResponsiblePage as component };
