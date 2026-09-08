import { Link } from "@tanstack/react-router";
import { RiAddLine, RiChat3Line, RiSearchLine } from "@remixicon/react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Skeleton } from "@/components/ui/skeleton";
import { SignedIn, SignedOut } from "@/lib/auth/gates";
import { useCurrentUserState } from "@/lib/auth/use-current-user";
import { TolsMark } from "@/components/brand/tols-mark";
import { useRightDock } from "@/components/layout/right-dock";
import { AccountMenu } from "@/components/layout/account-menu";
import { NotificationBell } from "@/components/layout/notification-bell";
import { WalletChip, useWalletHub } from "@/components/wallet/wallet-hub";

export function SiteHeader() {
  const { user, isPending } = useCurrentUserState();
  const { toggle } = useRightDock();
  const { openTab } = useWalletHub();

  return (
    <header className="sticky top-0 z-30 flex h-12 items-center gap-2 border-b border-border bg-background/70 px-2 backdrop-blur-xl md:h-16 md:gap-3 md:px-5">
      <SidebarTrigger className="size-11 md:hidden" />
      <TolsMark />
      <div className="relative mx-auto hidden max-w-md flex-1 md:block">
        <RiSearchLine className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Search games..."
          className="h-10 rounded-lg border-border bg-muted/40 pl-9"
        />
      </div>
      <div className="ml-auto flex items-center gap-1.5 md:gap-2">
        {isPending ? (
          <Skeleton className="h-9 w-24 rounded-lg md:w-36" />
        ) : user ? (
          <>
            <WalletChip />
            <Button className="h-9 rounded-lg px-2.5 md:h-10 md:px-3" onClick={() => openTab("wallet")}>
              <RiAddLine className="size-4" />
              <span className="hidden sm:inline">Wallet</span>
            </Button>
          </>
        ) : null}
        <Button
          variant="ghost"
          size="icon"
          className="size-10"
          aria-label="Chat"
          onClick={() => toggle("chat")}
        >
          <RiChat3Line className="size-5" />
        </Button>
        <SignedIn>
          <NotificationBell />
        </SignedIn>
        {isPending ? (
          <Skeleton className="size-9 rounded-full" />
        ) : (
          <>
            <SignedOut>
              <Button asChild variant="outline" className="h-9 rounded-lg px-3 md:h-10 md:px-4">
                <Link to="/login">Login</Link>
              </Button>
              <Button asChild className="h-9 rounded-lg px-3 md:h-10 md:px-4">
                <Link to="/login">Register</Link>
              </Button>
            </SignedOut>
            <SignedIn>
              <AccountMenu />
            </SignedIn>
          </>
        )}
      </div>
    </header>
  );
}
