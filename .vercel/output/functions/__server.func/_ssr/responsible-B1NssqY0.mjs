import { r as __exportAll } from "../_runtime.mjs";
import { c as __exportAll$1 } from "./ssr.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/responsible-B1NssqY0.js
var responsible_B1NssqY0_exports = /* @__PURE__ */ __exportAll({
	i: () => saveResponsible,
	n: () => loadResponsible,
	r: () => responsible_exports,
	t: () => isSelfExcluded
});
var responsible_exports = /* @__PURE__ */ __exportAll$1({
	isSelfExcluded: () => isSelfExcluded,
	loadResponsible: () => loadResponsible,
	saveResponsible: () => saveResponsible
});
var KEY = "tols-responsible";
var EMPTY = {
	excludedUntil: null,
	depositLimit: null,
	wagerLimit: null,
	lossLimit: null,
	sessionMinutes: null
};
function loadResponsible() {
	if (typeof window === "undefined") return EMPTY;
	try {
		const raw = window.localStorage.getItem(KEY);
		if (!raw) return EMPTY;
		return {
			...EMPTY,
			...JSON.parse(raw)
		};
	} catch {
		return EMPTY;
	}
}
function saveResponsible(next) {
	window.localStorage.setItem(KEY, JSON.stringify(next));
}
function isSelfExcluded(settings = loadResponsible()) {
	return Boolean(settings.excludedUntil && settings.excludedUntil > Date.now());
}
//#endregion
export { saveResponsible as i, loadResponsible as n, responsible_B1NssqY0_exports as r, isSelfExcluded as t };
