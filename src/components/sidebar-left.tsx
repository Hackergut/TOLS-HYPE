"use client";

import type { ComponentProps } from "react";
import { Link, useRouterState } from "@tanstack/react-router";
import {
  RiHome5Line,
  RiDiceLine,
  RiTvLine,
  RiBasketballLine,
  RiShieldCheckLine,
} from "@remixicon/react";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
  useSidebar,
} from "@/components/ui/sidebar";
import { TolsT, TolsWordmark } from "@/components/brand/tols-mark";
import { BROWSE_FOOT, BROWSE_NAV } from "@/lib/nav";

const ICONS = {
  home: RiHome5Line,
  dice: RiDiceLine,
  live: RiTvLine,
  sports: RiBasketballLine,
  fairness: RiShieldCheckLine,
};

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
      <SidebarContent className="px-2 group-data-[collapsible=icon]:items-center group-data-[collapsible=icon]:px-0">
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
                  className="h-12 w-full justify-start gap-3 px-3 text-sm group-data-[collapsible=icon]:size-10 group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:px-0"
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
