import { o as __toESM } from "../_runtime.mjs";
import { u as require_react } from "../_libs/@floating-ui/react-dom+[...].mjs";
import { c as require_jsx_runtime } from "../_libs/@radix-ui/react-arrow+[...].mjs";
import { t as cn } from "../_libs/cn.mjs";
import { a as Root3, i as Provider, n as Content2, o as Trigger, r as Portal, t as Arrow2 } from "../_libs/@radix-ui/react-tooltip+[...].mjs";
import { _ as createRootRoute, g as createFileRoute, h as lazyRouteComponent, l as Scripts, m as Outlet, p as createRouter, u as HeadContent, x as useRouter } from "../_libs/@tanstack/react-router+[...].mjs";
import { c as Om, g as ba, p as Rt, t as A7, x as m7 } from "../_libs/remixicon__react.mjs";
import { c as __exportAll } from "./ssr.mjs";
import { F as object, M as literal, P as number, R as string, z as union } from "../_libs/@better-auth/core+[...].mjs";
import { n as auth } from "./server-C9h8EWfT.mjs";
import { t as TriangleAlert } from "../_libs/lucide-react.mjs";
import { n as z, t as J } from "../_libs/next-themes.mjs";
import { t as Toaster } from "../_libs/sonner.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/router-BdGeUTok.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
var FALLBACK_MESSAGE = "An unexpected error occurred. Try reloading the page.";
function errorMessage(error) {
	if (error instanceof Error && error.message) return error.message;
	if (typeof error === "string" && error) return error;
	return FALLBACK_MESSAGE;
}
function AppErrorComponent({ error }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("main", {
		className: "flex min-h-screen flex-col items-center justify-center gap-3 px-6 text-center bg-zinc-50 text-zinc-900 dark:bg-zinc-950 dark:text-zinc-50",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
				className: "text-red-500",
				"aria-hidden": "true",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(TriangleAlert, {
					className: "size-10",
					strokeWidth: 2
				})
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
				className: "text-lg font-semibold",
				children: "Something went wrong"
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "max-w-md text-sm break-words text-zinc-500 dark:text-zinc-400",
				children: errorMessage(error)
			})
		]
	});
}
/**
* App-wide client provider mounted once near the root (in `src/routes/__root.tsx`):
*
*   <AuthProvider><Outlet /></AuthProvider>
*
* Better Auth's React client (`@/lib/auth/client`) needs NO context provider —
* its `useSession()` works standalone — so this is a passthrough today. It's
* kept as the single, stable mount point for any future client-side providers
* (e.g. a toast or theme provider) without churning the root shell.
*/
function AuthProvider({ children }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(import_jsx_runtime.Fragment, { children });
}
var CONNECTOR_TOKEN_READY_EVENT = "grok:connector-token-ready";
function isGrokEmbedderOrigin(origin) {
	try {
		const url = new URL(origin);
		if (url.protocol !== "https:" && url.protocol !== "http:") return false;
		const host = url.hostname.toLowerCase();
		if (host === "grok.com" || host.endsWith(".grok.com")) return true;
		if (host === "localhost" || host === "127.0.0.1" || host === "[::1]") return true;
		return false;
	} catch {
		return false;
	}
}
function isSandboxPreviewGuestHost(hostname) {
	const host = hostname.toLowerCase();
	return host === "grok-sandbox.com" || host.endsWith(".grok-sandbox.com");
}
function isRemintPreviewPair(guestHost, parentHost) {
	const guest = guestHost.toLowerCase();
	const parent = parentHost.toLowerCase();
	const i = guest.indexOf(".preview.");
	if (i <= 0) return false;
	const label = guest.slice(0, i);
	const rest = guest.slice(i + 9);
	if (label.includes(".") || !rest.includes(".")) return false;
	return parent === rest || parent === `grok.${rest}`;
}
function resolveParentEmbedderOrigin(parentIsSelf, referrer, ancestorOrigin, guestHostname = "") {
	if (parentIsSelf) return null;
	for (const candidate of [referrer, ancestorOrigin ?? ""].filter(Boolean)) try {
		const url = new URL(candidate.includes("://") ? candidate : `https://${candidate}`);
		if (url.protocol !== "https:" && url.protocol !== "http:") continue;
		if (isGrokEmbedderOrigin(url.origin)) return url.origin;
		if (isSandboxPreviewGuestHost(guestHostname) || isRemintPreviewPair(guestHostname, url.hostname)) return url.origin;
	} catch {}
	return null;
}
/**
* Guest side of the grok-web ↔ sandbox preview postMessage bridge.
*
* Activates only when this page is framed by an allowlisted Grok embedder.
* Top-level runs (download/export, local `npm run dev`, deployed sites) noop.
*/
var PREVIEW_BRIDGE_CHANNEL = "grok-preview-bridge";
var EnvelopeSchema = object({
	channel: literal(PREVIEW_BRIDGE_CHANNEL),
	version: number().int().positive(),
	type: string().min(1)
});
var HelloSchema = EnvelopeSchema.extend({ type: literal("hello") });
var NavigateSchema = EnvelopeSchema.extend({
	type: literal("navigate"),
	path: string().min(1)
});
var HistorySchema = EnvelopeSchema.extend({
	type: literal("history"),
	delta: union([literal(-1), literal(1)])
});
var ConnectorTokenReadySchema = EnvelopeSchema.extend({ type: literal("connector-token-ready") });
function isSafeBridgePath(path) {
	if (!path.startsWith("/") || path.startsWith("//") || path.includes("\\")) return false;
	try {
		return new URL(path, "https://preview.invalid").origin === "https://preview.invalid";
	} catch {
		return false;
	}
}
/**
* Origin of the Grok embedder framing this page, or null when the page runs
* top-level (download/export, local `npm run dev`, deployed sites) or under a
* non-Grok parent. Client-only; null during SSR.
*/
function resolveCurrentEmbedderOrigin() {
	if (typeof window === "undefined") return null;
	const ancestorOrigin = typeof location.ancestorOrigins !== "undefined" && location.ancestorOrigins.length > 0 ? location.ancestorOrigins[0] : null;
	return resolveParentEmbedderOrigin(window.parent === window, document.referrer, ancestorOrigin, window.location.hostname);
}
/**
* Install host↔guest messaging. Returns a dispose function.
* Noops (returns a no-op dispose) when not embedded under a Grok parent.
*/
function installPreviewHostBridge(options = {}) {
	const parentOrigin = resolveCurrentEmbedderOrigin();
	if (parentOrigin === null) return () => {};
	const ROOT_STATE_KEY = "__grokPreviewBridgeRoot";
	const originalPushState = window.history.pushState.bind(window.history);
	const originalReplaceState = window.history.replaceState.bind(window.history);
	const isAtHistoryRoot = () => {
		const state = window.history.state;
		return Boolean(state && typeof state === "object" && state[ROOT_STATE_KEY] === true);
	};
	try {
		const current = window.history.state;
		if (!(current !== null && typeof current === "object" && Object.prototype.hasOwnProperty.call(current, ROOT_STATE_KEY))) {
			const isRoot = window.history.length <= 1;
			originalReplaceState(current && typeof current === "object" ? {
				...current,
				[ROOT_STATE_KEY]: isRoot
			} : { [ROOT_STATE_KEY]: isRoot }, "", window.location.href);
		}
	} catch {}
	const post = (message) => {
		window.parent.postMessage(message, parentOrigin);
	};
	const reportLocation = () => {
		post({
			channel: PREVIEW_BRIDGE_CHANNEL,
			version: 1,
			type: "location",
			path: window.location.pathname || "/",
			search: window.location.search,
			hash: window.location.hash
		});
	};
	const reportRoutes = () => {
		const paths = options.getRoutePaths?.() ?? [];
		post({
			channel: PREVIEW_BRIDGE_CHANNEL,
			version: 1,
			type: "routes",
			paths
		});
	};
	const defaultNavigate = (path) => {
		if (!isSafeBridgePath(path)) return;
		try {
			const url = new URL(path, window.location.origin);
			if (url.origin !== window.location.origin) return;
			const next = `${url.pathname}${url.search}${url.hash}`;
			window.history.pushState(window.history.state, "", next);
			window.dispatchEvent(new PopStateEvent("popstate", { state: window.history.state }));
		} catch {}
	};
	const navigate = (path) => {
		if (!isSafeBridgePath(path)) return;
		if (options.navigate) {
			options.navigate(path);
			return;
		}
		defaultNavigate(path);
	};
	const announce = () => {
		reportLocation();
		reportRoutes();
		post({
			channel: PREVIEW_BRIDGE_CHANNEL,
			version: 1,
			type: "ready"
		});
	};
	const onHello = (data) => {
		if (!HelloSchema.safeParse(data).success) return;
		announce();
	};
	const onNavigate = (data) => {
		const parsed = NavigateSchema.safeParse(data);
		if (!parsed.success) return;
		navigate(parsed.data.path);
		queueMicrotask(reportLocation);
	};
	const onHistory = (data) => {
		const parsed = HistorySchema.safeParse(data);
		if (!parsed.success) return;
		if (parsed.data.delta === -1 && isAtHistoryRoot()) return;
		window.history.go(parsed.data.delta);
	};
	const onConnectorTokenReady = (data) => {
		if (!ConnectorTokenReadySchema.safeParse(data).success) return;
		window.dispatchEvent(new Event(CONNECTOR_TOKEN_READY_EVENT));
	};
	const hostMessageHandlers = /* @__PURE__ */ new Map([
		["hello", onHello],
		["navigate", onNavigate],
		["history", onHistory],
		["connector-token-ready", onConnectorTokenReady]
	]);
	const onMessage = (event) => {
		if (event.source !== window.parent) return;
		if (event.origin !== parentOrigin) return;
		const envelope = EnvelopeSchema.safeParse(event.data);
		if (!envelope.success || envelope.data.version !== 1) return;
		hostMessageHandlers.get(envelope.data.type)?.(event.data);
	};
	const onPopState = () => {
		reportLocation();
	};
	const onHashChange = () => {
		reportLocation();
	};
	window.history.pushState = (data, unused, url) => {
		const next = data && typeof data === "object" ? {
			...data,
			[ROOT_STATE_KEY]: false
		} : data;
		originalPushState(next, unused, url);
		reportLocation();
	};
	window.history.replaceState = (data, unused, url) => {
		const next = isAtHistoryRoot() ? {
			...data && typeof data === "object" ? data : {},
			[ROOT_STATE_KEY]: true
		} : data;
		originalReplaceState(next, unused, url);
		reportLocation();
	};
	window.addEventListener("message", onMessage);
	window.addEventListener("popstate", onPopState);
	window.addEventListener("hashchange", onHashChange);
	announce();
	return () => {
		window.removeEventListener("message", onMessage);
		window.removeEventListener("popstate", onPopState);
		window.removeEventListener("hashchange", onHashChange);
		window.history.pushState = originalPushState;
		window.history.replaceState = originalReplaceState;
	};
}
/** Collect static path patterns from a TanStack route tree (best-effort). */
function collectRoutePathsFromTree(routeTree) {
	const paths = /* @__PURE__ */ new Set();
	const walk = (node) => {
		if (!node || typeof node !== "object") return;
		const record = node;
		const full = typeof record.fullPath === "string" ? record.fullPath : typeof record.path === "string" ? record.path : null;
		if (full !== null && full !== "") paths.add(full.startsWith("/") ? full : `/${full}`);
		else if (full === "") paths.add("/");
		const children = record.children;
		if (Array.isArray(children)) for (const child of children) walk(child);
		else if (children && typeof children === "object") for (const child of Object.values(children)) walk(child);
	};
	walk(routeTree);
	return [...paths];
}
/**
* Mount once in `__root.tsx` so the Grok preview chrome can drive navigation
* (and later receive registered routes). Noops when the app is not embedded.
*/
function PreviewHostBridge() {
	const router = useRouter();
	(0, import_react.useEffect)(() => {
		return installPreviewHostBridge({
			navigate: (path) => {
				router.history.push(path);
			},
			getRoutePaths: () => collectRoutePathsFromTree(router.routeTree)
		});
	}, [router]);
	return null;
}
function TooltipProvider({ delayDuration = 0, ...props }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Provider, {
		"data-slot": "tooltip-provider",
		delayDuration,
		...props
	});
}
function Tooltip$1({ ...props }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Root3, {
		"data-slot": "tooltip",
		...props
	});
}
function TooltipTrigger({ ...props }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Trigger, {
		"data-slot": "tooltip-trigger",
		...props
	});
}
function TooltipContent({ className, sideOffset = 0, children, ...props }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Portal, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Content2, {
		"data-slot": "tooltip-content",
		sideOffset,
		className: cn("z-50 inline-flex w-fit max-w-xs origin-(--radix-tooltip-content-transform-origin) items-center gap-1.5 rounded-md bg-foreground px-3 py-1.5 text-xs text-background has-data-[slot=kbd]:pr-1.5 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2 **:data-[slot=kbd]:relative **:data-[slot=kbd]:isolate **:data-[slot=kbd]:z-50 **:data-[slot=kbd]:rounded-sm data-[state=delayed-open]:animate-in data-[state=delayed-open]:fade-in-0 data-[state=delayed-open]:zoom-in-95 data-open:animate-in data-open:fade-in-0 data-open:zoom-in-95 data-closed:animate-out data-closed:fade-out-0 data-closed:zoom-out-95", className),
		...props,
		children: [children, /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Arrow2, { className: "z-50 size-2.5 translate-y-[calc(-50%_-_2px)] rotate-45 rounded-[2px] bg-foreground fill-foreground" })]
	}) });
}
var Toaster$1 = ({ ...props }) => {
	const { theme = "system" } = z();
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Toaster, {
		theme,
		className: "toaster group",
		icons: {
			success: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(m7, { className: "size-4" }),
			info: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ba, { className: "size-4" }),
			warning: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Rt, { className: "size-4" }),
			error: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(A7, { className: "size-4" }),
			loading: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Om, { className: "size-4 animate-spin" })
		},
		style: {
			"--normal-bg": "var(--popover)",
			"--normal-text": "var(--popover-foreground)",
			"--normal-border": "var(--border)",
			"--border-radius": "var(--radius)"
		},
		toastOptions: { classNames: { toast: "cn-toast" } },
		...props
	});
};
var styles_default = "/assets/styles-Cz7zL57B.css";
var APP_NAME = "TOLS";
var Route$19 = createRootRoute({
	head: () => ({
		meta: [
			{ charSet: "utf-8" },
			{
				name: "viewport",
				content: "width=device-width, initial-scale=1, viewport-fit=cover"
			},
			{ title: APP_NAME },
			{
				name: "theme-color",
				content: "#1c1c22"
			},
			{
				name: "apple-mobile-web-app-capable",
				content: "yes"
			},
			{
				name: "apple-mobile-web-app-status-bar-style",
				content: "black-translucent"
			},
			{
				name: "description",
				content: "TOLS — originals casino for crash, roulette, blackjack, slots, dice, mines, keno, and hi-lo. Play-money balances."
			}
		],
		links: [
			{
				rel: "icon",
				type: "image/svg+xml",
				href: "/favicon.svg"
			},
			{
				rel: "stylesheet",
				href: styles_default
			},
			{
				rel: "manifest",
				href: "/__grok/manifest.webmanifest"
			},
			{
				rel: "apple-touch-icon",
				href: "/__grok/icon-180.png"
			},
			{
				rel: "preconnect",
				href: "https://fonts.googleapis.com"
			},
			{
				rel: "preconnect",
				href: "https://fonts.gstatic.com",
				crossOrigin: "anonymous"
			},
			{
				rel: "stylesheet",
				href: "https://fonts.googleapis.com/css2?family=Roboto:wght@400;500;700&family=Source+Sans+3:ital,wght@0,200..900;1,200..900&display=swap"
			}
		]
	}),
	component: RootComponent
});
function RootComponent() {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("html", {
		lang: "en",
		className: "dark antialiased font-source-sans-3 font-roboto",
		suppressHydrationWarning: true,
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("head", { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(HeadContent, {}) }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("body", {
			className: "min-h-dvh text-foreground",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(PreviewHostBridge, {}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(J, {
					attribute: "class",
					defaultTheme: "dark",
					forcedTheme: "dark",
					enableSystem: false,
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(AuthProvider, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(TooltipProvider, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Outlet, {}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Toaster$1, {})] }) })
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Scripts, {})
			]
		})]
	});
}
var $$splitComponentImporter$17 = () => import("../_shell-DgEeKBA6.mjs");
var Route$18 = createFileRoute("/_shell")({ component: lazyRouteComponent($$splitComponentImporter$17, "component") });
var $$splitComponentImporter$16 = () => import("./login-D10wnPVP.mjs");
var Route$17 = createFileRoute("/login")({ component: lazyRouteComponent($$splitComponentImporter$16, "component") });
var $$splitComponentImporter$15 = () => import("../_shell-DAVFKUqK.mjs");
var Route$16 = createFileRoute("/_shell/")({ component: lazyRouteComponent($$splitComponentImporter$15, "component") });
var $$splitComponentImporter$14 = () => import("./affiliate-C5SSGSL8.mjs");
var Route$15 = createFileRoute("/_shell/affiliate")({
	component: lazyRouteComponent($$splitComponentImporter$14, "component"),
	head: () => ({ meta: [{ title: "Affiliate Program — TOLS" }] })
});
var $$splitComponentImporter$13 = () => import("./aml-DQZUxb1Q.mjs");
var Route$14 = createFileRoute("/_shell/aml")({
	component: lazyRouteComponent($$splitComponentImporter$13, "component"),
	head: () => ({ meta: [{ title: "AML Policy — TOLS" }] })
});
var $$splitComponentImporter$12 = () => import("./casino-D2Wcu5DE.mjs");
var Route$13 = createFileRoute("/_shell/casino")({ component: lazyRouteComponent($$splitComponentImporter$12, "component") });
var $$splitComponentImporter$11 = () => import("./fairness-ErM9otyD.mjs");
var Route$12 = createFileRoute("/_shell/fairness")({ component: lazyRouteComponent($$splitComponentImporter$11, "component") });
var $$splitComponentImporter$10 = () => import("./help-Cr14W53Q.mjs");
var Route$11 = createFileRoute("/_shell/help")({
	component: lazyRouteComponent($$splitComponentImporter$10, "component"),
	head: () => ({ meta: [{ title: "Help Center — TOLS" }] })
});
var $$splitComponentImporter$9 = () => import("./live-DwqIitwL.mjs");
var Route$10 = createFileRoute("/_shell/live")({ component: lazyRouteComponent($$splitComponentImporter$9, "component") });
var $$splitComponentImporter$8 = () => import("./privacy-0gwC6UpK.mjs");
var Route$9 = createFileRoute("/_shell/privacy")({
	component: lazyRouteComponent($$splitComponentImporter$8, "component"),
	head: () => ({ meta: [{ title: "Privacy Policy — TOLS" }] })
});
var $$splitComponentImporter$7 = () => import("./profile-CRANAFjR.mjs");
var Route$8 = createFileRoute("/_shell/profile")({ component: lazyRouteComponent($$splitComponentImporter$7, "component") });
var $$splitComponentImporter$6 = () => import("./promotions-C29tsfho.mjs");
var Route$7 = createFileRoute("/_shell/promotions")({
	component: lazyRouteComponent($$splitComponentImporter$6, "component"),
	head: () => ({ meta: [{ title: "Promotions — TOLS" }] })
});
var $$splitComponentImporter$5 = () => import("./redeem-3kfmGjHs.mjs");
var Route$6 = createFileRoute("/_shell/redeem")({
	component: lazyRouteComponent($$splitComponentImporter$5, "component"),
	head: () => ({ meta: [{ title: "Redeem Code — TOLS" }] })
});
var $$splitComponentImporter$4 = () => import("./responsible-BhVfNc-T.mjs");
var Route$5 = createFileRoute("/_shell/responsible")({
	component: lazyRouteComponent($$splitComponentImporter$4, "component"),
	head: () => ({ meta: [{ title: "Responsible Gambling — TOLS" }] })
});
var $$splitComponentImporter$3 = () => import("./sports-6WwbIocJ.mjs");
var Route$4 = createFileRoute("/_shell/sports")({ component: lazyRouteComponent($$splitComponentImporter$3, "component") });
var $$splitComponentImporter$2 = () => import("./terms-T6_U4le0.mjs");
var Route$3 = createFileRoute("/_shell/terms")({
	component: lazyRouteComponent($$splitComponentImporter$2, "component"),
	head: () => ({ meta: [{ title: "Terms of Service — TOLS" }] })
});
var $$splitComponentImporter$1 = () => import("./vip-Bq5U7Fsv.mjs");
var Route$2 = createFileRoute("/_shell/vip")({
	component: lazyRouteComponent($$splitComponentImporter$1, "component"),
	head: () => ({ meta: [{ title: "VIP Program — TOLS" }] })
});
var $$splitComponentImporter = () => import("./games._id-Dzjp6J1y.mjs");
var Route$1 = createFileRoute("/_shell/games/$id")({ component: lazyRouteComponent($$splitComponentImporter, "component") });
var Route = createFileRoute("/api/auth/$")({ server: { handlers: {
	GET: ({ request }) => auth.handler(request),
	POST: ({ request }) => auth.handler(request)
} } });
var ShellRoute = Route$18.update({
	id: "/_shell",
	getParentRoute: () => Route$19
});
var LoginRoute = Route$17.update({
	id: "/login",
	path: "/login",
	getParentRoute: () => Route$19
});
var ShellIndexRoute = Route$16.update({
	id: "/",
	path: "/",
	getParentRoute: () => ShellRoute
});
var ShellAffiliateRoute = Route$15.update({
	id: "/affiliate",
	path: "/affiliate",
	getParentRoute: () => ShellRoute
});
var ShellAmlRoute = Route$14.update({
	id: "/aml",
	path: "/aml",
	getParentRoute: () => ShellRoute
});
var ShellCasinoRoute = Route$13.update({
	id: "/casino",
	path: "/casino",
	getParentRoute: () => ShellRoute
});
var ShellFairnessRoute = Route$12.update({
	id: "/fairness",
	path: "/fairness",
	getParentRoute: () => ShellRoute
});
var ShellHelpRoute = Route$11.update({
	id: "/help",
	path: "/help",
	getParentRoute: () => ShellRoute
});
var ShellLiveRoute = Route$10.update({
	id: "/live",
	path: "/live",
	getParentRoute: () => ShellRoute
});
var ShellPrivacyRoute = Route$9.update({
	id: "/privacy",
	path: "/privacy",
	getParentRoute: () => ShellRoute
});
var ShellProfileRoute = Route$8.update({
	id: "/profile",
	path: "/profile",
	getParentRoute: () => ShellRoute
});
var ShellPromotionsRoute = Route$7.update({
	id: "/promotions",
	path: "/promotions",
	getParentRoute: () => ShellRoute
});
var ShellRedeemRoute = Route$6.update({
	id: "/redeem",
	path: "/redeem",
	getParentRoute: () => ShellRoute
});
var ShellResponsibleRoute = Route$5.update({
	id: "/responsible",
	path: "/responsible",
	getParentRoute: () => ShellRoute
});
var ShellSportsRoute = Route$4.update({
	id: "/sports",
	path: "/sports",
	getParentRoute: () => ShellRoute
});
var ShellTermsRoute = Route$3.update({
	id: "/terms",
	path: "/terms",
	getParentRoute: () => ShellRoute
});
var ShellVipRoute = Route$2.update({
	id: "/vip",
	path: "/vip",
	getParentRoute: () => ShellRoute
});
var ShellGamesIdRoute = Route$1.update({
	id: "/games/$id",
	path: "/games/$id",
	getParentRoute: () => ShellRoute
});
var ApiAuthSplatRoute = Route.update({
	id: "/api/auth/$",
	path: "/api/auth/$",
	getParentRoute: () => Route$19
});
var ShellRouteChildren = {
	ShellAffiliateRoute,
	ShellAmlRoute,
	ShellCasinoRoute,
	ShellFairnessRoute,
	ShellHelpRoute,
	ShellLiveRoute,
	ShellPrivacyRoute,
	ShellProfileRoute,
	ShellPromotionsRoute,
	ShellRedeemRoute,
	ShellResponsibleRoute,
	ShellSportsRoute,
	ShellTermsRoute,
	ShellVipRoute,
	ShellIndexRoute,
	ShellGamesIdRoute
};
var rootRouteChildren = {
	ShellRoute: ShellRoute._addFileChildren(ShellRouteChildren),
	LoginRoute,
	ApiAuthSplatRoute
};
var routeTree = Route$19._addFileChildren(rootRouteChildren)._addFileTypes();
var router_exports = /* @__PURE__ */ __exportAll({ getRouter: () => getRouter });
function getRouter() {
	return createRouter({
		routeTree,
		defaultErrorComponent: AppErrorComponent
	});
}
//#endregion
export { TooltipTrigger as a, TooltipContent as i, Route$1 as n, Tooltip$1 as r, router_exports as t };
