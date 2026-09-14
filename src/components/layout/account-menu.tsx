import { useState, useSyncExternalStore } from "react";
import { Link } from "@tanstack/react-router";
import {
  RiBankCardLine,
  RiLogoutBoxRLine,
  RiNotification3Line,
  RiVerifiedBadgeLine,
} from "@remixicon/react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ACCOUNT_ICONS } from "@/lib/account-icons";
import { ACCOUNT_NAV } from "@/lib/nav";
import { useCurrentUser } from "@/lib/auth/use-current-user";
import { hasGateSessionMarker } from "@/lib/auth/gate-session-marker";
import { useWalletHub, type WalletHubTab } from "@/components/wallet/wallet-hub";

const HUB: Partial<Record<string, WalletHubTab>> = {
  wallet: "wallet",
  settings: "settings",
  tx: "tx",
  vault: "vault",
  vip: "vip",
};

const TOP = new Set(["wallet", "settings", "alerts"]);

const subscribeToNothing = () => () => {};
const noGateOnServer = () => false;

export function AccountMenu() {
  const user = useCurrentUser();
  const { openTab } = useWalletHub();
  const [signingOut, setSigningOut] = useState(false);
  const gateSession = useSyncExternalStore(subscribeToNothing, hasGateSessionMarker, noGateOnServer);
  if (!user) return null;
  const label = user.displayName ?? user.primaryEmail ?? "Account";
  const initials = label
    .split(/\s+/)
    .map((p) => p[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
  const canSignOut = !user.isDevFallback && !gateSession;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <Button variant="ghost" size="icon" className="rounded-full" aria-label="Account">
            <Avatar>
              {user.profileImageUrl ? (
                <AvatarImage src={user.profileImageUrl} alt={label} />
              ) : null}
              <AvatarFallback>{initials}</AvatarFallback>
            </Avatar>
          </Button>
        }
      />
      <DropdownMenuContent align="end" className="w-56">
        <p className="truncate px-2 py-1.5 text-sm font-medium">{label}</p>
        <DropdownMenuGroup>
          <DropdownMenuItem onClick={() => openTab("settings")}>
            <RiVerifiedBadgeLine />
            Account
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => openTab("wallet")}>
            <RiBankCardLine />
            Billing
          </DropdownMenuItem>
          <DropdownMenuItem asChild>
            <Link to="/alerts">
              <RiNotification3Line />
              Notifications
            </Link>
          </DropdownMenuItem>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuGroup>
          {ACCOUNT_NAV.filter((item) => !TOP.has(item.icon)).map((item) => {
            const Icon = ACCOUNT_ICONS[item.icon];
            const hub = HUB[item.icon];
            if (hub) {
              return (
                <DropdownMenuItem key={item.title} onClick={() => openTab(hub)}>
                  <Icon />
                  {item.title}
                </DropdownMenuItem>
              );
            }
            return (
              <DropdownMenuItem key={item.title} asChild>
                <Link to={item.to}>
                  <Icon />
                  {item.title}
                </Link>
              </DropdownMenuItem>
            );
          })}
        </DropdownMenuGroup>
        {canSignOut ? (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              variant="destructive"
              disabled={signingOut}
              onClick={() => {
                setSigningOut(true);
                window.location.assign("/api/auth/logout");
              }}
            >
              <RiLogoutBoxRLine />
              {signingOut ? "Signing out…" : "Sign Out"}
            </DropdownMenuItem>
          </>
        ) : null}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
