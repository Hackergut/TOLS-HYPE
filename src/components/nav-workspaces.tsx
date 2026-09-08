"use client";

import { Link } from "@tanstack/react-router";
import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";

export function NavWorkspaces({
  workspaces,
}: {
  workspaces: { name: string; id: string }[];
}) {
  return (
    <SidebarGroup className="group-data-[collapsible=icon]:hidden">
      <SidebarGroupLabel>Tables</SidebarGroupLabel>
      <SidebarMenu>
        {workspaces.map((item) => (
          <SidebarMenuItem key={item.id}>
            <SidebarMenuButton asChild>
              <Link to="/games/$id" params={{ id: item.id }}>
                {item.name}
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        ))}
      </SidebarMenu>
    </SidebarGroup>
  );
}
