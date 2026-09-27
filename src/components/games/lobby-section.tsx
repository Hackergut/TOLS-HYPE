import { useRef } from "react";
import { Link } from "@tanstack/react-router";
import { RiArrowLeftSLine, RiArrowRightLine, RiArrowRightSLine } from "@remixicon/react";
import { GameCard, GameCardSkeleton } from "@/components/games/game-card";
import { BluescreenTitle } from "@/components/brand/bluescreen-title";
import { TolsT } from "@/components/brand/tols-mark";
import type { CatalogGame, GameCategory } from "@/lib/games-catalog";

const TILE = "w-[148px] min-w-24 max-w-[150px] shrink-0 snap-start";

export function LobbySection({
  title,
  cat,
  games,
  loading = false,
  limit = 12,
}: {
  title: string;
  cat?: GameCategory | "all";
  games: CatalogGame[];
  loading?: boolean;
  limit?: number;
}) {
  const scroller = useRef<HTMLDivElement>(null);
  if (!loading && games.length === 0) return null;
  const row = games.slice(0, limit);

  const scrollByCards = (dir: -1 | 1) => {
    const el = scroller.current;
    if (!el) return;
    el.scrollBy({ left: dir * 164, behavior: "smooth" });
  };

  return (
    <section aria-label={title} className="relative flex flex-col gap-4">
      <div className="flex items-end gap-3">
        <BluescreenTitle as="h2" className="truncate text-lg font-bold tracking-tight md:text-xl">
          {title}
        </BluescreenTitle>
        <span className="pb-0.5 text-xs text-muted-foreground">{loading ? "\u2026" : `${games.length}`}</span>
        <div className="ml-auto flex shrink-0 items-center gap-1.5">
          <button
            type="button"
            className="hidden size-8 place-items-center rounded-full border border-border text-muted-foreground hover:border-lime/60 hover:text-lime md:grid"
            onClick={() => scrollByCards(-1)}
            aria-label={`Previous ${title}`}
          >
            <RiArrowLeftSLine className="size-4" />
          </button>
          <button
            type="button"
            className="hidden size-8 place-items-center rounded-full border border-border text-muted-foreground hover:border-lime/60 hover:text-lime md:grid"
            onClick={() => scrollByCards(1)}
            aria-label={`Next ${title}`}
          >
            <RiArrowRightSLine className="size-4" />
          </button>
          <Link
            to="/casino"
            search={cat && cat !== "all" ? { cat } : {}}
            className="inline-flex h-8 items-center gap-1 rounded-full border border-border px-3 text-xs font-semibold text-muted-foreground transition-colors hover:border-lime/60 hover:text-lime"
          >
            View all
            <RiArrowRightLine className="size-3.5" />
          </Link>
        </div>
      </div>
      <div className="relative">
        <div
          ref={scroller}
          className="no-scrollbar -mx-3 flex snap-x snap-mandatory gap-4 overflow-x-auto overflow-y-hidden scroll-smooth px-3 pt-1 pb-1 md:mx-0 md:px-0"
        >
          {loading && row.length === 0
            ? Array.from({ length: 8 }, (_, i) => (
                <div key={i} className={TILE}>
                  <GameCardSkeleton />
                </div>
              ))
            : row.map((game, i) => (
                <div key={game.id} className={TILE}>
                  <GameCard game={game} priority={i < 4} />
                </div>
              ))}
          <Link
            to="/casino"
            search={cat && cat !== "all" ? { cat } : {}}
            className={`${TILE} relative overflow-hidden rounded-md border border-purple/50 bg-uva`}
          >
            <span className="relative block w-full pb-[140%]">
              <span className="absolute inset-0 flex flex-col justify-between p-2">
                <span className="flex justify-end text-[12px] leading-[18px] font-semibold text-white">View all</span>
                <span className="grid place-items-center">
                  <TolsT className="size-10" />
                </span>
                <span className="h-4" />
              </span>
            </span>
          </Link>
        </div>
      </div>
    </section>
  );
}
