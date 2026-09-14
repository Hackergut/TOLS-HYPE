import { Outlet, createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/layout/app-shell";
import { WalletProvider } from "@/lib/wallet-context";

export const Route = createFileRoute("/_shell")({
  component: ShellLayout,
});

function ShellLayout() {
  return (
    <WalletProvider>
      <AppShell>
        <Outlet />
      </AppShell>
    </WalletProvider>
  );
}
