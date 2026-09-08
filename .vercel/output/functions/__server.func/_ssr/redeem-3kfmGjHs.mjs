import { o as __toESM } from "../_runtime.mjs";
import { u as require_react } from "../_libs/@floating-ui/react-dom+[...].mjs";
import { c as require_jsx_runtime } from "../_libs/@radix-ui/react-arrow+[...].mjs";
import { t as Button } from "./button-BZfbrQLK.mjs";
import { v as Link } from "../_libs/@tanstack/react-router+[...].mjs";
import { n as toast } from "../_libs/sonner.mjs";
import { t as Input } from "./input-HW-MdT1M.mjs";
import { n as useCurrentUserState } from "./use-current-user-ClOiUQ-z.mjs";
import { t as Label$1 } from "./label-BLXCKpH1.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/redeem-3kfmGjHs.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
function RedeemPage() {
	const { user } = useCurrentUserState();
	const [code, setCode] = (0, import_react.useState)("");
	const [busy, setBusy] = (0, import_react.useState)(false);
	function onSubmit(e) {
		e.preventDefault();
		if (!user) return;
		setBusy(true);
		window.setTimeout(() => {
			if (code.trim().toUpperCase().startsWith("TOLS")) toast.success("Code applied to play-money balance");
			else toast.error("That code is not valid");
			setBusy(false);
		}, 400);
	}
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("main", {
		className: "mx-auto flex w-full max-w-md flex-col gap-6",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("header", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
			className: "font-heading text-3xl font-bold tracking-tight",
			children: "Redeem Code"
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
			className: "mt-1 text-sm text-muted-foreground",
			children: "Bonus, reload, and campaign codes."
		})] }), !user ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
			asChild: true,
			className: "h-11",
			children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
				to: "/login",
				children: "Sign in to redeem"
			})
		}) : /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("form", {
			className: "rounded-2xl bg-card p-5 shadow-[var(--shadow-border)]",
			onSubmit,
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label$1, {
					htmlFor: "code",
					children: "Code"
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
					id: "code",
					className: "mt-1.5 h-11 uppercase",
					value: code,
					onChange: (e) => setCode(e.target.value),
					placeholder: "TOLS100",
					required: true
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
					type: "submit",
					className: "mt-4 h-11 w-full",
					disabled: busy,
					children: "Redeem"
				})
			]
		})]
	});
}
//#endregion
export { RedeemPage as component };
