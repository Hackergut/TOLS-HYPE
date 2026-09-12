import { useEffect, useRef, useState } from "react";
import { Link } from "@tanstack/react-router";
import { RiDiceLine } from "@remixicon/react";
import { GameCard } from "@/components/games/game-card";
import { Button } from "@/components/ui/button";
import { Empty, EmptyContent, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "@/components/ui/empty";
import { Skeleton } from "@/components/ui/skeleton";
import type { CatalogGame } from "@/lib/games-catalog";

const STEP_NARROW = 24;
const STEP_WIDE = 48;

export function GameGrid({ games, loading = false }: { games: CatalogGame[]; loading?: boolean }) {
  const [shown, setShown] = useState(STEP_NARROW);
  const more = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const wide = window.matchMedia("(min-width: 768px)").matches;
    setShown(wide ? STEP_WIDE : STEP_NARROW);
  }, [games]);

  useEffect(() => {
    const el = more.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([entry]) => {
        if (!entry?.isIntersecting) return;
        setShown((n) => Math.min(games.length, n + (window.matchMedia("(min-width: 768px)").matches ? STEP_WIDE : STEP_NARROW)));
      },
      { rootMargin: "800px 0px" },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [games.length, shown]);

  if (loading && games.length === 0) {
    return (
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 sm:gap-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
        {Array.from({ length: 8 }).map((_, i) => (
          <Skeleton key={i} className="aspect-9/16 rounded-2xl" />
        ))}
      </div>
    );
  }
  if (games.length === 0) {
    return (
      <Empty className="border border-dashed border-border py-12">
        <EmptyHeader>
          <EmptyMedia variant="icon">
            <RiDiceLine />
          </EmptyMedia>
          <EmptyTitle>No tables in this category</EmptyTitle>
          <EmptyDescription>Try Originals, Slots, or Live — or search from the header.</EmptyDescription>
        </EmptyHeader>
        <EmptyContent>
          <Button asChild className="h-10">
            <Link to="/">Back to lobby</Link>
          </Button>
        </EmptyContent>
      </Empty>
    );
  }

  const slice = games.slice(0, shown);

  return (
    <div>
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 sm:gap-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
        {slice.map((game, i) => (
          <GameCard key={game.id} game={game} priority={i < 6} />
        ))}
      </div>
      {shown < games.length ? <div ref={more} className="h-8" aria-hidden /> : null}
    </div>
  );
}
