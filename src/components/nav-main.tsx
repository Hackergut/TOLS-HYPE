"use client";

import type { ReactNode } from "react";
import { Link, useRouterState } from "@tanstack/react-router";
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";

type MainTo = "/" | "/casino" | "/live" | "/sports" | "/promotions";

export function NavMain({
  items,
}: {
  items: {
    title: string;
    to: MainTo;
    icon: ReactNode;
  }[];
}) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  return (
    <SidebarMenu>
      {items.map((item) => (
        <SidebarMenuItem key={item.title}>
          <SidebarMenuButton asChild isActive={pathname === item.to} className="h-11">
            <Link to={item.to}>
              {item.icon}
              <span>{item.title}</span>
            </Link>
          </SidebarMenuButton>
        </SidebarMenuItem>
      ))}
    </SidebarMenu>
  );
}
