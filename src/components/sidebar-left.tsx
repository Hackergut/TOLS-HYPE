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
  RiPokerHeartsLine,
  RiRocketLine,
  RiDashboard3Line,
  RiFootballLine,
  RiPingPongLine,
  RiBoxingLine,
  RiGamepadLine,
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
  SidebarSeparator,
  useSidebar,
} from "@/components/ui/sidebar";
import { TolsT, TolsWordmark } from "@/components/brand/tols-mark";
import { BROWSE_FOOT, BROWSE_NAV, CASINO_SECTIONS, ORIGINAL_SECTIONS, SPORT_SECTIONS } from "@/lib/nav";

const ICONS = {
  home: RiHome5Line,
  dice: RiDiceLine,
  live: RiTvLine,
  dashboard: RiDashboard3Line,
  sports: RiBasketballLine,
  fairness: RiShieldCheckLine,
};

const CAT_ICONS = {
  originals: RiSparkling2Line,
  slots: RiGridLine,
  table: RiPokerHeartsLine,
  live: RiTvLine,
  crash: RiRocketLine,
  all: RiDiceLine,
};

const SPORT_ICONS = {
  all: RiBasketballLine,
  football: RiFootballLine,
  basketball: RiBasketballLine,
  tennis: RiPingPongLine,
  mma: RiBoxingLine,
  esports: RiGamepadLine,
};

export function SidebarLeft(props: ComponentProps<typeof Sidebar>) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const search = useRouterState({ select: (s) => s.location.search });
  const { isMobile, setOpenMobile } = useSidebar();

  function closeIfMobile() {
    if (isMobile) setOpenMobile(false);
  }

  const cat = typeof search === "object" && search && "cat" in search ? String((search as { cat?: string }).cat ?? "") : "";
  const sportQ =
    typeof search === "object" && search && "sport" in search ? String((search as { sport?: string }).sport ?? "all") : "all";
  const onSports = pathname === "/sports";

  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader className="flex flex-row items-center gap-2 px-3 py-4 group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:px-0 group-data-[collapsible=icon]:py-3">
        <Link to="/" aria-label="TOLS home" className="flex items-center gap-2" onClick={closeIfMobile}>
          <TolsT className="size-7 shrink-0" />
          <TolsWordmark className="h-6 group-data-[collapsible=icon]:hidden" />
        </Link>
      </SidebarHeader>
      <SidebarContent className="px-0">
        <SidebarGroup>
          <SidebarGroupLabel className="font-sub text-[0.65rem] tracking-[0.12em] text-lime uppercase">Browse</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu className="gap-1 group-data-[collapsible=icon]:items-center">
              {BROWSE_NAV.map((item) => {
                const Icon = ICONS[item.icon as keyof typeof ICONS];
                const active = pathname === item.to || (item.to !== "/" && pathname.startsWith(String(item.to)));
                return (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton
                      asChild
                      isActive={active}
                      tooltip={item.title}
                      className="h-11 w-full justify-start gap-3 px-3 text-sm group-data-[collapsible=icon]:size-10 group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:px-0"
                    >
                      <Link to={item.to} onClick={closeIfMobile}>
                        <Icon className={active ? "text-lime" : undefined} />
                        <span>{item.title}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarSeparator className="group-data-[collapsible=icon]:hidden" />

        <SidebarGroup className="group-data-[collapsible=icon]:hidden">
          <SidebarGroupLabel className="font-sub text-[0.65rem] tracking-[0.12em] text-lime uppercase">Originals</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu className="gap-0.5">
              {ORIGINAL_SECTIONS.map((item) => {
                const href = `/games/${item.id}`;
                const active = pathname === href;
                return (
                  <SidebarMenuItem key={item.id}>
                    <SidebarMenuButton
                      asChild
                      isActive={active}
                      tooltip={item.title}
                      className="h-9 w-full justify-start px-3 text-sm"
                    >
                      <Link to="/games/$id" params={{ id: item.id }} onClick={closeIfMobile}>
                        <span>{item.title}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarSeparator className="group-data-[collapsible=icon]:hidden" />

        <SidebarGroup className="group-data-[collapsible=icon]:hidden">
          <SidebarGroupLabel className="font-sub text-[0.65rem] tracking-[0.12em] text-lime uppercase">Casino</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu className="gap-0.5">
              {CASINO_SECTIONS.map((item) => {
                const Icon = CAT_ICONS[item.cat ?? "live"];
                const active =
                  item.to === "/live"
                    ? pathname === "/live"
                    : pathname === "/casino" &&
                      (item.cat === "all" ? !cat || cat === "all" : cat === item.cat);
                return (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton
                      asChild
                      isActive={active}
                      tooltip={item.title}
                      className="h-9 w-full justify-start gap-3 px-3 text-sm"
                    >
                      {item.to === "/live" ? (
                        <Link to="/live" onClick={closeIfMobile}>
                          <Icon className={active ? "text-lime" : undefined} />
                          <span>{item.title}</span>
                        </Link>
                      ) : (
                        <Link to="/casino" search={{ cat: item.cat ?? "all" }} onClick={closeIfMobile}>
                          <Icon className={active ? "text-lime" : undefined} />
                          <span>{item.title}</span>
                        </Link>
                      )}
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarSeparator className="group-data-[collapsible=icon]:hidden" />

        <SidebarGroup className="group-data-[collapsible=icon]:hidden">
          <SidebarGroupLabel className="font-sub text-[0.65rem] tracking-[0.12em] text-lime uppercase">Sports</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu className="gap-0.5">
              {SPORT_SECTIONS.map((item) => {
                const Icon = SPORT_ICONS[item.sport];
                const active = onSports && (item.sport === "all" ? sportQ === "all" || !sportQ : sportQ === item.sport);
                return (
                  <SidebarMenuItem key={item.sport}>
                    <SidebarMenuButton
                      asChild
                      isActive={active}
                      tooltip={item.title}
                      className="h-9 w-full justify-start gap-3 px-3 text-sm"
                    >
                      <Link to="/sports" search={{ sport: item.sport }} onClick={closeIfMobile}>
                        <Icon className={active ? "text-lime" : undefined} />
                        <span>{item.title}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter className="px-2 group-data-[collapsible=icon]:items-center group-data-[collapsible=icon]:px-0">
        <SidebarMenu className="gap-1 group-data-[collapsible=icon]:items-center">
          {BROWSE_FOOT.map((item) => {
            const Icon = ICONS[item.icon as keyof typeof ICONS];
            return (
              <SidebarMenuItem key={item.title}>
                <SidebarMenuButton
                  asChild
                  isActive={pathname === item.to}
                  tooltip={item.title}
                  className="h-12 w-full justify-start gap-3 px-3 text-sm group-data-[collapsible=icon]:size-10 group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:px-0"
                >
                  <Link to={item.to} onClick={closeIfMobile}>
                    <Icon />
                    <span>{item.title}</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            );
          })}
        </SidebarMenu>
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}
