import { c as require_jsx_runtime } from "../_libs/@radix-ui/react-arrow+[...].mjs";
import { v as Link } from "../_libs/@tanstack/react-router+[...].mjs";
import { o as K1 } from "../_libs/remixicon__react.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/legal-page-DrCe3aMs.js
var import_jsx_runtime = require_jsx_runtime();
function LegalPage({ children }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("main", {
		className: "mx-auto w-full max-w-[40rem]",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Link, {
			to: "/",
			className: "mb-6 inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(K1, { className: "size-4" }), "Back to TOLS"]
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
			className: "typeset typeset-docs max-w-[37em] rounded-2xl bg-card/80 px-5 py-6 shadow-[var(--shadow-glow)] md:px-8 md:py-8",
			children
		})]
	});
}
//#endregion
export { LegalPage as t };
