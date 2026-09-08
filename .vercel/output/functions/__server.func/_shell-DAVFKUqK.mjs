import { o as __toESM } from "./_runtime.mjs";
import { a as HERO_SLIDES, i as GAMES, l as gamesByCategory, o as PROMOS, t as CATEGORIES } from "./_ssr/games-catalog-kDIyglwq.mjs";
import { u as require_react } from "./_libs/@floating-ui/react-dom+[...].mjs";
import { c as require_jsx_runtime } from "./_libs/@radix-ui/react-arrow+[...].mjs";
import { t as Button } from "./_ssr/button-BZfbrQLK.mjs";
import { v as Link } from "./_libs/@tanstack/react-router+[...].mjs";
import { t as GameGrid } from "./_ssr/game-grid-9Bb752FD.mjs";
import { E as r2, a as J1, i as Gr } from "./_libs/remixicon__react.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/_shell-DAVFKUqK.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
function Hero() {
	const [i, setI] = (0, import_react.useState)(0);
	const slide = HERO_SLIDES[i];
	(0, import_react.useEffect)(() => {
		const t = window.setInterval(() => setI((n) => (n + 1) % HERO_SLIDES.length), 7e3);
		return () => window.clearInterval(t);
	}, []);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("section", {
		className: "relative overflow-hidden rounded-2xl bg-card shadow-[var(--shadow-glow)]",
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "relative min-h-44 w-full md:min-h-72 lg:min-h-80",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("img", {
					src: slide.image,
					alt: "",
					className: "absolute inset-0 size-full object-cover",
					style: { objectPosition: slide.position }
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "absolute inset-0 bg-linear-to-r from-black/80 via-black/45 to-transparent" }),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "relative z-10 flex h-full min-h-44 flex-col justify-end gap-2 p-4 md:min-h-72 md:gap-3 md:p-8",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("h1", {
							className: "font-heading text-2xl font-black tracking-tight uppercase md:text-5xl",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: "text-primary",
									children: slide.titleLime
								}),
								" ",
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: "text-white",
									children: slide.titleRest
								})
							]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "max-w-md text-xs text-white/75 md:text-sm",
							children: slide.subtitle
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
							asChild: true,
							className: "mt-1 h-10 w-fit rounded-lg border border-primary bg-transparent px-5 font-semibold text-primary hover:bg-primary hover:text-primary-foreground md:h-11 md:px-6",
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
								to: "/games/$id",
								params: { id: slide.id },
								children: slide.cta
							})
						})
					]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
					type: "button",
					className: "absolute top-1/2 left-2 z-10 grid size-9 -translate-y-1/2 place-items-center rounded-full bg-black/50 text-white md:left-3 md:size-10",
					onClick: () => setI((n) => (n + HERO_SLIDES.length - 1) % HERO_SLIDES.length),
					"aria-label": "Previous",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(J1, {})
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
					type: "button",
					className: "absolute top-1/2 right-2 z-10 grid size-9 -translate-y-1/2 place-items-center rounded-full bg-black/50 text-white md:right-3 md:size-10",
					onClick: () => setI((n) => (n + 1) % HERO_SLIDES.length),
					"aria-label": "Next",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(r2, {})
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "absolute bottom-3 left-1/2 z-10 flex -translate-x-1/2 gap-1.5",
					children: HERO_SLIDES.map((s, idx) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
						type: "button",
						"aria-label": `Slide ${idx + 1}`,
						className: `h-1 rounded-full transition-all ${idx === i ? "w-6 bg-primary" : "w-2 bg-white/40"}`,
						onClick: () => setI(idx)
					}, s.id))
				})
			]
		})
	});
}
function PromoBanner() {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
		className: "flex flex-col gap-3",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "flex items-end justify-between gap-3",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("h2", {
				className: "font-heading flex items-center gap-2 text-xl font-bold tracking-tight uppercase",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Gr, { className: "size-5 text-primary" }), "Promotions"]
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "mt-0.5 text-xs text-muted-foreground",
				children: "Every official TOLS offer — tap a card for full details"
			})] }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
				to: "/promotions",
				className: "rounded-full border border-border px-3 py-1.5 text-xs text-muted-foreground hover:text-foreground",
				children: "All promos"
			})]
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
			className: "flex gap-3 overflow-x-auto pb-1",
			children: PROMOS.map((p) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Link, {
				to: "/promotions",
				hash: p.id,
				className: "relative min-w-64 shrink-0 overflow-hidden rounded-2xl bg-card sm:min-w-72",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("img", {
						src: p.image,
						alt: "",
						className: "h-40 w-full object-cover"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "absolute inset-0 bg-linear-to-t from-black/85 via-black/25 to-transparent" }),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "absolute top-2 left-2 flex gap-1.5",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							className: "rounded-md bg-black/70 px-1.5 py-0.5 text-[0.6rem] font-semibold tracking-wider text-primary uppercase",
							children: p.kicker
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							className: "rounded-md bg-black/70 px-1.5 py-0.5 text-[0.6rem] font-semibold tracking-wider text-white uppercase",
							children: p.tag
						})]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "absolute inset-x-0 bottom-0 p-3",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h3", {
								className: "font-heading text-base font-bold text-white uppercase",
								children: p.title
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "mt-0.5 line-clamp-1 text-xs text-white/70",
								children: p.copy
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: "mt-2 inline-flex rounded-full bg-primary px-2 py-0.5 text-[0.65rem] font-semibold text-primary-foreground",
								children: p.badge
							})
						]
					})
				]
			}, p.id))
		})]
	});
}
function Home() {
	const [cat, setCat] = (0, import_react.useState)("all");
	const originals = GAMES.filter((g) => g.original);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("main", {
		className: "mx-auto flex w-full max-w-6xl flex-col gap-6 md:gap-8",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Hero, {}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "no-scrollbar -mx-3 flex gap-2 overflow-x-auto px-3 md:mx-0 md:flex-wrap md:overflow-visible md:px-0",
				children: CATEGORIES.map((c) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
					variant: cat === c.id ? "default" : "outline",
					className: "h-10 shrink-0 rounded-full px-4",
					onClick: () => setCat(c.id),
					children: c.label
				}, c.id))
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(PromoBanner, {}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
				className: "font-heading mb-4 text-lg font-bold tracking-tight md:text-xl",
				children: "Originals"
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(GameGrid, { games: cat === "all" ? originals : gamesByCategory(cat) })] }),
			cat === "all" ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
				className: "font-heading mb-4 text-lg font-bold tracking-tight md:text-xl",
				children: "Full lobby"
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(GameGrid, { games: GAMES })] }) : null
		]
	});
}
//#endregion
export { Home as component };
