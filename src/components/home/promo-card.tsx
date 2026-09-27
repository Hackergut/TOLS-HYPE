import { Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import type { PROMOS } from "@/lib/games-catalog";
import { cn } from "cn";

export type Promo = (typeof PROMOS)[number];

/** Same artwork card as the lobby promo shelf. */
export function PromoCardFace({
  promo,
  className,
  heading = "h3",
}: {
  promo: Promo;
  className?: string;
  heading?: "h1" | "h3";
}) {
  const Title = heading;
  return (
    <div
      className={cn(
        "relative aspect-video w-full min-w-0 overflow-hidden rounded-2xl ring-1 ring-white/10",
        className,
      )}
    >
      <img
        src={promo.image}
        alt={promo.title}
        width={1600}
        height={900}
        sizes="(max-width: 600px) 90vw, (max-width: 992px) 45vw, 30vw"
        decoding="async"
        className="absolute inset-0 size-full object-cover transition-transform duration-500 group-hover:scale-[1.04]"
      />
      <div className="pointer-events-none absolute inset-0 bg-linear-to-t from-black/75 via-black/15 to-transparent" />
      <div className="absolute top-2.5 left-2.5 flex gap-1.5">
        <span className="rounded-md bg-black/65 px-1.5 py-0.5 text-[0.6rem] font-semibold tracking-wider text-lime uppercase">
          {promo.kicker}
        </span>
        <span className="rounded-md bg-black/65 px-1.5 py-0.5 text-[0.6rem] font-semibold tracking-wider text-white/80 uppercase">
          {promo.tag}
        </span>
      </div>
      <div className="absolute inset-x-0 bottom-0 p-3 pb-4">
        <Title className="font-bluescreens text-sm leading-tight font-semibold tracking-wide text-white uppercase sm:text-lg">
          {promo.title}
        </Title>
        <p className="mt-0.5 line-clamp-1 text-xs text-white/70">{promo.copy}</p>
        <span className="mt-2 inline-flex rounded-full bg-lime px-2 py-0.5 text-[0.65rem] font-bold text-[#0d0d10]">
          {promo.badge}
        </span>
      </div>
    </div>
  );
}

export function PromoTile({ promo, className }: { promo: Promo; className?: string }) {
  return (
    <Link
      to="/promotions"
      hash={promo.id}
      className={cn(
        "group block w-full min-w-0 transition duration-300 hover:scale-[1.03]",
        "focus-visible:rounded-2xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-lime",
        className,
      )}
    >
      <PromoCardFace promo={promo} className="group-hover:ring-2 group-hover:ring-lime" />
    </Link>
  );
}

export function PromoDetail({ promo }: { promo: Promo }) {
  return (
    <Card id={promo.id} className="scroll-mt-20 gap-0 overflow-hidden rounded-2xl py-0 ring-1 ring-white/10">
      <div className="relative aspect-video overflow-hidden">
        <img
          src={promo.image}
          alt={promo.title}
          width={1600}
          height={900}
          className="absolute inset-0 size-full object-cover"
        />
        <div className="pointer-events-none absolute inset-0 bg-linear-to-t from-black/75 via-black/15 to-transparent" />
        <div className="absolute top-2.5 left-2.5 flex gap-1.5">
          <span className="rounded-md bg-black/65 px-1.5 py-0.5 text-[0.6rem] font-semibold tracking-wider text-lime uppercase">
            {promo.kicker}
          </span>
          <span className="rounded-md bg-black/65 px-1.5 py-0.5 text-[0.6rem] font-semibold tracking-wider text-white/80 uppercase">
            {promo.tag}
          </span>
        </div>
        <div className="absolute inset-x-0 bottom-0 p-3 pb-4">
          <h3 className="font-bluescreens text-sm leading-tight font-semibold tracking-wide text-white uppercase sm:text-lg">
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
    </Card>
  );
}
