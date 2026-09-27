import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { useGamePreviewOptional } from "@/components/games/guest-game-preview";
import { TolsT } from "@/components/brand/tols-mark";
import type { CatalogGame } from "@/lib/games-catalog";
import { cn } from "cn";

/** Shuffle originals thumb: padding-bottom 140% ≈ 256×359. Chrome matches TOLS Limbo tile. */
export function GameCard({ game, priority = false }: { game: CatalogGame; priority?: boolean }) {
  const preview = useGamePreviewOptional();
  const face = <GameCardFace game={game} priority={priority} />;

  if (preview?.isGuest) {
    return (
      <button
        type="button"
        onClick={() => preview.open(game)}
        className="group block w-full text-left focus-visible:outline-none"
      >
        {face}
      </button>
    );
  }

  return (
    <Link to="/games/$id" params={{ id: game.id }} className="group block w-full focus-visible:outline-none">
      {face}
    </Link>
  );
}

function GameCardFace({ game, priority }: { game: CatalogGame; priority: boolean }) {
  const [loaded, setLoaded] = useState(false);
  const [failed, setFailed] = useState(false);
  const kicker = game.original ? "TOLS Originals" : game.live ? "Live" : game.provider;

  return (
    <article className={cn("tols-game-card relative", game.original && "is-original", game.live && "is-live")}>
      <span className="relative block w-full overflow-hidden bg-[#0c0c10] pb-[140%]">
        {!loaded && !failed ? <div className="tols-card-shimmer absolute inset-0" aria-hidden /> : null}
        {!failed ? (
          <img
            src={game.cover}
            alt=""
            width={256}
            height={359}
            loading={priority ? "eager" : "lazy"}
            decoding="async"
            fetchPriority={priority ? "high" : "low"}
            onLoad={() => setLoaded(true)}
            onError={() => setFailed(true)}
            className={cn(
              "absolute inset-0 size-full object-cover object-center transition duration-150 group-hover:scale-[1.03]",
              loaded ? "opacity-100" : "opacity-0",
            )}
          />
        ) : (
          <div className="absolute inset-0 grid place-items-center bg-[#101014]">
            <TolsT className="size-12 opacity-30" />
          </div>
        )}
        <span className="tols-game-card-wash pointer-events-none absolute inset-0" />

        <TolsT className="absolute top-2 left-2 z-1 size-5 sm:top-3 sm:left-3 sm:size-6" />

        <span className="absolute inset-x-0 bottom-0 z-1 px-2 pt-6 pb-2 sm:px-3 sm:pt-10 sm:pb-3.5">
          <h3 className="font-bluescreens line-clamp-2 text-[12px] leading-[1.05] font-bold tracking-[0.03em] text-white uppercase sm:text-[15px] sm:tracking-[0.04em]">
            {game.title}
          </h3>
          <p className="mt-1 text-[10px] leading-none font-medium text-white/75 sm:mt-1.5 sm:text-[11px]">{kicker}</p>
        </span>

        <span className="tols-game-card-bar absolute inset-x-0 bottom-0 z-2" />
      </span>
    </article>
  );
}

export function GameCardSkeleton() {
  return (
    <div className="overflow-hidden rounded-2xl bg-[#16171b]" aria-hidden>
      <span className="tols-card-shimmer relative block w-full pb-[140%]" />
    </div>
  );
}
