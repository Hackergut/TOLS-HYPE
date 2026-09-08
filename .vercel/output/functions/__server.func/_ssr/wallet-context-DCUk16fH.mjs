import { o as __toESM } from "../_runtime.mjs";
import { n as CURRENCIES } from "./games-catalog-kDIyglwq.mjs";
import { u as require_react } from "../_libs/@floating-ui/react-dom+[...].mjs";
import { c as require_jsx_runtime } from "../_libs/@radix-ui/react-arrow+[...].mjs";
import { a as getServerFnById, i as TSS_SERVER_FUNCTION, r as createServerFn } from "./ssr.mjs";
import { n as authMiddleware } from "./format-RUsy5oTU.mjs";
import { D as _enum, F as object, P as number, R as string, k as array } from "../_libs/@better-auth/core+[...].mjs";
import { n as toast } from "../_libs/sonner.mjs";
import { n as useCurrentUserState } from "./use-current-user-ClOiUQ-z.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/wallet-context-DCUk16fH.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
var createSsrRpc = (functionId) => {
	const url = "/_serverFn/" + functionId;
	const serverFnMeta = { id: functionId };
	const fn = async (...args) => {
		return (await getServerFnById(functionId, { origin: "server" }))(...args);
	};
	return Object.assign(fn, {
		url,
		serverFnMeta,
		[TSS_SERVER_FUNCTION]: true
	});
};
var currencySchema = _enum(CURRENCIES);
var getWallet = createServerFn({ method: "GET" }).middleware([authMiddleware]).handler(createSsrRpc("dd28cfe795d1dbefb28f361d43d3a93d1841bbe513d4afba8eb4354ffa6034fe"));
var cashier = createServerFn({ method: "POST" }).middleware([authMiddleware]).validator(object({
	action: _enum(["deposit", "withdraw"]),
	currency: currencySchema,
	amount: number().positive()
})).handler(createSsrRpc("93e3a52548e5d8428a36bc2c7e061a63bf2af542df1c6e23634800531e04d885"));
var playInstant = createServerFn({ method: "POST" }).middleware([authMiddleware]).validator(object({
	gameId: string(),
	currency: currencySchema,
	amount: number().positive(),
	choice: string().optional(),
	target: number().min(.01).max(98).optional()
})).handler(createSsrRpc("9d47c4f3eaba3984dbd497fee465e1f0e2a064c7e11e1b140a45fc0872cd85de"));
var placeSportBet = createServerFn({ method: "POST" }).middleware([authMiddleware]).validator(object({
	eventId: string(),
	side: _enum(["home", "away"]),
	odds: number().positive(),
	amount: number().positive(),
	currency: currencySchema
})).handler(createSsrRpc("ca51cf478f03db9c49032bafe31be930e6576575c2f21f5fb4b9a27dcd517233"));
var startCrash = createServerFn({ method: "POST" }).middleware([authMiddleware]).validator(object({
	gameId: string(),
	currency: currencySchema,
	amount: number().positive()
})).handler(createSsrRpc("1504078ce54c1d717a1029fd8a375985efa2b3618fc3978b5d9a388b22c8065e"));
var cashOutCrash = createServerFn({ method: "POST" }).middleware([authMiddleware]).validator(object({ roundId: string() })).handler(createSsrRpc("df55947c78642a56fd011a5d62b399f03ec332905f91c84906979f11879096e1"));
var peekCrash = createServerFn({ method: "POST" }).middleware([authMiddleware]).validator(object({ roundId: string() })).handler(createSsrRpc("faee627521a3bc42526668ee48da04eb79d9d7143781ed9d67318bb914556fa7"));
var startMines = createServerFn({ method: "POST" }).middleware([authMiddleware]).validator(object({
	gameId: string(),
	currency: currencySchema,
	amount: number().positive(),
	mineCount: number().int().min(1).max(24).optional()
})).handler(createSsrRpc("f71d555fa0d442092cda5cc44942511c5f677f6ec581470d49dbddcb1aeed965"));
var revealMine = createServerFn({ method: "POST" }).middleware([authMiddleware]).validator(object({
	roundId: string(),
	index: number().int().min(0).max(24)
})).handler(createSsrRpc("9a71d3ebeda9d01fe68123d22413cc35c6d64b6acb712bf4d425bff5d360d7e2"));
var cashOutMines = createServerFn({ method: "POST" }).middleware([authMiddleware]).validator(object({ roundId: string() })).handler(createSsrRpc("c7be0a6d740a409207a2efd1559b8c4bdf27db530fdfa244fc726e0158bddcd7"));
var dealBlackjack = createServerFn({ method: "POST" }).middleware([authMiddleware]).validator(object({
	gameId: string(),
	currency: currencySchema,
	amount: number().positive()
})).handler(createSsrRpc("f1649fd2349f64636824abb3ad298c9bc2bd70dc3378067bd3922e8fb88ae8cd"));
var blackjackAction = createServerFn({ method: "POST" }).middleware([authMiddleware]).validator(object({
	roundId: string(),
	action: _enum([
		"hit",
		"stand",
		"double"
	])
})).handler(createSsrRpc("4201008c36c3d839411dceb4863018a797c6adf0c4a186053710ca7501372c41"));
var playKeno = createServerFn({ method: "POST" }).middleware([authMiddleware]).validator(object({
	gameId: string(),
	currency: currencySchema,
	amount: number().positive(),
	picks: array(number().int().min(1).max(40)).min(1).max(10),
	risk: _enum([
		"classic",
		"low",
		"normie",
		"degen"
	])
})).handler(createSsrRpc("10d3709ddbe0846f809aa5f4c3f29de518d245935f37dbff1a297b21b5535791"));
var startHilo = createServerFn({ method: "POST" }).middleware([authMiddleware]).validator(object({ gameId: string() })).handler(createSsrRpc("75e56d5af3994a7d4d1f5d3c7338a245dc841ce84e1551b6d8540f5c6a1eaec6"));
var playHilo = createServerFn({ method: "POST" }).middleware([authMiddleware]).validator(object({
	roundId: string(),
	currency: currencySchema,
	amount: number().positive(),
	pick: _enum(["higher", "lower"])
})).handler(createSsrRpc("976553eab12d5bdd698a9c3f4fc1f36a872c8dc2f3d37cd96c717ea4e3ab5e63"));
var WalletContext = (0, import_react.createContext)(null);
var EMPTY = {
	USDT: 0,
	BTC: 0,
	ETH: 0
};
function WalletProvider({ children }) {
	const { user, isPending } = useCurrentUserState();
	const [currency, setCurrency] = (0, import_react.useState)("USDT");
	const [snapshot, setSnapshot] = (0, import_react.useState)(null);
	const [loading, setLoading] = (0, import_react.useState)(false);
	const refresh = (0, import_react.useCallback)(async () => {
		if (!user) {
			setSnapshot(null);
			return;
		}
		setLoading(true);
		try {
			const next = await getWallet();
			setSnapshot(next);
		} catch {} finally {
			setLoading(false);
		}
	}, [user]);
	(0, import_react.useEffect)(() => {
		if (isPending) return;
		refresh();
	}, [isPending, refresh]);
	const applyBalances = (0, import_react.useCallback)((balances) => {
		setSnapshot((prev) => prev ? {
			...prev,
			balances
		} : {
			balances,
			wagered: 0,
			transactions: []
		});
	}, []);
	const runCashier = (0, import_react.useCallback)(async (action, amount) => {
		const result = await cashier({ data: {
			action,
			currency,
			amount
		} });
		applyBalances(result.balances);
		toast.success(action === "deposit" ? "Deposit credited" : "Withdrawal sent");
		refresh();
	}, [
		applyBalances,
		currency,
		refresh
	]);
	const value = (0, import_react.useMemo)(() => ({
		currency,
		setCurrency,
		balances: snapshot?.balances ?? EMPTY,
		wagered: snapshot?.wagered ?? 0,
		transactions: snapshot?.transactions ?? [],
		loading: loading || isPending,
		refresh,
		applyBalances,
		deposit: (amount) => runCashier("deposit", amount),
		withdraw: (amount) => runCashier("withdraw", amount)
	}), [
		applyBalances,
		currency,
		isPending,
		loading,
		refresh,
		runCashier,
		snapshot
	]);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(WalletContext.Provider, {
		value,
		children
	});
}
function useWallet() {
	const ctx = (0, import_react.useContext)(WalletContext);
	if (!ctx) throw new Error("useWallet must be used within WalletProvider");
	return ctx;
}
//#endregion
export { dealBlackjack as a, playHilo as c, revealMine as d, startCrash as f, useWallet as h, cashOutMines as i, playInstant as l, startMines as m, blackjackAction as n, peekCrash as o, startHilo as p, cashOutCrash as r, placeSportBet as s, WalletProvider as t, playKeno as u };
