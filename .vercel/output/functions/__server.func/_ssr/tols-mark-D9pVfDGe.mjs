import { c as require_jsx_runtime } from "../_libs/@radix-ui/react-arrow+[...].mjs";
import { t as cn } from "../_libs/cn.mjs";
import { v as Link } from "../_libs/@tanstack/react-router+[...].mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/tols-mark-D9pVfDGe.js
var import_jsx_runtime = require_jsx_runtime();
/** Hollow lime T from the official mark. */
function TolsT({ className }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("img", {
		src: "/brand/tols-t.png",
		alt: "",
		className: cn("size-8 object-contain", className)
	});
}
/** Lime-outline TOLS wordmark from the official lockup. */
function TolsWordmark({ className }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("img", {
		src: "/brand/tols-wordmark.png",
		alt: "",
		className: cn("h-7 w-auto object-contain object-left", className)
	});
}
function TolsMark({ className, compact = false, large = false }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
		to: "/",
		className: cn("inline-flex items-center", className),
		"aria-label": "TOLS home",
		children: compact ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(TolsT, { className: "size-8" }) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(TolsWordmark, { className: large ? "h-9 w-auto sm:h-10" : "h-6 w-auto sm:h-7" })
	});
}
//#endregion
export { TolsT as n, TolsWordmark as r, TolsMark as t };
