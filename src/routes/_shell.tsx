import { Outlet, createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/layout/app-shell";
import { WalletProvider } from "@/lib/wallet-context";
import { TolsBootLoader } from "@/components/brand/tols-boot-loader";

export const Route = createFileRoute("/_shell")({
  component: ShellLayout,
});

function ShellLayout() {
  return (
    <WalletProvider>
      <TolsBootLoader />
      <AppShell>
        <Outlet />
      </AppShell>
    </WalletProvider>
  );
}
