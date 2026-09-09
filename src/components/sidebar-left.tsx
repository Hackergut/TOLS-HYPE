"use client";

import type { ComponentProps } from "react";
import { Link, useRouterState } from "@tanstack/react-router";
import {
  RiHome5Line,
  RiDiceLine,
  RiTvLine,
  RiBasketballLine,
  RiShieldCheckLine,
  RiSparkling2Line,
  RiGridLine,
  RiLineChartLine,
  RiStackLine,
  RiGiftLine,
} from "@remixicon/react";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
  useSidebar,
} from "@/components/ui/sidebar";
import { TolsT, TolsWordmark } from "@/components/brand/tols-mark";
import { BROWSE_FOOT, BROWSE_NAV, GAME_SECTIONS, type NavLink } from "@/lib/nav";

const ICONS = {
  home: RiHome5Line,
  dice: RiDiceLine,
  live: RiTvLine,
  sports: RiBasketballLine,
  fairness: RiShieldCheckLine,
  originals: RiSparkling2Line,
  slots: RiGridLine,
  crash: RiLineChartLine,
  table: RiStackLine,
  promo: RiGiftLine,
};

function NavItems({ items, pathname, onNavigate }: { items: NavLink[]; pathname: string; onNavigate: () => void }) {
  return (
    <SidebarMenu className="gap-0.5 group-data-[collapsible=icon]:items-center">
      {items.map((item) => {
        const Icon = ICONS[item.icon as keyof typeof ICONS];
        const cat = item.search?.cat;
        const onCasino = pathname === "/casino" || pathname.startsWith("/casino/");
        const active = cat
          ? onCasino && (typeof window !== "undefined" ? new URLSearchParams(window.location.search).get("cat") === cat : false)
          : pathname === item.to || (item.to !== "/" && pathname.startsWith(String(item.to)));
        return (
          <SidebarMenuItem key={item.title}>
            <SidebarMenuButton
              asChild
              isActive={active}
              tooltip={item.title}
              className="h-10 w-full justify-start gap-3 px-3 text-sm group-data-[collapsible=icon]:size-10 group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:px-0"
            >
              <Link to={item.to} search={item.search} onClick={onNavigate}>
                {Icon ? <Icon className={active ? "text-lime" : undefined} /> : null}
                <span>{item.title}</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        );
      })}
    </SidebarMenu>
  );
}

export function SidebarLeft(props: ComponentProps<typeof Sidebar>) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const { isMobile, setOpenMobile } = useSidebar();

  function closeIfMobile() {
    if (isMobile) setOpenMobile(false);
  }

  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader className="flex flex-row items-center gap-2 px-3 py-4 group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:px-0 group-data-[collapsible=icon]:py-3">
        <Link to="/" aria-label="TOLS home" className="flex items-center gap-2" onClick={closeIfMobile}>
          <TolsT className="size-7 shrink-0" />
          <TolsWordmark className="h-6 group-data-[collapsible=icon]:hidden" />
        </Link>
      </SidebarHeader>
      <SidebarContent className="px-1 group-data-[collapsible=icon]:items-center group-data-[collapsible=icon]:px-0">
        <SidebarGroup className="px-1">
          <SidebarGroupLabel className="font-bluescreens tracking-[0.18em] text-lime uppercase">Browse</SidebarGroupLabel>
          <SidebarGroupContent>
            <NavItems items={BROWSE_NAV} pathname={pathname} onNavigate={closeIfMobile} />
          </SidebarGroupContent>
        </SidebarGroup>
        <SidebarGroup className="px-1">
          <SidebarGroupLabel className="font-bluescreens tracking-[0.18em] text-lime uppercase">Games</SidebarGroupLabel>
          <SidebarGroupContent>
            <NavItems items={GAME_SECTIONS} pathname={pathname} onNavigate={closeIfMobile} />
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter className="px-1 group-data-[collapsible=icon]:items-center group-data-[collapsible=icon]:px-0">
        <SidebarGroup className="px-1">
          <SidebarGroupLabel className="font-bluescreens tracking-[0.18em] text-lime uppercase">House</SidebarGroupLabel>
          <SidebarGroupContent>
            <NavItems items={BROWSE_FOOT} pathname={pathname} onNavigate={closeIfMobile} />
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}
