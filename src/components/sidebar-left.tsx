"use client";

import type { ComponentProps } from "react";
import { useState } from "react";
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
  RiShareForwardLine,
  RiGroupLine,
  RiMegaphoneLine,
  RiMoneyDollarCircleLine,
  RiInformationLine,
  RiBriefcase4Line,
  RiCoupon3Line,
  RiVipLine,
  RiHandHeartLine,
  RiBaseballLine,
  RiSnowflakeLine,
  RiFireLine,
  RiCalendar2Line,
  RiTrophyLine,
  RiFileList3Line,
  RiBookOpenLine,
  RiCustomerService2Line,
  RiSafe2Line,
  RiSettings3Line,
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
import { TolsT } from "@/components/brand/tols-mark";
import { useWalletHub } from "@/components/wallet/wallet-hub";
import { AFFILIATE_SECTIONS, BROWSE_FOOT, BROWSE_NAV, CASINO_SECTIONS, ORIGINAL_SECTIONS, SPORT_SECTIONS, SPORT_TABS } from "@/lib/nav";

const ICONS = {
  home: RiHome5Line,
  dice: RiDiceLine,
  live: RiTvLine,
  dashboard: RiDashboard3Line,
  sports: RiBasketballLine,
  fairness: RiShieldCheckLine,
  affiliate: RiShareForwardLine,
  promotions: RiCoupon3Line,
  vip: RiVipLine,
  responsible: RiHandHeartLine,
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
  baseball: RiBaseballLine,
  hockey: RiSnowflakeLine,
};

const SPORT_TAB_ICONS = {
  live: RiFireLine,
  upcoming: RiCalendar2Line,
  leagues: RiTrophyLine,
  bets: RiFileList3Line,
  guide: RiBookOpenLine,
};

const AFF_ICONS = {
  overview: RiShareForwardLine,
  users: RiGroupLine,
  campaigns: RiMegaphoneLine,
  earnings: RiMoneyDollarCircleLine,
  info: RiInformationLine,
  pro: RiBriefcase4Line,
};

