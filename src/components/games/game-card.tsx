import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { RiFireFill, RiPlayFill, RiSparkling2Fill } from "@remixicon/react";
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

function formatPlayers(n: number): string {
  if (n >= 1000) return `${(n / 1000).toFixed(1).replace(/\.0$/, "")}k`;
  return String(n);
}

function formatRtp(rtp: number): string {
  return `${Number(rtp.toFixed(1))}%`;
}

function GameCardFace({ game, priority }: { game: CatalogGame; priority: boolean }) {
  const [loaded, setLoaded] = useState(false);
  const [failed, setFailed] = useState(false);
  return (
    <article
      className={cn(
        "tols-game-card",
        game.original && "is-original",
        game.live && "is-live",
      )}
    >
      <div className="relative">
        <AspectRatio ratio={9 / 16} className="overflow-hidden bg-[#101014]">
          {!loaded && !failed ? <div className="tols-card-shimmer absolute inset-0" aria-hidden /> : null}
          {!failed ? (
            <img
              src={game.cover}
              alt=""
              width={360}
              height={640}
              loading={priority ? "eager" : "lazy"}
              decoding="async"
              fetchPriority={priority ? "high" : "low"}
              onLoad={() => setLoaded(true)}
              onError={() => setFailed(true)}
              className={cn(
                "size-full object-cover transition-opacity duration-500 motion-safe:transition-[opacity,transform] motion-safe:duration-500 motion-safe:group-hover:scale-[1.06]",
                loaded ? "opacity-100" : "opacity-0",
              )}
            />
          ) : (
            <div className="grid size-full place-items-center bg-[#16171b]">
              <TolsT className="size-12 opacity-30" />
            </div>
          )}
        </AspectRatio>
        {/* hover scrim */}
        <div className="pointer-events-none absolute inset-0 bg-black/0 transition-colors duration-300 group-hover:bg-black/25" />
        {/* shine sweep */}
        <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
          <div className="tols-card-shine absolute inset-y-[-20%] left-0 w-1/3" />
        </div>
        {/* top badges */}
        <div className="absolute top-2 right-2 left-2 flex items-start justify-between gap-1.5">
          <div className="flex min-w-0 flex-col items-start gap-1.5">
            {game.original ? (
              <span className="tols-pill tols-pill-original">
                <TolsT className="size-3" />
                TOLS
              </span>
            ) : game.live ? (
              <span className="tols-pill tols-pill-live">
                <span className="tols-live-dot size-1.5 rounded-full" />
                LIVE
              </span>
            ) : null}
          </div>
          <div className="flex shrink-0 flex-col items-end gap-1.5">
            {game.hot ? (
              <span className="tols-pill tols-pill-hot">
                <RiFireFill className="size-3" />
                HOT
              </span>
            ) : game.isNew ? (
              <span className="tols-pill tols-pill-new">
                <RiSparkling2Fill className="size-3" />
                NEW
              </span>
            ) : game.rtp != null ? (
              <span className="tols-pill tols-pill-rtp" title={`RTP ${formatRtp(game.rtp)}`}>
                {formatRtp(game.rtp)}
              </span>
            ) : null}
          </div>
        </div>
        {/* center play button */}
        <div className="tols-play-btn pointer-events-none absolute inset-0 grid place-items-center">
          <span className="grid size-14 scale-75 place-items-center rounded-full bg-lime text-black opacity-0 shadow-[0_0_32px_rgb(0_255_189/0.55)] transition-all duration-300 group-focus-visible:scale-100 group-focus-visible:opacity-100 group-hover:scale-100 group-hover:opacity-100">
            <RiPlayFill className="size-6 translate-x-[2px]" />
          </span>
        </div>
        {/* bottom info */}
        <div className="tols-game-card-wash pointer-events-none absolute inset-0" />
        <div className="absolute inset-x-0 bottom-0 p-3">
          <div className="flex items-end justify-between gap-2">
            <div className="min-w-0">
              <h3 className="font-bluescreens line-clamp-2 text-sm leading-snug font-semibold tracking-wide text-white uppercase">
                {game.title}
              </h3>
              <p className="mt-0.5 truncate text-[0.7rem] text-white/65">
                {game.provider}
                {game.live && game.players != null ? ` • ${formatPlayers(game.players)} playing` : ""}
              </p>
            </div>
            <TolsT className="size-6 shrink-0 opacity-90" />
          </div>
        </div>
        <span className="tols-game-card-bar absolute inset-x-0 bottom-0" />
      </div>
    </article>
  );
}

export function GameCardSkeleton() {
  return (
    <div className="overflow-hidden rounded-2xl border border-white/5 bg-[#16171b]" aria-hidden>
      <AspectRatio ratio={9 / 16} className="tols-card-shimmer" />
    </div>
  );
}
