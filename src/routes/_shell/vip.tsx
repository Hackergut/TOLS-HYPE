import { createFileRoute, Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { TolsBreadcrumb } from "@/components/layout/tols-breadcrumb";
import { VipProgressWidget, VipRewardsGrid } from "@/components/vip/vip-widgets";
import { VIP_TIERS } from "@/lib/vip";

export const Route = createFileRoute("/_shell/vip")({
  component: VipPage,
  head: () => ({ meta: [{ title: "VIP Program — TOLS" }] }),
});

function VipPage() {
  return (
    <main className="mx-auto flex w-full max-w-5xl flex-col gap-6">
      <TolsBreadcrumb items={[{ label: "Lobby", to: "/" }, { label: "VIP Program" }]} />
      <header>
        <h1 className="font-heading text-3xl font-bold tracking-tight">VIP Program</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          1 point per $1 wagered. Tiers auto-upgrade. Perks stack.
        </p>
      </header>

      <VipProgressWidget />

      <VipRewardsGrid />

      <section>
        <h2 className="mb-3 text-lg font-bold">Level hierarchy</h2>
        <ol className="grid gap-3 sm:grid-cols-2">
          {VIP_TIERS.map((t, i) => (
            <li
              key={t.name}
              className="rounded-2xl bg-card p-5 shadow-[var(--shadow-border)]"
            >
              <div className="flex items-center justify-between">
                <p className="text-xs font-medium tracking-[0.18em] text-gold uppercase">
                  Level {i + 1} · {t.name}
                </p>
                <span className="text-2xl" aria-hidden>
                  {t.icon}
                </span>
              </div>
              <p className="mt-2 text-sm text-muted-foreground">
                {i === 0 ? "Starting tier" : `${t.points.toLocaleString("en-US")} points required`} · wagered {t.wager}
              </p>
              <p className="mt-3 text-2xl font-bold text-lime">{t.rake} rakeback</p>
              <p className="mt-1 text-sm text-muted-foreground">Cashback {t.cash}</p>
              <div className="mt-3 border-t border-white/6 pt-3">
                <p className="text-[0.7rem] font-medium tracking-wider text-white/50 uppercase">Perk</p>
                <p className="mt-0.5 text-sm">{t.perk}</p>
              </div>
              <div className="mt-2">
                <p className="text-[0.7rem] font-medium tracking-wider text-white/50 uppercase">Level-up reward</p>
                <p className="mt-0.5 text-sm text-lime">{t.reward}</p>
              </div>
            </li>
          ))}
        </ol>
      </section>

      <Button asChild className="h-11 w-fit">
        <Link to="/casino">Play Originals</Link>
      </Button>
    </main>
  );
}