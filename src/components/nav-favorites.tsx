"use client";

import { Link } from "@tanstack/react-router";
import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";

export function NavFavorites({
  favorites,
}: {
  favorites: { name: string; to: string; hint: string; id?: string }[];
}) {
  return (
    <SidebarGroup className="group-data-[collapsible=icon]:hidden">
      <SidebarGroupLabel>Categories</SidebarGroupLabel>
      <SidebarMenu>
        {favorites.map((item) => (
          <SidebarMenuItem key={item.name}>
            <SidebarMenuButton asChild>
              {item.to === "/games/$id" && item.id ? (
                <Link to="/games/$id" params={{ id: item.id }}>
                  <span>{item.name}</span>
                </Link>
              ) : (
                <Link to="/casino">
                  <span>{item.name}</span>
                </Link>
              )}
            </SidebarMenuButton>
          </SidebarMenuItem>
        ))}
      </SidebarMenu>
    </SidebarGroup>
  );
}
