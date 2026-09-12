import { Link } from "@tanstack/react-router";
import { RiFireFill, RiRecordCircleFill, RiSparkling2Fill } from "@remixicon/react";
import { AspectRatio } from "@/components/ui/aspect-ratio";
import { TolsT } from "@/components/brand/tols-mark";
import { useGamePreviewOptional } from "@/components/games/guest-game-preview";
import type { CatalogGame } from "@/lib/games-catalog";
import { cn } from "cn";

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
    <Link to="/games/$id" params={{ id: game.id }} className="group block focus-visible:outline-none">
      {face}
    </Link>
  );
}

function GameCardFace({ game, priority }: { game: CatalogGame; priority: boolean }) {
  return (
    <article
      className={cn(
        "tols-game-card",
        game.original && "is-original",
        game.live && "is-live",
      )}
    >
      <div className="relative">
        <AspectRatio ratio={9 / 16} className="overflow-hidden bg-[#16171b]">
          <img
            src={game.cover}
            alt=""
            width={360}
            height={640}
            loading={priority ? "eager" : "lazy"}
            decoding="async"
            fetchPriority={priority ? "high" : "low"}
            className="size-full object-cover motion-safe:transition-transform motion-safe:duration-(--motion-fast) motion-safe:group-hover:scale-105"
          />
        </AspectRatio>
        <div className="tols-game-card-wash pointer-events-none absolute inset-0" />
        <div className="absolute top-2 left-2 right-2 flex justify-between gap-1.5">
          {game.original ? (
            <span className="grid size-7 place-items-center rounded-md bg-black/55" title="TOLS Original" aria-label="TOLS Original">
              <TolsT className="size-5" />
            </span>
          ) : game.live ? (
            <span
              className="tols-badge-live grid size-6 place-items-center rounded-md"
              title="Live"
              aria-label="Live"
            >
              <RiRecordCircleFill className="size-3.5" />
            </span>
          ) : (
            <span />
          )}
          {game.hot ? (
            <span
              className="grid size-6 place-items-center rounded-md bg-black/70 text-orange"
              title="Hot"
              aria-label="Hot"
            >
              <RiFireFill className="size-3.5" />
            </span>
          ) : game.isNew ? (
            <span
              className="grid size-6 place-items-center rounded-md bg-black/70 text-lime"
              title="New"
              aria-label="New"
            >
              <RiSparkling2Fill className="size-3.5" />
            </span>
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
            <TolsT className="size-7 shrink-0" />
          </div>
        </div>
        <span className="tols-game-card-bar absolute inset-x-0 bottom-0" />
      </div>
    </article>
  );
}
