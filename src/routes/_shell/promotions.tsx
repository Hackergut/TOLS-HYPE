import { createFileRoute } from "@tanstack/react-router";
import { PromoDetail } from "@/components/home/promo-card";
import { TolsBreadcrumb } from "@/components/layout/tols-breadcrumb";
import { BluescreenTitle } from "@/components/brand/bluescreen-title";
import { PROMOS } from "@/lib/games-catalog";

export const Route = createFileRoute("/_shell/promotions")({
  component: PromotionsPage,
  head: () => ({ meta: [{ title: "Promotions — TOLS" }] }),
});

function PromotionsPage() {
  return (
    <main className="mx-auto flex w-full max-w-6xl flex-col gap-6">
      <TolsBreadcrumb items={[{ label: "Lobby", to: "/" }, { label: "Promotions" }]} />
      <header>
        <p className="text-xs font-medium tracking-[0.18em] text-lime uppercase">{PROMOS.length} offers</p>
        <BluescreenTitle as="h1" className="mt-1 text-2xl font-bold tracking-tight md:text-3xl">
          Promotions
        </BluescreenTitle>
        <p className="mt-1 text-sm text-muted-foreground">Every official TOLS promotion, in one place</p>
      </header>
      <ul className="grid gap-3 md:grid-cols-2 md:gap-4">
        {PROMOS.map((p) => (
          <li key={p.id}>
            <PromoDetail promo={p} />
          </li>
        ))}
      </ul>
    </main>
  );
}
