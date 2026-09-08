import { o as __toESM } from "../_runtime.mjs";
import { l as gamesByCategory, t as CATEGORIES } from "./games-catalog-kDIyglwq.mjs";
import { u as require_react } from "../_libs/@floating-ui/react-dom+[...].mjs";
import { c as require_jsx_runtime } from "../_libs/@radix-ui/react-arrow+[...].mjs";
import { t as Button } from "./button-BZfbrQLK.mjs";
import { t as GameGrid } from "./game-grid-9Bb752FD.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/casino-D2Wcu5DE.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
function CasinoPage() {
	const [cat, setCat] = (0, import_react.useState)("all");
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("main", {
		className: "mx-auto flex w-full max-w-6xl flex-col gap-6",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("header", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
				className: "font-heading text-2xl font-bold tracking-tight md:text-3xl",
				children: "Casino"
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "mt-1 text-sm text-muted-foreground",
				children: "Originals, tables, live, and slots."
			})] }),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "no-scrollbar -mx-3 flex gap-2 overflow-x-auto px-3 md:mx-0 md:flex-wrap md:overflow-visible md:px-0",
				children: CATEGORIES.map((c) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
					variant: cat === c.id ? "default" : "outline",
					className: "h-10 shrink-0 rounded-full px-4",
					onClick: () => setCat(c.id),
					children: c.label
				}, c.id))
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(GameGrid, { games: gamesByCategory(cat) })
		]
	});
}
//#endregion
export { CasinoPage as component };
