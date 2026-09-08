import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { TolsBreadcrumb } from "@/components/layout/tols-breadcrumb";
import { useCurrentUserState } from "@/lib/auth/use-current-user";
import { RedirectToSignIn } from "@/lib/auth/gates";
import { useWallet } from "@/lib/wallet-context";
import { formatMoney } from "@/lib/format";

export const Route = createFileRoute("/_shell/vault")({
  component: VaultPage,
  head: () => ({ meta: [{ title: "Vault — TOLS" }] }),
});

function VaultPage() {
  const { user, isPending } = useCurrentUserState();
  const { currency, balances } = useWallet();
  const [locked, setLocked] = useState(0);
  const [amount, setAmount] = useState(0);
  if (isPending) return <div className="h-40 animate-pulse rounded-2xl bg-muted" />;
  if (!user) return <RedirectToSignIn />;

  function lock() {
    const n = Math.min(balances[currency], Math.max(0, amount));
    setLocked((v) => v + n);
    toast.success(`Locked ${formatMoney(n, currency)} ${currency}`);
  }

  return (
    <main className="mx-auto flex w-full max-w-md flex-col gap-6">
      <TolsBreadcrumb items={[{ label: "Lobby", to: "/" }, { label: "Vault" }]} />
      <header>
        <h1 className="font-heading text-3xl font-bold tracking-tight">Vault</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Park play-money so it is harder to stake on tilt. Unlock anytime.
        </p>
      </header>
      <p className="rounded-2xl bg-card p-4 text-sm shadow-[var(--shadow-border)]">
        Locked <span className="tabular-nums font-semibold">{formatMoney(locked, currency)}</span> {currency}
      </p>
      <Input type="number" value={amount} onChange={(e) => setAmount(Number(e.target.value))} className="h-11 tabular-nums" />
      <Button className="h-11" onClick={lock}>Lock</Button>
    </main>
  );
}
