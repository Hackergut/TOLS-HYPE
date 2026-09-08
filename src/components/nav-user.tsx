"use client";

import { Link } from "@tanstack/react-router";
import { RiLogoutBoxLine, RiUser3Line } from "@remixicon/react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";
import { authEnabled, signOut } from "@/lib/auth/client";
import { hasGateSessionMarker } from "@/lib/auth/gate-session-marker";
import { useCurrentUserState } from "@/lib/auth/use-current-user";

export function NavUser() {
  const { isMobile } = useSidebar();
  const { user, isPending } = useCurrentUserState();
  if (isPending || !user) return null;
  const label = user.displayName ?? user.primaryEmail ?? "Account";
  const gateSession = typeof window !== "undefined" && hasGateSessionMarker();

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton size="lg" className="h-12">
              <Avatar className="size-8 rounded-lg">
                {user.profileImageUrl ? (
                  <AvatarImage src={user.profileImageUrl} alt="" />
                ) : null}
                <AvatarFallback className="rounded-lg">
                  {label.charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div className="grid flex-1 text-left text-sm leading-tight">
                <span className="truncate font-medium">{label}</span>
                <span className="truncate text-xs text-muted-foreground">
                  {user.primaryEmail ?? "Signed in"}
                </span>
              </div>
            </SidebarMenuButton>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            className="min-w-56 rounded-lg"
            side={isMobile ? "bottom" : "right"}
            align="start"
          >
            <DropdownMenuLabel>{label}</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <Link to="/profile">
                <RiUser3Line />
                Profile
              </Link>
            </DropdownMenuItem>
            {authEnabled && !gateSession ? (
              <DropdownMenuItem
                onClick={() => {
                  void signOut("/").catch(() => undefined);
                }}
              >
                <RiLogoutBoxLine />
                Sign out
              </DropdownMenuItem>
            ) : null}
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  );
}
