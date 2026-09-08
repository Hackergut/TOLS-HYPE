import { Link } from "@tanstack/react-router";
import { RiGiftLine } from "@remixicon/react";
import { PromoTile } from "@/components/home/promo-card";
import { PROMOS } from "@/lib/games-catalog";

export function PromoBanner() {
  return (
    <section className="flex flex-col gap-3">
      <div className="flex items-end justify-between gap-3">
        <div>
          <h2 className="font-heading flex items-center gap-2 text-xl font-bold tracking-tight uppercase">
            <RiGiftLine className="size-5 text-lime" />
            Promotions
          </h2>
          <p className="mt-0.5 text-xs text-muted-foreground">
            Every official TOLS offer — tap a card for full details
          </p>
        </div>
        <Link
          to="/promotions"
          className="rounded-full border border-lime/40 px-3 py-1.5 text-xs text-lime hover:bg-lime hover:text-primary"
        >
          All promos
        </Link>
      </div>
      <div className="flex gap-3 overflow-x-auto pb-1">
        {PROMOS.map((p) => (
          <PromoTile key={p.id} promo={p} />
        ))}
      </div>
    </section>
  );
}
