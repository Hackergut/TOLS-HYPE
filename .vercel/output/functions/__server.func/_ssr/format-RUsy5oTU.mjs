import { n as createMiddleware } from "./ssr.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/format-RUsy5oTU.js
/**
* Auth middleware for server functions — the standard way to get the caller's
* verified user id. When deployed the session cookie is same-origin and rides
* along automatically. In the live preview the client also forwards the bearer
* token (partitioned cookies) via the `.client` hook below — call sites do not
* thread it themselves.
*
*   import { createServerFn } from "@tanstack/react-start";
*   import { getSql } from "@/lib/db";
*   import { authMiddleware } from "@/lib/auth/middleware";
*
*   export const listTodos = createServerFn({ method: "GET" })
*     .middleware([authMiddleware])
*     .handler(async ({ context }) => {
*       const sql = await getSql();
*       return sql`select * from todos where user_id = ${context.userId}`;
*     });
*
* Signed out with auth on (live preview included) -> throws `UnauthorizedError`
* (see `verify.server.ts`). With auth disabled (`VITE_AUTH_ENABLED=false`, the
* shipped default) it resolves the shared dev user — but throws instead when a
* `DATABASE_URL` is also set, so an app without sign-in must not use this at
* all. On the auth-on path, use it on every server function that touches
* per-user data and scope every query by `context.userId`.
*/
var authMiddleware = createMiddleware({ type: "function" }).client(async ({ next }) => {
	const { getBearerToken } = await import("./client-CVqXY6bk.mjs").then((n) => n.n).then((n) => n.n);
	return next({ sendContext: { bearerToken: getBearerToken() ?? void 0 } });
}).server(async ({ next, context }) => {
	const { assertSameSiteRequest } = await import("./isolation.server-CGNg1r0B.mjs");
	const { requireUserId } = await import("./verify.server-B6WKYP50.mjs");
	assertSameSiteRequest();
	return next({ context: { userId: await requireUserId(context.bearerToken) } });
});
function asNumber(value) {
	if (typeof value === "number") return Number.isFinite(value) ? value : 0;
	if (typeof value === "string") {
		const n = Number(value);
		return Number.isFinite(n) ? n : 0;
	}
	return 0;
}
function formatMoney(amount, currency) {
	const n = asNumber(amount);
	const digits = currency === "USDT" ? 2 : currency === "ETH" ? 5 : 6;
	return n.toLocaleString("en-US", {
		minimumFractionDigits: 2,
		maximumFractionDigits: digits
	});
}
function formatMultiplier(n) {
	return `${n.toFixed(2)}x`;
}
function shortAddress(address) {
	if (address.length < 12) return address;
	return `${address.slice(0, 6)}…${address.slice(-4)}`;
}
function mockAddressFromUserId(userId) {
	let hash = 0;
	for (let i = 0; i < userId.length; i += 1) hash = hash * 31 + userId.charCodeAt(i) >>> 0;
	return `0x${(hash.toString(16) + "c0ffeevegas").padEnd(40, "a").slice(0, 40)}`;
}
//#endregion
export { mockAddressFromUserId as a, formatMultiplier as i, authMiddleware as n, shortAddress as o, formatMoney as r, asNumber as t };
