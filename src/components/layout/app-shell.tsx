import type { ReactNode } from "react";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { SidebarLeft } from "@/components/sidebar-left";
import { SiteHeader } from "@/components/layout/site-header";
import { SiteFooter } from "@/components/layout/site-footer";
import { MobileTabBar } from "@/components/layout/mobile-tab-bar";
import { RightDock, RightDockProvider } from "@/components/layout/right-dock";
import { NotificationProvider } from "@/lib/notifications/client";
import { WalletHubProvider } from "@/components/wallet/wallet-hub";
import { RoundViewerProvider } from "@/components/games/round-dialog";
import { GamePreviewProvider } from "@/components/games/guest-game-preview";

export function AppShell({ children }: { children: ReactNode }) {
  return (
    <SidebarProvider defaultOpen={false}>
      <NotificationProvider>
      <RoundViewerProvider>
      <GamePreviewProvider>
      <WalletHubProvider>
      <RightDockProvider>
        <SidebarLeft />
        <SidebarInset className="bg-transparent">
          <SiteHeader />
          <div className="flex min-h-[calc(100svh-3.5rem)] flex-col pb-[calc(4.25rem+env(safe-area-inset-bottom))] md:pb-0">
            <div className="flex-1 px-3 py-3 sm:px-4 sm:py-4 lg:px-8 lg:py-6">{children}</div>
            <div className="hidden md:block">
              <SiteFooter />
            </div>
          </div>
          <MobileTabBar />
        </SidebarInset>
        <RightDock />
      </RightDockProvider>
      </WalletHubProvider>
      </GamePreviewProvider>
      </RoundViewerProvider>
      </NotificationProvider>
    </SidebarProvider>
  );
}
