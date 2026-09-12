import { Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import type { PROMOS } from "@/lib/games-catalog";
import { cn } from "cn";

export type Promo = (typeof PROMOS)[number];

export function PromoTile({ promo, className }: { promo: Promo; className?: string }) {
  return (
    <Link
      to="/promotions"
      hash={promo.id}
      className={cn(
        "tols-game-card is-original relative block min-w-64 shrink-0 sm:min-w-80",
        className,
      )}
    >
      <img src={promo.image} alt="" className="h-44 w-full object-cover sm:h-48" loading="lazy" decoding="async" width={640} height={192} />
      <div className="tols-game-card-wash pointer-events-none absolute inset-0" />
      <div className="absolute top-2.5 left-2.5 flex gap-1.5">
        <span className="tols-badge-original rounded-md px-1.5 py-0.5 text-[0.6rem] tracking-wider uppercase">
          {promo.kicker}
        </span>
        <span className="rounded-md bg-black/65 px-1.5 py-0.5 text-[0.6rem] font-semibold tracking-wider text-white/80 uppercase">
          {promo.tag}
        </span>
      </div>
      <div className="absolute inset-x-0 bottom-0 p-3 pb-4">
        <h3 className="font-bluescreens text-base font-semibold tracking-wide text-white uppercase sm:text-lg">
          {promo.title}
        </h3>
        <p className="mt-0.5 line-clamp-1 text-xs text-white/70">{promo.copy}</p>
        <span className="mt-2 inline-flex rounded-full bg-lime px-2 py-0.5 text-[0.65rem] font-bold text-[#0d0d10]">
          {promo.badge}
        </span>
      </div>
      <span className="tols-game-card-bar absolute inset-x-0 bottom-0" />
    </Link>
  );
}

export function PromoDetail({ promo }: { promo: Promo }) {
  return (
    <Card id={promo.id} className="tols-game-card is-original scroll-mt-20 gap-0 overflow-hidden rounded-2xl py-0 ring-0">
      <div className="relative">
        <img src={promo.image} alt="" className="h-44 w-full object-cover sm:h-48" />
        <div className="pointer-events-none absolute inset-0 tols-game-card-wash" />
        <div className="absolute top-2.5 left-2.5 flex gap-1.5">
          <span className="rounded-md bg-black/65 px-1.5 py-0.5 text-[0.6rem] font-semibold tracking-wider text-lime uppercase">
            {promo.kicker}
          </span>
          <span className="rounded-md bg-black/65 px-1.5 py-0.5 text-[0.6rem] font-semibold tracking-wider text-white/80 uppercase">
            {promo.tag}
          </span>
        </div>
        <div className="absolute inset-x-0 bottom-0 p-3 pb-4">
          <h3 className="font-bluescreens text-base font-semibold tracking-wide text-white uppercase sm:text-lg">
            {promo.title}
          </h3>
          <p className="mt-0.5 line-clamp-1 text-xs text-white/70">{promo.copy}</p>
          <span className="mt-2 inline-flex rounded-full bg-lime px-2 py-0.5 text-[0.65rem] font-bold text-[#05000a]">
            {promo.badge}
          </span>
        </div>
      </div>
      <CardHeader className="px-5 pt-4">
        <p className="text-sm leading-relaxed text-white/75">{promo.body}</p>
      </CardHeader>
      <CardContent className="px-5 pb-2">
        <ul className="space-y-1 text-sm text-white/60">
          {promo.bullets.map((b) => (
            <li key={b} className="flex gap-2">
              <span className="mt-1.5 size-1 shrink-0 rounded-full bg-lime" />
              {b}
            </li>
          ))}
        </ul>
      </CardContent>
      <CardFooter className="px-5 pb-5">
        <Button asChild className="h-10">
          <Link to={promo.to}>{promo.cta}</Link>
        </Button>
      </CardFooter>
      <span className="tols-game-card-bar" />
    </Card>
  );
}
