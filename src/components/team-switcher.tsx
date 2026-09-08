"use client";

import { Link } from "@tanstack/react-router";
import { SidebarMenu, SidebarMenuButton, SidebarMenuItem } from "@/components/ui/sidebar";
import { TolsT, TolsWordmark } from "@/components/brand/tols-mark";

export function TeamSwitcher() {
  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <SidebarMenuButton asChild className="h-11 px-2">
          <Link to="/">
            <TolsT className="size-6" />
            <TolsWordmark className="h-4 w-auto" />
          </Link>
        </SidebarMenuButton>
      </SidebarMenuItem>
    </SidebarMenu>
  );
}
