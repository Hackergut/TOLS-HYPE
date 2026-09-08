import { i as GAMES } from "./games-catalog-kDIyglwq.mjs";
import { c as require_jsx_runtime } from "../_libs/@radix-ui/react-arrow+[...].mjs";
import { t as GameGrid } from "./game-grid-9Bb752FD.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/live-DwqIitwL.js
var import_jsx_runtime = require_jsx_runtime();
function LivePage() {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("main", {
		className: "mx-auto flex w-full max-w-6xl flex-col gap-6",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("header", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
			className: "font-heading text-3xl font-semibold tracking-tight",
			children: "Live casino"
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
			className: "mt-1 text-sm text-muted-foreground",
			children: "Studio-paced tables. Same math as the originals, live badge on."
		})] }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(GameGrid, { games: GAMES.filter((g) => g.live) })]
	});
}
//#endregion
export { LivePage as component };
