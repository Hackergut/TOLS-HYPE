import { useRef, useState } from "react";
import { Link } from "@tanstack/react-router";
import { RiArrowRightLine, RiArrowRightSLine } from "@remixicon/react";
import { GameCard, GameCardSkeleton } from "@/components/games/game-card";
import { BluescreenTitle } from "@/components/brand/bluescreen-title";
import { TolsT } from "@/components/brand/tols-mark";
import type { CatalogGame, GameCategory } from "@/lib/games-catalog";

/** Zip game-strip: clamp(112px, 13vw, 174px) · snap-start · 256:359 via GameCard. */
const TILE = "w-[clamp(112px,13vw,174px)] shrink-0 snap-start";

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
  const [canRight, setCanRight] = useState(true);
  if (!loading && games.length === 0) return null;
  const row = games.slice(0, limit);

  const update = () => {
    const el = scroller.current;
    if (!el) return;
    setCanRight(el.scrollLeft + el.clientWidth < el.scrollWidth - 8);
  };

  const scrollNext = () => {
    const el = scroller.current;
    if (!el) return;
    el.scrollBy({ left: el.clientWidth * 0.8, behavior: "smooth" });
  };

  return (
    <section aria-label={title} className="relative flex flex-col gap-4">
      <div className="flex min-h-12 items-end gap-3">
        <BluescreenTitle as="h2" className="truncate text-lg font-bold tracking-tight md:text-xl">
          {title}
        </BluescreenTitle>
        <span className="pb-0.5 text-xs text-muted-foreground">{loading ? "\u2026" : `${games.length}`}</span>
        <Link
          to="/casino"
          search={cat && cat !== "all" ? { cat } : {}}
          className="ml-auto inline-flex h-8 items-center gap-1 rounded-full border border-border px-3 text-xs font-semibold text-muted-foreground transition-colors hover:border-lime/60 hover:text-lime"
        >
          View all
          <RiArrowRightLine className="size-3.5" />
        </Link>
      </div>
      <div className="game-strip relative overflow-hidden">
        <div
          ref={scroller}
          onScroll={update}
          className="no-scrollbar flex snap-x snap-mandatory gap-3.5 overflow-x-auto overflow-y-hidden scroll-smooth pt-1 pb-3"
          role="region"
          aria-label={`${title} carousel`}
        >
          {loading && row.length === 0
            ? Array.from({ length: 8 }, (_, i) => (
                <div key={i} className={TILE}>
                  <GameCardSkeleton />
                </div>
              ))
            : row.map((game, i) => (
                <div key={game.id} className={`${TILE} transition-transform duration-180 hover:-translate-y-0.5`}>
                  <GameCard game={game} priority={i < 4} />
                </div>
              ))}
          <Link
            to="/casino"
            search={cat && cat !== "all" ? { cat } : {}}
            className={`${TILE} relative overflow-hidden rounded-2xl border border-purple/50 bg-uva`}
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
        <button
          type="button"
          aria-label={`Scroll ${title}`}
          disabled={!canRight}
          onClick={scrollNext}
          className="absolute top-0 right-0 z-2 hidden h-[calc(100%-8px)] w-[76px] items-center justify-end bg-linear-to-l from-[#0d0d10] to-transparent pr-1 pb-6 disabled:pointer-events-none disabled:opacity-0 md:flex"
        >
          <span className="grid size-[38px] place-items-center rounded-full border border-white/12 bg-[#16171b]/90 text-white">
            <RiArrowRightSLine className="size-5" />
          </span>
        </button>
      </div>
    </section>
  );
}
