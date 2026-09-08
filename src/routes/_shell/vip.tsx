import { createFileRoute, Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { TolsBreadcrumb } from "@/components/layout/tols-breadcrumb";

export const Route = createFileRoute("/_shell/vip")({
  component: VipPage,
  head: () => ({ meta: [{ title: "VIP Program — TOLS" }] }),
});

const TIERS = [
  { name: "Member", wager: "$0", rake: "5%", cash: "—", perk: "Welcome bonus" },
  { name: "Gold", wager: "$1,000", rake: "10%", cash: "—", perk: "Faster cashier" },
  { name: "Diamond", wager: "$5,000", rake: "15%", cash: "10% monthly", perk: "Priority support" },
  { name: "Obsidian", wager: "$25,000", rake: "20%", cash: "10% monthly", perk: "Host + reload" },
];

function VipPage() {
  return (
    <main className="mx-auto flex w-full max-w-4xl flex-col gap-6">
      <TolsBreadcrumb items={[{ label: "Lobby", to: "/" }, { label: "VIP Program" }]} />
      <header>
        <h1 className="font-heading text-3xl font-bold tracking-tight">VIP Program</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          1 point per $1 wagered. Tiers auto-upgrade. Perks stack.
        </p>
      </header>
      <div className="grid gap-3 sm:grid-cols-2">
        {TIERS.map((t) => (
          <article key={t.name} className="rounded-2xl bg-card p-5 shadow-[var(--shadow-border)]">
            <p className="text-xs font-medium tracking-[0.18em] text-gold uppercase">{t.name}</p>
            <p className="mt-2 text-sm text-muted-foreground">Wagered {t.wager}</p>
            <p className="mt-3 text-2xl font-bold text-lime">{t.rake} rakeback</p>
            <p className="mt-1 text-sm text-muted-foreground">Cashback {t.cash}</p>
            <p className="mt-2 text-sm">{t.perk}</p>
          </article>
        ))}
      </div>
      <Button asChild className="h-11 w-fit">
        <Link to="/casino">Play Originals</Link>
      </Button>
    </main>
  );
}
