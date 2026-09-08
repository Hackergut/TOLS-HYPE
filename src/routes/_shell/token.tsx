import { createFileRoute, Link } from "@tanstack/react-router";
import { TolsBreadcrumb } from "@/components/layout/tols-breadcrumb";
import { useWallet } from "@/lib/wallet-context";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/_shell/token")({
  component: TokenPage,
  head: () => ({ meta: [{ title: "Token — TOLS" }] }),
});

function TokenPage() {
  const { wagered } = useWallet();
  const points = Math.floor(wagered);

  return (
    <main className="mx-auto flex w-full max-w-md flex-col gap-6">
      <TolsBreadcrumb items={[{ label: "Lobby", to: "/" }, { label: "Token" }]} />
      <header>
        <h1 className="font-heading text-3xl font-bold tracking-tight">TOLS Token</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          1 point per $1 wagered. Points track VIP. They are not a chain token in this preview.
        </p>
      </header>
      <p className="rounded-2xl bg-card p-6 font-heading text-4xl font-bold tabular-nums shadow-[var(--shadow-border)]">
        {points.toLocaleString()}
      </p>
      <Button asChild variant="outline">
        <Link to="/vip">VIP program</Link>
      </Button>
    </main>
  );
}
