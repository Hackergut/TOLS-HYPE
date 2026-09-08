import { o as PROMOS } from "./games-catalog-kDIyglwq.mjs";
import { c as require_jsx_runtime } from "../_libs/@radix-ui/react-arrow+[...].mjs";
import { t as Button } from "./button-BZfbrQLK.mjs";
import { v as Link } from "../_libs/@tanstack/react-router+[...].mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/promotions-C29tsfho.js
var import_jsx_runtime = require_jsx_runtime();
function PromotionsPage() {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("main", {
		className: "mx-auto flex w-full max-w-6xl flex-col gap-6",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("header", { children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "text-xs font-medium tracking-[0.18em] text-primary uppercase",
				children: "10 games"
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
				className: "font-heading mt-1 text-3xl font-bold tracking-tight",
				children: "Promotions"
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "mt-1 text-sm text-muted-foreground",
				children: "Every official TOLS promotion, in one place"
			})
		] }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("ul", {
			className: "grid gap-4 md:grid-cols-2",
			children: PROMOS.map((p) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", {
				id: p.id,
				className: "scroll-mt-20 overflow-hidden rounded-2xl bg-card shadow-[var(--shadow-border)]",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("img", {
					src: p.image,
					alt: "",
					className: "h-40 w-full object-cover"
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "p-5",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "flex flex-wrap gap-1.5",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: "rounded-md bg-primary/15 px-1.5 py-0.5 text-[0.6rem] font-semibold tracking-wider text-primary uppercase",
								children: p.kicker
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: "rounded-md bg-muted px-1.5 py-0.5 text-[0.6rem] font-semibold tracking-wider text-muted-foreground uppercase",
								children: p.tag
							})]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
							className: "font-heading mt-3 text-xl font-semibold",
							children: p.title
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "mt-1 text-sm text-muted-foreground",
							children: p.copy
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "mt-3 font-heading text-lg font-bold text-lime",
							children: p.badge
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "mt-2 text-sm leading-relaxed text-muted-foreground",
							children: p.body
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("ul", {
							className: "mt-3 space-y-1 text-sm text-muted-foreground",
							children: p.bullets.map((b) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", { children: ["· ", b] }, b))
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
							asChild: true,
							className: "mt-4 h-10",
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
								to: p.to,
								children: p.cta
							})
						})
					]
				})]
			}, p.id))
		})]
	});
}
//#endregion
export { PromotionsPage as component };