export function SidebarLeft(props: ComponentProps<typeof Sidebar>) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const search = useRouterState({ select: (s) => s.location.search });
  const { isMobile, setOpenMobile, toggleSidebar, state } = useSidebar();
  const { openTab } = useWalletHub();
  const [railPick, setRail] = useState<"casino" | "sport" | null>(null);
  const rail = railPick ?? (pathname.startsWith("/sports") ? "sport" : "casino");

  function closeIfMobile() {
    if (isMobile) setOpenMobile(false);
  }

  const cat = typeof search === "object" && search && "cat" in search ? String((search as { cat?: string }).cat ?? "") : "";
  const sportQ =
    typeof search === "object" && search && "sport" in search ? String((search as { sport?: string }).sport ?? "all") : "all";
  const onSports = pathname === "/sports";

  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader className="gap-3 border-b border-sidebar-border px-3 py-3 group-data-[collapsible=icon]:items-center group-data-[collapsible=icon]:px-0 group-data-[collapsible=icon]:py-3">
        <button
          type="button"
          aria-label={state === "collapsed" ? "Open menu" : "Close menu"}
          onClick={toggleSidebar}
          className="grid size-12 shrink-0 place-items-center self-center rounded-md transition-transform duration-200 hover:bg-white/5 active:scale-95"
        >
          <TolsT className="size-7" />
        </button>
        <div className="flex h-12 w-full overflow-hidden rounded-md bg-[#202329] group-data-[collapsible=icon]:hidden">
          <button
            type="button"
            onClick={() => setRail("casino")}
            className={
              rail === "casino"
                ? "flex-1 rounded-l-md border border-lime text-sm font-bold text-lime"
                : "flex-1 rounded-l-md border border-[#343843] border-r-0 text-sm font-medium text-white/70"
            }
          >
            Casino
          </button>
          <button
            type="button"
            onClick={() => setRail("sport")}
            className={
              rail === "sport"
                ? "flex-1 rounded-r-md border border-lime text-sm font-bold text-lime"
                : "flex-1 rounded-r-md border border-[#343843] border-l-0 text-sm font-medium text-white/70"
            }
          >
            Sport
          </button>
        </div>
      </SidebarHeader>
      <SidebarContent className="px-0">
        <SidebarGroup className={rail === "sport" ? "hidden group-data-[collapsible=icon]:flex" : undefined}>
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

        {rail === "casino" ? (
          <>
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
                    : item.to === "/originals"
                      ? pathname === "/originals"
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
                      ) : item.to === "/originals" ? (
                        <Link to="/originals" onClick={closeIfMobile}>
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
          </>
        ) : (
        <SidebarGroup className="group-data-[collapsible=icon]:hidden">
          <SidebarGroupLabel className="font-sub text-[0.65rem] tracking-[0.12em] text-lime uppercase">Sports</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu className="gap-0.5">
              {SPORT_TABS.map((item) => {
                const Icon = SPORT_TAB_ICONS[item.tab];
                const tabQ =
                  typeof search === "object" && search && "tab" in search
                    ? String((search as { tab?: string }).tab ?? "home")
                    : "home";
                const active = onSports && tabQ === item.tab;
                return (
                  <SidebarMenuItem key={item.tab}>
                    <SidebarMenuButton
                      asChild
                      isActive={active}
                      tooltip={item.title}
                      className="h-9 w-full justify-start gap-3 px-3 text-sm"
                    >
                      <Link to="/sports" search={{ tab: item.tab }} onClick={closeIfMobile}>
                        <Icon className={active ? "text-lime" : undefined} />
                        <span>{item.title}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
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
        )}

        {rail === "casino" ? (
        <>
        <SidebarSeparator className="group-data-[collapsible=icon]:hidden" />

        <SidebarGroup className="group-data-[collapsible=icon]:hidden">
          <SidebarGroupLabel className="font-sub text-[0.65rem] tracking-[0.12em] text-lime uppercase">Affiliates</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu className="gap-0.5">
              {AFFILIATE_SECTIONS.map((item) => {
                const Icon = AFF_ICONS[item.tab];
                const tabQ =
                  typeof search === "object" && search && "tab" in search
                    ? String((search as { tab?: string }).tab ?? "overview")
                    : "overview";
                const onAff = pathname === "/affiliate";
                const active = onAff && (item.tab === "overview" ? tabQ === "overview" || !tabQ : tabQ === item.tab);
                return (
                  <SidebarMenuItem key={item.tab}>
                    <SidebarMenuButton
                      asChild
                      isActive={active}
                      tooltip={item.title}
                      className="h-9 w-full justify-start gap-3 px-3 text-sm"
                    >
                      <Link to="/affiliate" search={{ tab: item.tab }} onClick={closeIfMobile}>
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
        </>
        ) : null}
      </SidebarContent>
      <SidebarFooter className="px-2 group-data-[collapsible=icon]:items-center group-data-[collapsible=icon]:px-0">
        <SidebarMenu className="gap-0.5 group-data-[collapsible=icon]:items-center">
          <SidebarMenuItem className="group-data-[collapsible=icon]:hidden">
            <SidebarMenuButton className="h-12 w-full justify-start gap-2.5 px-4 text-sm" tooltip="Vault" onClick={() => { closeIfMobile(); openTab("vault"); }}>
              <RiSafe2Line />
              <span>Vault</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem className="group-data-[collapsible=icon]:hidden">
            <SidebarMenuButton className="h-12 w-full justify-start gap-2.5 px-4 text-sm" tooltip="Transactions" onClick={() => { closeIfMobile(); openTab("tx"); }}>
              <RiFileList3Line />
              <span>Transactions</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem className="group-data-[collapsible=icon]:hidden">
            <SidebarMenuButton className="h-12 w-full justify-start gap-2.5 px-4 text-sm" tooltip="Settings" onClick={() => { closeIfMobile(); openTab("settings"); }}>
              <RiSettings3Line />
              <span>Settings</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
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
          <SidebarMenuItem className="group-data-[collapsible=icon]:hidden">
            <SidebarMenuButton
              className="h-12 w-full justify-start gap-2.5 px-4 text-sm"
              tooltip="Live support"
              onClick={() => {
                closeIfMobile();
                window.dispatchEvent(new Event("tols-support-open"));
              }}
            >
              <RiCustomerService2Line />
              <span>Live support</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}
