import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { RiFireFill, RiRecordCircleFill, RiSparkling2Fill } from "@remixicon/react";
import { AspectRatio } from "@/components/ui/aspect-ratio";
import { Badge } from "@/components/ui/badge";
import type { CatalogGame } from "@/lib/games-catalog";

const FALLBACK = "/brand/games/slots.jpg";

export function GameCard({ game }: { game: CatalogGame }) {
  const providerArt = game.kind === "iframe" || (!game.original && game.category === "slots");
  const [src, setSrc] = useState(game.cover || FALLBACK);

  return (
    <Link to="/games/$id" params={{ id: game.id }} className="group block focus-visible:outline-none">
      <article className="overflow-hidden rounded-2xl bg-card transition-transform duration-(--motion-fast) ease-(--ease-smooth-out) group-hover:-translate-y-0.5">
        <div className="relative">
          <AspectRatio ratio={providerArt ? 3 / 4 : 9 / 16} className="overflow-hidden bg-muted">
            <img
              src={src}
              alt=""
              width={providerArt ? 480 : 360}
              height={providerArt ? 640 : 640}
              loading="lazy"
              decoding="async"
              onError={() => setSrc(FALLBACK)}
              className="size-full rounded-md object-cover object-center transition-transform duration-(--motion-fast) group-hover:scale-105"
            />
          </AspectRatio>
          <div className="pointer-events-none absolute inset-0 bg-linear-to-t from-primary/90 via-black/10 to-transparent" />
          <div className="absolute top-2 left-2 right-2 flex justify-between gap-1.5">
            {game.original ? (
              <Badge className="border-0 bg-primary text-primary-foreground">ORIGINAL</Badge>
            ) : game.live ? (
              <Badge className="size-6 justify-center border-0 bg-destructive p-0 text-white" title="Live" aria-label="Live">
                <RiRecordCircleFill className="size-3.5" />
              </Badge>
            ) : (
              <span />
            )}
            {game.hot ? (
              <Badge className="size-6 justify-center border-0 bg-black/80 p-0 text-orange-400" title="Hot" aria-label="Hot">
                <RiFireFill className="size-3.5" />
              </Badge>
            ) : game.isNew ? (
              <Badge className="size-6 justify-center border-0 bg-black/80 p-0 text-lime" title="New" aria-label="New">
                <RiSparkling2Fill className="size-3.5" />
              </Badge>
            ) : null}
          </div>
          <div className="absolute inset-x-0 bottom-0 p-3">
            <div className="flex items-end justify-between gap-2">
              <div className="min-w-0">
                <h3 className="font-bluescreens text-sm font-semibold tracking-wide text-white uppercase">
                  {game.title}
                </h3>
                <p className="text-[0.7rem] text-white/65">{game.provider}</p>
              </div>
              <img src="/brand/tols-t.png" alt="" className="size-7 shrink-0 object-contain" />
            </div>
          </div>
          <span className="absolute inset-x-0 bottom-0 h-1 bg-lime" />
        </div>
      </article>
    </Link>
  );
}
