import { Link } from "@tanstack/react-router";
import { RiArrowRightLine } from "@remixicon/react";
import { GameCard, GameCardSkeleton } from "@/components/games/game-card";
import { BluescreenTitle } from "@/components/brand/bluescreen-title";
import type { CatalogGame } from "@/lib/games-catalog";

export function LobbySection({
  title,
  href,
  games,
  loading = false,
  limit = 12,
}: {
  title: string;
  href?: string;
  games: CatalogGame[];
  loading?: boolean;
  limit?: number;
}) {
  if (!loading && games.length === 0) return null;
  const row = games.slice(0, limit);
  return (
    <section aria-label={title} className="flex flex-col gap-3">
      <div className="flex items-end gap-3">
        <BluescreenTitle as="h2" className="truncate text-lg font-bold tracking-tight md:text-xl">
          {title}
        </BluescreenTitle>
        <span className="pb-0.5 text-xs text-muted-foreground">
          {loading ? "…" : `${games.length}`}
        </span>
        {href ? (
          <Link
            to={href}
            className="ml-auto inline-flex h-8 shrink-0 items-center gap-1 rounded-full border border-border px-3 text-xs font-semibold text-muted-foreground transition-colors hover:border-lime/60 hover:text-lime"
          >
            View all
            <RiArrowRightLine className="size-3.5" />
          </Link>
        ) : null}
      </div>
      <div className="no-scrollbar -mx-3 flex snap-x gap-2 overflow-x-auto px-3 pb-1 md:mx-0 md:gap-3 md:px-0">
        {loading && row.length === 0
          ? Array.from({ length: 8 }, (_, i) => (
              <div key={i} className="w-36 shrink-0 sm:w-40 md:w-44">
                <GameCardSkeleton />
              </div>
            ))
          : row.map((game, i) => (
              <div key={game.id} className="w-36 shrink-0 snap-start sm:w-40 md:w-44">
                <GameCard game={game} priority={i < 4} />
              </div>
            ))}
      </div>
    </section>
  );
}
