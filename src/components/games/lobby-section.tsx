import { useEffect, useRef, useState } from "react";
import { Link } from "@tanstack/react-router";
import { RiArrowRightLine, RiArrowRightSLine } from "@remixicon/react";
import { GameCard, GameCardSkeleton } from "@/components/games/game-card";
import { BluescreenTitle } from "@/components/brand/bluescreen-title";
import { TolsT } from "@/components/brand/tols-mark";
import type { CatalogGame, GameCategory } from "@/lib/games-catalog";

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
  const [canRight, setCanRight] = useState(false);
  const row = games.slice(0, limit);
  const search = cat && cat !== "all" ? { cat } : {};

  const update = () => {
    const el = scroller.current;
    if (!el) return;
    setCanRight(el.scrollLeft + el.clientWidth < el.scrollWidth - 8);
  };

  useEffect(() => {
    update();
    const el = scroller.current;
    if (!el) return;
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, [row.length, loading]);

  if (!loading && games.length === 0) return null;

  const count = (loading && row.length === 0 ? 8 : row.length) + 1;
  const shelfCount = Math.max(1, Math.ceil(count / 2));

  const scrollNext = () => {
    const el = scroller.current;
    if (!el) return;
    el.scrollBy({ left: el.clientWidth * 0.86, behavior: "smooth" });
  };

  return (
    <section aria-label={title} className="tols-shelf">
      <div className="flex items-end gap-3">
        <BluescreenTitle as="h2" className="truncate text-base font-bold tracking-tight md:text-xl">
          {title}
        </BluescreenTitle>
        <span className="pb-0.5 text-xs text-muted-foreground">{loading ? "\u2026" : `${games.length}`}</span>
        <Link
          to="/casino"
          search={search}
          className="ml-auto inline-flex h-8 items-center gap-1 rounded-full border border-border px-3 text-xs font-semibold text-muted-foreground transition-colors hover:border-lime/60 hover:text-lime"
        >
          View all
          <RiArrowRightLine className="size-3.5" />
        </Link>
      </div>
      <div className="relative min-w-0">
        <div
          ref={scroller}
          onScroll={update}
          className="tols-shelf-scroll no-scrollbar"
          role="region"
          aria-label={`${title} grid`}
        >
          <div className="tols-shelf-grid" style={{ ["--shelf-count" as string]: String(shelfCount) }}>
          {loading && row.length === 0
            ? Array.from({ length: 8 }, (_, i) => <GameCardSkeleton key={i} />)
            : row.map((game, i) => <GameCard key={game.id} game={game} priority={i < 6} />)}
          <Link
            to="/casino"
            search={search}
            className="relative block min-w-0 overflow-hidden rounded-2xl border border-purple/50 bg-uva"
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
        <button
          type="button"
          aria-label={`Scroll ${title}`}
          disabled={!canRight}
          onClick={scrollNext}
          className="absolute inset-y-0 right-0 z-2 hidden w-16 items-center justify-end bg-linear-to-l from-[#0d0d10] to-transparent pr-1 disabled:pointer-events-none disabled:opacity-0 md:flex"
        >
          <span className="grid size-[38px] place-items-center rounded-full border border-white/12 bg-[#16171b]/90 text-white">
            <RiArrowRightSLine className="size-5" />
          </span>
        </button>
      </div>
    </section>
  );
}
