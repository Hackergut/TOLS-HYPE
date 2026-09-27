import { Link } from "@tanstack/react-router";
import { PromoTile } from "@/components/home/promo-card";
import { BluescreenTitle } from "@/components/brand/bluescreen-title";
import { PROMOS } from "@/lib/games-catalog";

export function PromoBanner() {
  return (
    <section className="flex flex-col gap-3">
      <div className="flex items-end justify-between gap-3">
        <div>
          <BluescreenTitle as="h2" className="flex items-center gap-2 text-xl font-bold">
            Promotions
          </BluescreenTitle>
          <p className="mt-0.5 text-xs text-muted-foreground">
            Every official TOLS offer — tap a card for full details
          </p>
        </div>
        <Link
          to="/promotions"
          className="rounded-full border border-lime/40 px-3 py-1.5 text-xs text-lime hover:bg-lime hover:text-black"
        >
          All promos
        </Link>
      </div>
      <div className="flex snap-x snap-mandatory gap-3 overflow-x-auto pb-1">
        {PROMOS.map((p) => (
          <PromoTile key={p.id} promo={p} className="snap-start" />
        ))}
      </div>
    </section>
  );
}
