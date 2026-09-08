import "../_runtime.mjs";
import { u as require_react } from "../_libs/@floating-ui/react-dom+[...].mjs";
import { c as require_jsx_runtime, i as Slot } from "../_libs/@radix-ui/react-arrow+[...].mjs";
import { t as cn } from "../_libs/cn.mjs";
import { t as cva } from "../_libs/class-variance-authority+clsx.mjs";
import { v as Link } from "../_libs/@tanstack/react-router+[...].mjs";
require_react();
var import_jsx_runtime = require_jsx_runtime();
var badgeVariants = cva("group/badge inline-flex h-5 w-fit shrink-0 items-center justify-center gap-1 overflow-hidden rounded-full border border-transparent px-2 py-0.5 text-[0.625rem] font-medium whitespace-nowrap transition-all focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 has-data-[icon=inline-end]:pr-1.5 has-data-[icon=inline-start]:pl-1.5 aria-invalid:border-destructive aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 [&>svg]:pointer-events-none [&>svg]:size-2.5!", {
	variants: { variant: {
		default: "bg-primary text-primary-foreground [a]:hover:bg-primary/80",
		secondary: "bg-secondary text-secondary-foreground [a]:hover:bg-secondary/80",
		destructive: "bg-destructive/10 text-destructive focus-visible:ring-destructive/20 dark:bg-destructive/20 dark:focus-visible:ring-destructive/40 [a]:hover:bg-destructive/20",
		outline: "border-border bg-input/20 text-foreground dark:bg-input/30 [a]:hover:bg-muted [a]:hover:text-muted-foreground",
		ghost: "hover:bg-muted hover:text-muted-foreground dark:hover:bg-muted/50",
		link: "text-primary underline-offset-4 hover:underline"
	} },
	defaultVariants: { variant: "default" }
});
function Badge({ className, variant = "default", asChild = false, ...props }) {
	const Comp = asChild ? Slot : "span";
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Comp, {
		"data-slot": "badge",
		"data-variant": variant,
		className: cn(badgeVariants({ variant }), className),
		...props
	});
}
function GameCard({ game }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
		to: "/games/$id",
		params: { id: game.id },
		className: "group block focus-visible:outline-none",
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("article", {
			className: "overflow-hidden rounded-2xl bg-card transition-transform duration-(--motion-fast) ease-(--ease-smooth-out) group-hover:-translate-y-0.5",
			children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "relative",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "aspect-[3/4] overflow-hidden bg-muted",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("img", {
							src: game.cover,
							alt: "",
							className: "size-full object-cover transition-transform duration-(--motion-fast) group-hover:scale-105"
						})
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "pointer-events-none absolute inset-0 bg-linear-to-t from-black/80 via-black/10 to-transparent" }),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "absolute top-2 left-2 right-2 flex justify-between gap-1.5",
						children: [game.original ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Badge, {
							className: "border-0 bg-primary text-primary-foreground",
							children: "ORIGINAL"
						}) : game.live ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Badge, {
							className: "border-0 bg-destructive text-white",
							children: "Live"
						}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {}), game.hot ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Badge, {
							className: "border-0 bg-black/80 text-white",
							children: "HOT"
						}) : game.isNew ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Badge, {
							className: "border-0 bg-black/80 text-white",
							children: "NEW"
						}) : null]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "absolute inset-x-0 bottom-0 p-3",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "flex items-end justify-between gap-2",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h3", {
								className: "font-heading text-sm font-semibold tracking-tight text-white",
								children: game.title
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "text-[0.7rem] text-white/65",
								children: game.provider
							})] }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
								className: "text-xs font-semibold tabular-nums text-lime",
								children: [game.rtp.toFixed(1), "%"]
							})]
						})
					})
				]
			})
		})
	});
}
function GameGrid({ games }) {
	if (games.length === 0) return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
		className: "text-sm text-muted-foreground",
		children: "No tables in this category yet."
	});
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		className: "grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5",
		children: games.map((game) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(GameCard, { game }, game.id))
	});
}
//#endregion
export { GameGrid as t };
