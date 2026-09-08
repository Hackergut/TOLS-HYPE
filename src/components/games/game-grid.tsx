import { GameCard } from "@/components/games/game-card";
import type { CatalogGame } from "@/lib/games-catalog";

export function GameGrid({ games }: { games: CatalogGame[] }) {
  if (games.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">No tables in this category yet.</p>
    );
  }
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
      {games.map((game) => (
        <GameCard key={game.id} game={game} />
      ))}
    </div>
  );
}
