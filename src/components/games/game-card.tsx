import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { RiPlayFill } from "@remixicon/react";
import { TolsT } from "@/components/brand/tols-mark";
import { useGamePreviewOptional } from "@/components/games/guest-game-preview";
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

function rimClass(game: CatalogGame): string {
  if (game.live) return "border-[#e1514e]";
  if (game.kind === "crazy") return "border-[#904bf9]";
  if (game.kind === "crash" || game.hot) return "border-[#ff8904]";
  if (game.original) return "border-lime/80";
  return "border-white/12";
}

function GameCardFace({ game, priority }: { game: CatalogGame; priority: boolean }) {
  const [loaded, setLoaded] = useState(false);
  const [failed, setFailed] = useState(false);
  const kicker = game.original ? "TOLS Originals" : game.live ? "Live" : "Casino";

  return (
    <article className={cn("tols-game-card relative", game.original && "is-original", game.live && "is-live")}>
      <span className="relative block w-full overflow-hidden rounded-2xl bg-[#101014] pb-[140%]">
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
          <div className="absolute inset-0 grid place-items-center bg-[#16171b]">
            <TolsT className="size-10 opacity-30" />
          </div>
        )}
        <span className="pointer-events-none absolute inset-0 bg-linear-to-t from-black/80 via-black/10 to-transparent" />
        <span className={cn("pointer-events-none absolute inset-0 rounded-2xl border", rimClass(game))} />

        <span className="absolute top-2.5 left-2.5 z-1 grid size-8 place-items-center rounded-lg bg-black/55 ring-1 ring-white/10">
          <TolsT className="size-5" />
        </span>
        {game.hot ? (
          <span className="absolute top-2.5 right-2.5 z-1 text-base leading-none" aria-label="Hot">
            🔥
          </span>
        ) : null}

        <span className="absolute inset-x-0 bottom-0 z-1 p-3">
          <h3 className="font-heading text-[15px] font-bold tracking-wide text-white uppercase">{game.title}</h3>
          <p className="mt-0.5 text-[11px] font-medium text-white/70">{kicker}</p>
        </span>

        <span className="absolute right-2 bottom-12 z-1 grid size-9 place-items-center rounded-md bg-black/70 text-white opacity-0 transition duration-150 group-hover:opacity-100 group-focus-visible:opacity-100">
          <RiPlayFill className="size-4 translate-x-px" />
        </span>
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
