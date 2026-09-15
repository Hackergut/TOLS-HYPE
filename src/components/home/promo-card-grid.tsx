import { PromoTile } from "@/components/home/promo-card";
import { PROMOS } from "@/lib/games-catalog";

/** The canonical promo artwork set, shared by the lobby and affiliate desk. */
export function PromoCardGrid() {
  return (
    <section aria-label="Promotions" className="flex flex-col gap-4">
      <div className="flex items-end justify-between gap-3">
        <div>
          <p className="font-bluescreens text-lg font-bold tracking-wide text-white uppercase md:text-xl">Promotions</p>
          <p className="mt-1 text-xs text-muted-foreground">Official TOLS offers and campaigns</p>
        </div>
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {PROMOS.map((promo) => (
          <PromoTile key={promo.id} promo={promo} className="min-w-0" />
        ))}
      </div>
    </section>
  );
}
