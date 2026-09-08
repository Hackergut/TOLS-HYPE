import { o as __toESM } from "./_runtime.mjs";
import { i as GAMES, n as CURRENCIES, r as CURRENCY_META } from "./_ssr/games-catalog-kDIyglwq.mjs";
import { u as require_react } from "./_libs/@floating-ui/react-dom+[...].mjs";
import { c as require_jsx_runtime, i as Slot } from "./_libs/@radix-ui/react-arrow+[...].mjs";
import { t as cn } from "./_libs/cn.mjs";
import { a as DialogOverlay$1, i as DialogDescription$1, n as DialogClose, o as DialogPortal$1, r as DialogContent$1, s as DialogTitle$1, t as Dialog } from "./_libs/@radix-ui/react-dialog+[...].mjs";
import { a as Trigger, i as Root2, n as Item2, r as Portal2, t as Content2 } from "./_libs/@radix-ui/react-dropdown-menu+[...].mjs";
import { t as cva } from "./_libs/class-variance-authority+clsx.mjs";
import { t as Button } from "./_ssr/button-BZfbrQLK.mjs";
import { b as useNavigate, d as useRouterState, m as Outlet, v as Link } from "./_libs/@tanstack/react-router+[...].mjs";
import { C as p, O as uo, S as n0, b as lf, d as Pf, f as RD, h as Zo, i as Gr, k as zH, m as Vd, n as Cp, r as Fl, s as Lz, u as P7, w as pv, y as ko } from "./_libs/remixicon__react.mjs";
import { a as mockAddressFromUserId, o as shortAddress, r as formatMoney } from "./_ssr/format-RUsy5oTU.mjs";
import { n as toast } from "./_libs/sonner.mjs";
import { a as TooltipTrigger, i as TooltipContent, r as Tooltip$1 } from "./_ssr/router-BdGeUTok.mjs";
import { t as Input } from "./_ssr/input-HW-MdT1M.mjs";
import { n as TolsT, r as TolsWordmark, t as TolsMark } from "./_ssr/tols-mark-D9pVfDGe.mjs";
import { n as useCurrentUserState, t as useCurrentUser } from "./_ssr/use-current-user-ClOiUQ-z.mjs";
import { i as UserButton, n as SignedIn, r as SignedOut } from "./_ssr/gates-BLdEs9lY.mjs";
import { h as useWallet, t as WalletProvider } from "./_ssr/wallet-context-DCUk16fH.mjs";
import { t as Label$1 } from "./_ssr/label-BLXCKpH1.mjs";
import { i as TabsTrigger, n as TabsContent, r as TabsList, t as Tabs$1 } from "./_ssr/tabs-ANMmb7YA.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/_shell-DgEeKBA6.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
var MOBILE_BREAKPOINT = 768;
function useIsMobile() {
	const [isMobile, setIsMobile] = import_react.useState(void 0);
	import_react.useEffect(() => {
		const mql = window.matchMedia(`(max-width: 767px)`);
		const onChange = () => {
			setIsMobile(window.innerWidth < MOBILE_BREAKPOINT);
		};
		mql.addEventListener("change", onChange);
		setIsMobile(window.innerWidth < MOBILE_BREAKPOINT);
		return () => mql.removeEventListener("change", onChange);
	}, []);
	return !!isMobile;
}
function Sheet({ ...props }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Dialog, {
		"data-slot": "sheet",
		...props
	});
}
function SheetPortal({ ...props }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(DialogPortal$1, {
		"data-slot": "sheet-portal",
		...props
	});
}
function SheetOverlay({ className, ...props }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(DialogOverlay$1, {
		"data-slot": "sheet-overlay",
		className: cn("fixed inset-0 z-50 bg-black/80 duration-100 supports-backdrop-filter:backdrop-blur-xs data-open:animate-in data-open:fade-in-0 data-closed:animate-out data-closed:fade-out-0", className),
		...props
	});
}
function SheetContent({ className, children, side = "right", showCloseButton = true, ...props }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(SheetPortal, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SheetOverlay, {}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(DialogContent$1, {
		"data-slot": "sheet-content",
		"data-side": side,
		className: cn("fixed z-50 flex flex-col bg-popover bg-clip-padding text-xs/relaxed text-popover-foreground shadow-lg transition duration-200 ease-in-out data-[side=bottom]:inset-x-0 data-[side=bottom]:bottom-0 data-[side=bottom]:h-auto data-[side=bottom]:border-t data-[side=left]:inset-y-0 data-[side=left]:left-0 data-[side=left]:h-full data-[side=left]:w-3/4 data-[side=left]:border-r data-[side=right]:inset-y-0 data-[side=right]:right-0 data-[side=right]:h-full data-[side=right]:w-3/4 data-[side=right]:border-l data-[side=top]:inset-x-0 data-[side=top]:top-0 data-[side=top]:h-auto data-[side=top]:border-b data-[side=left]:sm:max-w-sm data-[side=right]:sm:max-w-sm data-open:animate-in data-open:fade-in-0 data-[side=bottom]:data-open:slide-in-from-bottom-10 data-[side=left]:data-open:slide-in-from-left-10 data-[side=right]:data-open:slide-in-from-right-10 data-[side=top]:data-open:slide-in-from-top-10 data-closed:animate-out data-closed:fade-out-0 data-[side=bottom]:data-closed:slide-out-to-bottom-10 data-[side=left]:data-closed:slide-out-to-left-10 data-[side=right]:data-closed:slide-out-to-right-10 data-[side=top]:data-closed:slide-out-to-top-10", className),
		...props,
		children: [children, showCloseButton && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(DialogClose, {
			"data-slot": "sheet-close",
			asChild: true,
			children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
				variant: "ghost",
				className: "absolute top-4 right-4",
				size: "icon-sm",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(P7, {}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
					className: "sr-only",
					children: "Close"
				})]
			})
		})]
	})] });
}
function SheetHeader({ className, ...props }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		"data-slot": "sheet-header",
		className: cn("flex flex-col gap-1.5 p-6", className),
		...props
	});
}
function SheetTitle({ className, ...props }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(DialogTitle$1, {
		"data-slot": "sheet-title",
		className: cn("font-heading text-sm font-medium text-foreground", className),
		...props
	});
}
function SheetDescription({ className, ...props }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(DialogDescription$1, {
		"data-slot": "sheet-description",
		className: cn("text-xs/relaxed text-muted-foreground", className),
		...props
	});
}
function Skeleton({ className, ...props }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		"data-slot": "skeleton",
		className: cn("animate-pulse rounded-md bg-muted", className),
		...props
	});
}
var SIDEBAR_COOKIE_NAME = "sidebar_state";
var SIDEBAR_COOKIE_MAX_AGE = 604800;
var SIDEBAR_WIDTH = "16rem";
var SIDEBAR_WIDTH_MOBILE = "18rem";
var SIDEBAR_WIDTH_ICON = "3rem";
var SIDEBAR_KEYBOARD_SHORTCUT = "b";
var SidebarContext = import_react.createContext(null);
function useSidebar() {
	const context = import_react.useContext(SidebarContext);
	if (!context) throw new Error("useSidebar must be used within a SidebarProvider.");
	return context;
}
function SidebarProvider({ defaultOpen = true, open: openProp, onOpenChange: setOpenProp, className, style, children, ...props }) {
	const isMobile = useIsMobile();
	const [openMobile, setOpenMobile] = import_react.useState(false);
	const [_open, _setOpen] = import_react.useState(defaultOpen);
	const open = openProp ?? _open;
	const setOpen = import_react.useCallback((value) => {
		const openState = typeof value === "function" ? value(open) : value;
		if (setOpenProp) setOpenProp(openState);
		else _setOpen(openState);
		document.cookie = `${SIDEBAR_COOKIE_NAME}=${openState}; path=/; max-age=${SIDEBAR_COOKIE_MAX_AGE}`;
	}, [setOpenProp, open]);
	const toggleSidebar = import_react.useCallback(() => {
		return isMobile ? setOpenMobile((open) => !open) : setOpen((open) => !open);
	}, [
		isMobile,
		setOpen,
		setOpenMobile
	]);
	import_react.useEffect(() => {
		const handleKeyDown = (event) => {
			if (event.key === SIDEBAR_KEYBOARD_SHORTCUT && (event.metaKey || event.ctrlKey)) {
				event.preventDefault();
				toggleSidebar();
			}
		};
		window.addEventListener("keydown", handleKeyDown);
		return () => window.removeEventListener("keydown", handleKeyDown);
	}, [toggleSidebar]);
	const state = open ? "expanded" : "collapsed";
	const contextValue = import_react.useMemo(() => ({
		state,
		open,
		setOpen,
		isMobile,
		openMobile,
		setOpenMobile,
		toggleSidebar
	}), [
		state,
		open,
		setOpen,
		isMobile,
		openMobile,
		setOpenMobile,
		toggleSidebar
	]);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SidebarContext.Provider, {
		value: contextValue,
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
			"data-slot": "sidebar-wrapper",
			style: {
				"--sidebar-width": SIDEBAR_WIDTH,
				"--sidebar-width-icon": SIDEBAR_WIDTH_ICON,
				...style
			},
			className: cn("group/sidebar-wrapper flex min-h-svh w-full has-data-[variant=inset]:bg-sidebar", className),
			...props,
			children
		})
	});
}
function Sidebar({ side = "left", variant = "sidebar", collapsible = "offcanvas", className, children, dir, ...props }) {
	const { isMobile, state, openMobile, setOpenMobile } = useSidebar();
	if (collapsible === "none") return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		"data-slot": "sidebar",
		className: cn("flex h-full w-(--sidebar-width) flex-col bg-sidebar text-sidebar-foreground", className),
		...props,
		children
	});
	if (isMobile) return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Sheet, {
		open: openMobile,
		onOpenChange: setOpenMobile,
		...props,
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(SheetContent, {
			dir,
			"data-sidebar": "sidebar",
			"data-slot": "sidebar",
			"data-mobile": "true",
			className: "w-(--sidebar-width) bg-sidebar p-0 text-sidebar-foreground [&>button]:hidden",
			style: { "--sidebar-width": SIDEBAR_WIDTH_MOBILE },
			side,
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(SheetHeader, {
				className: "sr-only",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SheetTitle, { children: "Sidebar" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SheetDescription, { children: "Displays the mobile sidebar." })]
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "flex h-full w-full flex-col",
				children
			})]
		})
	});
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "group peer hidden text-sidebar-foreground md:block",
		"data-state": state,
		"data-collapsible": state === "collapsed" ? collapsible : "",
		"data-variant": variant,
		"data-side": side,
		"data-slot": "sidebar",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
			"data-slot": "sidebar-gap",
			className: cn("relative w-(--sidebar-width) bg-transparent transition-[width] duration-200 ease-linear", "group-data-[collapsible=offcanvas]:w-0", "group-data-[side=right]:rotate-180", variant === "floating" || variant === "inset" ? "group-data-[collapsible=icon]:w-[calc(var(--sidebar-width-icon)+(--spacing(4)))]" : "group-data-[collapsible=icon]:w-(--sidebar-width-icon)")
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
			"data-slot": "sidebar-container",
			"data-side": side,
			className: cn("fixed inset-y-0 z-10 hidden h-svh w-(--sidebar-width) transition-[left,right,width] duration-200 ease-linear data-[side=left]:left-0 data-[side=left]:group-data-[collapsible=offcanvas]:left-[calc(var(--sidebar-width)*-1)] data-[side=right]:right-0 data-[side=right]:group-data-[collapsible=offcanvas]:right-[calc(var(--sidebar-width)*-1)] md:flex", variant === "floating" || variant === "inset" ? "p-2 group-data-[collapsible=icon]:w-[calc(var(--sidebar-width-icon)+(--spacing(4))+2px)]" : "group-data-[collapsible=icon]:w-(--sidebar-width-icon) group-data-[side=left]:border-r group-data-[side=right]:border-l", className),
			...props,
			children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				"data-sidebar": "sidebar",
				"data-slot": "sidebar-inner",
				className: "flex size-full flex-col bg-sidebar group-data-[variant=floating]:rounded-lg group-data-[variant=floating]:shadow-sm group-data-[variant=floating]:ring-1 group-data-[variant=floating]:ring-sidebar-border",
				children
			})
		})]
	});
}
function SidebarTrigger({ className, onClick, ...props }) {
	const { toggleSidebar } = useSidebar();
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
		"data-sidebar": "trigger",
		"data-slot": "sidebar-trigger",
		variant: "ghost",
		size: "icon-sm",
		className: cn(className),
		onClick: (event) => {
			onClick?.(event);
			toggleSidebar();
		},
		...props,
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Cp, {}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
			className: "sr-only",
			children: "Toggle Sidebar"
		})]
	});
}
function SidebarRail({ className, ...props }) {
	const { toggleSidebar } = useSidebar();
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
		"data-sidebar": "rail",
		"data-slot": "sidebar-rail",
		"aria-label": "Toggle Sidebar",
		tabIndex: -1,
		onClick: toggleSidebar,
		title: "Toggle Sidebar",
		className: cn("absolute inset-y-0 z-20 hidden w-4 transition-all ease-linear group-data-[side=left]:-right-4 group-data-[side=right]:left-0 after:absolute after:inset-y-0 after:start-1/2 after:w-[2px] hover:after:bg-sidebar-border sm:flex ltr:-translate-x-1/2 rtl:-translate-x-1/2", "in-data-[side=left]:cursor-w-resize in-data-[side=right]:cursor-e-resize", "[[data-side=left][data-state=collapsed]_&]:cursor-e-resize [[data-side=right][data-state=collapsed]_&]:cursor-w-resize", "group-data-[collapsible=offcanvas]:translate-x-0 group-data-[collapsible=offcanvas]:after:left-full hover:group-data-[collapsible=offcanvas]:bg-sidebar", "[[data-side=left][data-collapsible=offcanvas]_&]:-right-2", "[[data-side=right][data-collapsible=offcanvas]_&]:-left-2", className),
		...props
	});
}
function SidebarInset({ className, ...props }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("main", {
		"data-slot": "sidebar-inset",
		className: cn("relative flex w-full flex-1 flex-col bg-background md:peer-data-[variant=inset]:m-2 md:peer-data-[variant=inset]:ml-0 md:peer-data-[variant=inset]:rounded-xl md:peer-data-[variant=inset]:shadow-sm md:peer-data-[variant=inset]:peer-data-[state=collapsed]:ml-2", className),
		...props
	});
}
function SidebarHeader({ className, ...props }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		"data-slot": "sidebar-header",
		"data-sidebar": "header",
		className: cn("flex flex-col gap-2 p-2", className),
		...props
	});
}
function SidebarFooter({ className, ...props }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		"data-slot": "sidebar-footer",
		"data-sidebar": "footer",
		className: cn("flex flex-col gap-2 p-2", className),
		...props
	});
}
function SidebarContent({ className, ...props }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		"data-slot": "sidebar-content",
		"data-sidebar": "content",
		className: cn("no-scrollbar flex min-h-0 flex-1 flex-col gap-0 overflow-auto group-data-[collapsible=icon]:overflow-hidden", className),
		...props
	});
}
function SidebarMenu({ className, ...props }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("ul", {
		"data-slot": "sidebar-menu",
		"data-sidebar": "menu",
		className: cn("flex w-full min-w-0 flex-col gap-px", className),
		...props
	});
}
function SidebarMenuItem({ className, ...props }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("li", {
		"data-slot": "sidebar-menu-item",
		"data-sidebar": "menu-item",
		className: cn("group/menu-item relative", className),
		...props
	});
}
var sidebarMenuButtonVariants = cva("peer/menu-button group/menu-button flex w-full items-center gap-2 overflow-hidden rounded-[calc(var(--radius-sm)+2px)] p-2 text-left text-xs ring-sidebar-ring outline-hidden transition-[width,height,padding] group-has-data-[sidebar=menu-action]/menu-item:pr-8 group-data-[collapsible=icon]:size-8! group-data-[collapsible=icon]:p-2! hover:bg-sidebar-accent hover:text-sidebar-accent-foreground focus-visible:ring-2 active:bg-sidebar-accent active:text-sidebar-accent-foreground disabled:pointer-events-none disabled:opacity-50 aria-disabled:pointer-events-none aria-disabled:opacity-50 data-open:hover:bg-sidebar-accent data-open:hover:text-sidebar-accent-foreground data-active:bg-sidebar-accent data-active:font-medium data-active:text-sidebar-accent-foreground [&_svg]:size-4 [&_svg]:shrink-0 [&>span:last-child]:truncate", {
	variants: {
		variant: {
			default: "hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
			outline: "bg-background shadow-[0_0_0_1px_var(--sidebar-border)] hover:bg-sidebar-accent hover:text-sidebar-accent-foreground hover:shadow-[0_0_0_1px_var(--sidebar-accent)]"
		},
		size: {
			default: "h-8 text-xs",
			sm: "h-7 text-xs",
			lg: "h-12 text-xs group-data-[collapsible=icon]:p-0!"
		}
	},
	defaultVariants: {
		variant: "default",
		size: "default"
	}
});
function SidebarMenuButton({ asChild = false, isActive = false, variant = "default", size = "default", tooltip, className, ...props }) {
	const Comp = asChild ? Slot : "button";
	const { isMobile, state } = useSidebar();
	const button = /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Comp, {
		"data-slot": "sidebar-menu-button",
		"data-sidebar": "menu-button",
		"data-size": size,
		"data-active": isActive,
		className: cn(sidebarMenuButtonVariants({
			variant,
			size
		}), className),
		...props
	});
	if (!tooltip) return button;
	if (typeof tooltip === "string") tooltip = { children: tooltip };
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Tooltip$1, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TooltipTrigger, {
		asChild: true,
		children: button
	}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(TooltipContent, {
		side: "right",
		align: "center",
		hidden: state !== "collapsed" || isMobile,
		...tooltip
	})] });
}
var items = [
	{
		title: "Lobby",
		to: "/",
		icon: ko
	},
	{
		title: "Casino",
		to: "/casino",
		icon: RD
	},
	{
		title: "Live",
		to: "/live",
		icon: lf
	},
	{
		title: "Sports",
		to: "/sports",
		icon: n0
	},
	{
		title: "Promotions",
		to: "/promotions",
		icon: Gr
	},
	{
		title: "History",
		to: "/profile",
		icon: uo
	},
	{
		title: "Cashier",
		to: "/profile",
		icon: Lz
	}
];
var foot = [
	{
		title: "Terms",
		to: "/terms",
		icon: Fl
	},
	{
		title: "Responsible",
		to: "/responsible",
		icon: Zo
	},
	{
		title: "Fairness",
		to: "/fairness",
		icon: Vd
	},
	{
		title: "Profile",
		to: "/profile",
		icon: Pf
	}
];
function SidebarLeft(props) {
	const pathname = useRouterState({ select: (s) => s.location.pathname });
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Sidebar, {
		collapsible: "icon",
		...props,
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SidebarHeader, {
				className: "flex items-center justify-center py-2",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
					to: "/",
					"aria-label": "TOLS home",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(TolsT, { className: "size-7" })
				})
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SidebarContent, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SidebarMenu, { children: items.map((item) => {
				const Icon = item.icon;
				const active = pathname === item.to || item.to !== "/" && pathname.startsWith(item.to);
				return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SidebarMenuItem, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SidebarMenuButton, {
					asChild: true,
					isActive: active,
					tooltip: item.title,
					className: "h-11",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Link, {
						to: item.to,
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Icon, { className: active ? "text-primary" : void 0 }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: item.title })]
					})
				}) }, item.title);
			}) }) }),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SidebarFooter, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SidebarMenu, { children: foot.map((item) => {
				const Icon = item.icon;
				return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SidebarMenuItem, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SidebarMenuButton, {
					asChild: true,
					tooltip: item.title,
					className: "h-11",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Link, {
						to: item.to,
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Icon, {}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: item.title })]
					})
				}) }, item.title);
			}) }) }),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SidebarRail, {})
		]
	});
}
function DropdownMenu$1({ ...props }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Root2, {
		"data-slot": "dropdown-menu",
		...props
	});
}
function DropdownMenuTrigger({ ...props }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Trigger, {
		"data-slot": "dropdown-menu-trigger",
		...props
	});
}
function DropdownMenuContent({ className, align = "start", sideOffset = 4, ...props }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Portal2, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Content2, {
		"data-slot": "dropdown-menu-content",
		sideOffset,
		align,
		className: cn("z-50 max-h-(--radix-dropdown-menu-content-available-height) w-(--radix-dropdown-menu-trigger-width) min-w-32 origin-(--radix-dropdown-menu-content-transform-origin) overflow-x-hidden overflow-y-auto rounded-lg bg-popover p-1 text-popover-foreground shadow-md ring-1 ring-foreground/10 duration-100 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2 data-[state=closed]:overflow-hidden data-open:animate-in data-open:fade-in-0 data-open:zoom-in-95 data-closed:animate-out data-closed:fade-out-0 data-closed:zoom-out-95", className),
		...props
	}) });
}
function DropdownMenuItem({ className, inset, variant = "default", ...props }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Item2, {
		"data-slot": "dropdown-menu-item",
		"data-inset": inset,
		"data-variant": variant,
		className: cn("group/dropdown-menu-item relative flex min-h-7 cursor-default items-center gap-2 rounded-md px-2 py-1 text-xs/relaxed outline-hidden select-none focus:bg-accent focus:text-accent-foreground not-data-[variant=destructive]:focus:**:text-accent-foreground data-inset:pl-7.5 data-[variant=destructive]:text-destructive data-[variant=destructive]:focus:bg-destructive/10 data-[variant=destructive]:focus:text-destructive dark:data-[variant=destructive]:focus:bg-destructive/20 data-disabled:pointer-events-none data-disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-3.5 data-[variant=destructive]:*:[svg]:text-destructive", className),
		...props
	});
}
function Dialog$1({ ...props }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Dialog, {
		"data-slot": "dialog",
		...props
	});
}
function DialogPortal({ ...props }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(DialogPortal$1, {
		"data-slot": "dialog-portal",
		...props
	});
}
function DialogOverlay({ className, ...props }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(DialogOverlay$1, {
		"data-slot": "dialog-overlay",
		className: cn("fixed inset-0 isolate z-50 bg-black/80 duration-100 supports-backdrop-filter:backdrop-blur-xs data-open:animate-in data-open:fade-in-0 data-closed:animate-out data-closed:fade-out-0", className),
		...props
	});
}
function DialogContent({ className, children, showCloseButton = true, ...props }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(DialogPortal, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(DialogOverlay, {}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(DialogContent$1, {
		"data-slot": "dialog-content",
		className: cn("fixed top-1/2 left-1/2 z-50 grid w-full max-w-[calc(100%-2rem)] -translate-x-1/2 -translate-y-1/2 gap-4 rounded-xl bg-popover p-4 text-xs/relaxed text-popover-foreground ring-1 ring-foreground/10 duration-100 outline-none sm:max-w-sm data-open:animate-in data-open:fade-in-0 data-open:zoom-in-95 data-closed:animate-out data-closed:fade-out-0 data-closed:zoom-out-95", className),
		...props,
		children: [children, showCloseButton && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(DialogClose, {
			"data-slot": "dialog-close",
			asChild: true,
			children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
				variant: "ghost",
				className: "absolute top-2 right-2",
				size: "icon-sm",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(P7, {}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
					className: "sr-only",
					children: "Close"
				})]
			})
		})]
	})] });
}
function DialogHeader({ className, ...props }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		"data-slot": "dialog-header",
		className: cn("flex flex-col gap-1", className),
		...props
	});
}
function DialogTitle({ className, ...props }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(DialogTitle$1, {
		"data-slot": "dialog-title",
		className: cn("font-heading text-sm font-medium", className),
		...props
	});
}
function DialogDescription({ className, ...props }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(DialogDescription$1, {
		"data-slot": "dialog-description",
		className: cn("text-xs/relaxed text-muted-foreground *:[a]:underline *:[a]:underline-offset-3 *:[a]:hover:text-foreground", className),
		...props
	});
}
function CashierDialog({ open, onOpenChange }) {
	const user = useCurrentUser();
	const { currency, balances, deposit, withdraw } = useWallet();
	const [amount, setAmount] = (0, import_react.useState)(CURRENCY_META[currency].minBet * 10);
	const address = user ? mockAddressFromUserId(user.id) : "0x—";
	async function run(action) {
		try {
			if (action === "deposit") {
				const { loadResponsible, isSelfExcluded } = await import("./_ssr/responsible-B1NssqY0.mjs").then((n) => n.r).then((n) => n.r);
				const s = loadResponsible();
				if (isSelfExcluded(s)) {
					toast.error("Self-exclusion is active");
					return;
				}
				if (s.depositLimit != null && amount > s.depositLimit) {
					toast.error(`Deposit limit is ${s.depositLimit} USDT / day`);
					return;
				}
				await deposit(amount);
			} else await withdraw(amount);
			onOpenChange(false);
		} catch (err) {
			toast.error(err instanceof Error ? err.message : "Cashier failed");
		}
	}
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Dialog$1, {
		open,
		onOpenChange,
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(DialogContent, {
			className: "sm:max-w-md",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(DialogHeader, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(DialogTitle, { children: "Cashier" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(DialogDescription, { children: "Play-money only. Deposits credit instantly to this account." })] }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Tabs$1, {
				defaultValue: "deposit",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(TabsList, {
						className: "w-full",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TabsTrigger, {
							value: "deposit",
							className: "flex-1",
							children: "Deposit"
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(TabsTrigger, {
							value: "withdraw",
							className: "flex-1",
							children: "Withdraw"
						})]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(TabsContent, {
						value: "deposit",
						className: "mt-4 space-y-4",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "rounded-xl bg-muted px-3 py-2 font-mono text-xs text-muted-foreground",
								children: shortAddress(address)
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(AmountField, {
								amount,
								onChange: setAmount
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
								className: "text-xs text-muted-foreground",
								children: [
									"Balance ",
									formatMoney(balances[currency], currency),
									" ",
									currency
								]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
								className: "h-11 w-full",
								onClick: () => void run("deposit"),
								children: ["Credit ", currency]
							})
						]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(TabsContent, {
						value: "withdraw",
						className: "mt-4 space-y-4",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(AmountField, {
							amount,
							onChange: setAmount
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
							className: "h-11 w-full",
							variant: "outline",
							onClick: () => void run("withdraw"),
							children: ["Send ", currency]
						})]
					})
				]
			})]
		})
	});
}
function AmountField({ amount, onChange }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "grid gap-1.5",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label$1, {
			htmlFor: "cashier-amount",
			children: "Amount"
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
			id: "cashier-amount",
			type: "number",
			className: "h-11 tabular-nums",
			value: amount,
			onChange: (e) => onChange(Number(e.target.value))
		})]
	});
}
function SiteHeader() {
	const { user, isPending } = useCurrentUserState();
	const { currency, setCurrency, balances } = useWallet();
	const [cashier, setCashier] = (0, import_react.useState)(false);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("header", {
		className: "sticky top-0 z-30 flex h-12 items-center gap-2 border-b border-border bg-background/70 px-2 backdrop-blur-xl md:h-16 md:gap-3 md:px-5",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SidebarTrigger, { className: "size-11 md:hidden" }),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TolsMark, {}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "relative mx-auto hidden max-w-md flex-1 md:block",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(pv, { className: "pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
					placeholder: "Search games...",
					className: "h-10 rounded-lg border-border bg-muted/40 pl-9"
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "ml-auto flex items-center gap-1.5 md:gap-2",
				children: [
					isPending ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Skeleton, { className: "h-9 w-24 rounded-lg md:w-36" }) : user ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(DropdownMenu$1, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(DropdownMenuTrigger, {
							asChild: true,
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
								variant: "outline",
								className: "h-9 min-w-0 gap-1.5 rounded-lg px-2.5 tabular-nums md:h-10 md:px-3",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Lz, { className: "size-4" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: "max-w-20 truncate text-xs md:max-w-none md:text-sm",
									children: formatMoney(balances[currency], currency)
								})]
							})
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(DropdownMenuContent, {
							align: "end",
							className: "min-w-48",
							children: CURRENCIES.map((c) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(DropdownMenuItem, {
								onClick: () => setCurrency(c),
								className: "justify-between",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: c }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: "tabular-nums text-muted-foreground",
									children: formatMoney(balances[c], c)
								})]
							}, c))
						})] }),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
							className: "h-9 rounded-lg px-2.5 md:h-10 md:px-3",
							onClick: () => setCashier(true),
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(p, { className: "size-4" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: "hidden sm:inline",
								children: "Wallet"
							})]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(CashierDialog, {
							open: cashier,
							onOpenChange: setCashier
						})
					] }) : null,
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
						variant: "ghost",
						size: "icon",
						className: "hidden size-10 md:inline-flex",
						"aria-label": "Alerts",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(zH, { className: "size-5" })
					}),
					isPending ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Skeleton, { className: "size-9 rounded-full" }) : /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(SignedOut, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
						asChild: true,
						variant: "outline",
						className: "h-9 rounded-lg px-3 md:h-10 md:px-4",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
							to: "/login",
							children: "Login"
						})
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
						asChild: true,
						className: "h-9 rounded-lg px-3 md:h-10 md:px-4",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
							to: "/login",
							children: "Register"
						})
					})] }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SignedIn, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(UserButton, {}) })] })
				]
			})
		]
	});
}
var KEY = "tols-cookies";
function CookiePreferences({ open, onOpenChange }) {
	const [analytics, setAnalytics] = (0, import_react.useState)(false);
	const [marketing, setMarketing] = (0, import_react.useState)(false);
	(0, import_react.useEffect)(() => {
		if (!open) return;
		try {
			const raw = window.localStorage.getItem(KEY);
			if (!raw) return;
			const parsed = JSON.parse(raw);
			setAnalytics(Boolean(parsed.analytics));
			setMarketing(Boolean(parsed.marketing));
		} catch {}
	}, [open]);
	function save(next) {
		window.localStorage.setItem(KEY, JSON.stringify({
			essential: true,
			...next
		}));
		onOpenChange(false);
	}
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Dialog$1, {
		open,
		onOpenChange,
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(DialogContent, {
			className: "sm:max-w-md",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(DialogHeader, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(DialogTitle, { children: "Customise cookies" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(DialogDescription, { children: "Essential cookies keep you signed in. Analytics and marketing are optional." })] }),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "space-y-3 text-sm",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "rounded-xl bg-muted px-3 py-2",
							children: "Essential — always on"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
							className: "flex items-center justify-between rounded-xl bg-muted px-3 py-2",
							children: ["Analytics", /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
								type: "checkbox",
								checked: analytics,
								onChange: (e) => setAnalytics(e.target.checked)
							})]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
							className: "flex items-center justify-between rounded-xl bg-muted px-3 py-2",
							children: ["Marketing", /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
								type: "checkbox",
								checked: marketing,
								onChange: (e) => setMarketing(e.target.checked)
							})]
						})
					]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "mt-2 flex gap-2",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
						variant: "outline",
						className: "h-10 flex-1",
						onClick: () => save({
							analytics: false,
							marketing: false
						}),
						children: "Essential only"
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
						className: "h-10 flex-1",
						onClick: () => save({
							analytics,
							marketing
						}),
						children: "Save"
					})]
				})
			]
		})
	});
}
var COLS = [
	{
		title: "Support",
		links: [
			{
				label: "Live Support",
				to: "/help",
				hash: "live"
			},
			{
				label: "Help Center",
				to: "/help"
			},
			{
				label: "Game Responsibly",
				to: "/responsible"
			}
		]
	},
	{
		title: "Platform",
		links: [
			{
				label: "Provably Fair",
				to: "/fairness"
			},
			{
				label: "Affiliate Program",
				to: "/affiliate"
			},
			{
				label: "Redeem Code",
				to: "/redeem"
			},
			{
				label: "VIP Program",
				to: "/vip"
			}
		]
	},
	{
		title: "Policy",
		links: [
			{
				label: "Terms of Service",
				to: "/terms"
			},
			{
				label: "Privacy Policy",
				to: "/privacy"
			},
			{
				label: "Game Responsibly",
				to: "/responsible"
			},
			{
				label: "AML Policy",
				to: "/aml"
			}
		]
	}
];
function SiteFooter() {
	const [cookies, setCookies] = (0, import_react.useState)(false);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("footer", {
		className: "border-t border-border px-4 py-8 text-sm text-muted-foreground md:px-6",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "mx-auto grid max-w-6xl gap-8 sm:grid-cols-2 lg:grid-cols-4",
				children: [COLS.map((col) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("nav", {
					"aria-label": col.title,
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "font-heading text-xs font-semibold tracking-[0.16em] text-foreground uppercase",
						children: col.title
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("ul", {
						className: "mt-3 space-y-2",
						children: [col.links.map((l) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("li", { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
							to: l.to,
							hash: "hash" in l ? l.hash : void 0,
							className: "hover:text-foreground",
							children: l.label
						}) }, l.label)), col.title === "Policy" ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("li", { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
							type: "button",
							className: "hover:text-foreground",
							onClick: () => setCookies(true),
							children: "Customise"
						}) }) : null]
					})]
				}, col.title)), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("nav", {
					"aria-label": "Community",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "font-heading text-xs font-semibold tracking-[0.16em] text-foreground uppercase",
						children: "Community"
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("ul", {
						className: "mt-3 space-y-2",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("li", { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("a", {
								href: "https://t.me/tolsfun",
								rel: "noreferrer",
								target: "_blank",
								className: "hover:text-foreground",
								children: "Telegram"
							}) }),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("li", { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("a", {
								href: "https://x.com/tolsfun",
								rel: "noreferrer",
								target: "_blank",
								className: "hover:text-foreground",
								children: "X"
							}) }),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("li", { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("a", {
								href: "https://instagram.com/tolsfun",
								rel: "noreferrer",
								target: "_blank",
								className: "hover:text-foreground",
								children: "Instagram"
							}) }),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("li", { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
								to: "/help",
								className: "hover:text-foreground",
								children: "Forum"
							}) })
						]
					})]
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "mx-auto mt-8 flex max-w-6xl flex-col gap-2 border-t border-border pt-6 sm:flex-row sm:items-center sm:justify-between",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TolsWordmark, { className: "h-4 w-auto opacity-50" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "text-xs",
					children: "18+ only · TOLS B.V. · Willemstad, Curaçao · support@tols.fun"
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(CookiePreferences, {
				open: cookies,
				onOpenChange: setCookies
			})
		]
	});
}
var tabs = [
	{
		id: "casino",
		label: "Casino",
		to: "/casino",
		icon: RD,
		match: [
			"/",
			"/casino",
			"/games"
		]
	},
	{
		id: "live",
		label: "Live",
		to: "/live",
		icon: lf,
		match: ["/live"]
	},
	{
		id: "search",
		label: "Search",
		to: null,
		icon: pv,
		match: []
	},
	{
		id: "sports",
		label: "Sports",
		to: "/sports",
		icon: n0,
		match: ["/sports"]
	},
	{
		id: "profile",
		label: "Profile",
		to: "/profile",
		icon: Pf,
		match: ["/profile"]
	}
];
function MobileTabBar() {
	const pathname = useRouterState({ select: (s) => s.location.pathname });
	const [searchOpen, setSearchOpen] = (0, import_react.useState)(false);
	const [q, setQ] = (0, import_react.useState)("");
	const navigate = useNavigate();
	const hits = (0, import_react.useMemo)(() => {
		const needle = q.trim().toLowerCase();
		if (!needle) return GAMES.slice(0, 8);
		return GAMES.filter((g) => g.title.toLowerCase().includes(needle) || g.provider.toLowerCase().includes(needle) || g.kind.toLowerCase().includes(needle));
	}, [q]);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("nav", {
		"aria-label": "Mobile",
		className: "fixed inset-x-0 bottom-0 z-40 border-t border-border bg-background/80 backdrop-blur-xl md:hidden",
		style: { paddingBottom: "env(safe-area-inset-bottom)" },
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("ul", {
			className: "grid h-14 grid-cols-5",
			children: tabs.map((tab) => {
				const Icon = tab.icon;
				const active = tab.match.some((p) => pathname === p || p !== "/" && pathname.startsWith(p));
				const isSearch = tab.id === "search";
				return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("li", {
					className: "flex items-center justify-center",
					children: isSearch ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
						type: "button",
						"aria-label": "Search games",
						onClick: () => setSearchOpen(true),
						className: "-mt-4 grid size-12 place-items-center rounded-full bg-primary text-primary-foreground shadow-[var(--shadow-fab)]",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Icon, { className: "size-5" })
					}) : /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Link, {
						to: tab.to,
						className: cn("flex h-full w-full flex-col items-center justify-center gap-0.5 text-[0.65rem] font-medium", active ? "text-lime" : "text-muted-foreground"),
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Icon, { className: cn("size-5", active && "text-lime") }), tab.label]
					})
				}, tab.id);
			})
		})
	}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Sheet, {
		open: searchOpen,
		onOpenChange: setSearchOpen,
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(SheetContent, {
			side: "bottom",
			className: "max-h-[80dvh] rounded-t-2xl bg-card pb-8",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(SheetHeader, {
				className: "px-4 pt-2 pb-0",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SheetTitle, { children: "Search" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SheetDescription, { children: "Jump to an original or table." })]
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "px-4 pt-3",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
					autoFocus: true,
					value: q,
					onChange: (e) => setQ(e.target.value),
					placeholder: "Dice, mines, blackjack…",
					className: "h-11 rounded-lg"
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("ul", {
					className: "mt-3 max-h-[50dvh] space-y-1 overflow-y-auto",
					children: hits.map((g) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("li", { children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
						type: "button",
						className: "flex w-full items-center gap-3 rounded-xl px-2 py-2 text-left hover:bg-muted",
						onClick: () => {
							setSearchOpen(false);
							navigate({
								to: "/games/$id",
								params: { id: g.id }
							});
						},
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("img", {
								src: g.cover,
								alt: "",
								className: "size-11 rounded-lg object-cover"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
								className: "min-w-0 flex-1",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: "block truncate text-sm font-medium",
									children: g.title
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: "block text-xs text-muted-foreground",
									children: g.provider
								})]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
								className: "text-xs tabular-nums text-lime",
								children: [g.rtp.toFixed(1), "%"]
							})
						]
					}) }, g.id))
				})]
			})]
		})
	})] });
}
function AppShell({ children }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(SidebarProvider, {
		defaultOpen: false,
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SidebarLeft, {}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(SidebarInset, {
			className: "bg-transparent",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SiteHeader, {}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "flex min-h-[calc(100svh-3.5rem)] flex-col pb-[calc(4.25rem+env(safe-area-inset-bottom))] md:pb-0",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "flex-1 px-3 py-4 md:px-6 md:py-6",
						children
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SiteFooter, {})]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(MobileTabBar, {})
			]
		})]
	});
}
function ShellLayout() {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(WalletProvider, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(AppShell, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Outlet, {}) }) });
}
//#endregion
export { ShellLayout as component };
