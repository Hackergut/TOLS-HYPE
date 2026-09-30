import { Link } from "@tanstack/react-router";
import { RiArrowRightLine } from "@remixicon/react";
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
  const row = games.slice(0, limit);
  const search = cat && cat !== "all" ? { cat } : {};

  if (!loading && games.length === 0) return null;

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
      <div className="tols-shelf-scroll">
        <div className="tols-shelf-grid" role="region" aria-label={`${title} grid`}>
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
    </section>
  );
}