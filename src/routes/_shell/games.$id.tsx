import { createFileRoute, Link } from "@tanstack/react-router";
import { BlackjackGame } from "@/components/games/blackjack-game";
import { CrashGame } from "@/components/games/crash-game";
import { DiceGame } from "@/components/games/dice-game";
import { GameGrid } from "@/components/games/game-grid";
import { HiloGame } from "@/components/games/hilo-game";
import { KenoGame } from "@/components/games/keno-game";
import { MinesGame } from "@/components/games/mines-game";
import { RouletteGame } from "@/components/games/roulette-game";
import { SlotsGame } from "@/components/games/slots-game";
import { PoolGame } from "@/components/games/pool-game";
import { AggregatorFrame } from "@/components/games/aggregator-frame";
import { GameLegend } from "@/components/games/game-legend";
import { LiveFeed } from "@/components/games/live-feed";
import { GameTableProvider } from "@/components/games/game-table";
import { TolsBreadcrumb } from "@/components/layout/tols-breadcrumb";
import { GAMES, getGame } from "@/lib/games-catalog";
import { getWorkingGame, WORKING_GAMES } from "@/lib/operator/working-games";

export const Route = createFileRoute("/_shell/games/$id")({
  component: GamePage,
});

function GamePage() {
  const { id } = Route.useParams();
  const game = getGame(id) ?? getWorkingGame(id);
  if (!game) {
    return (
      <main className="mx-auto max-w-lg py-16 text-center">
        <h1 className="font-heading text-2xl font-semibold">Table closed</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          That title is not in the verified Flexrix waves yet.
        </p>
        <Link to="/casino" className="mt-4 inline-block text-sm text-primary">
          Return to casino
        </Link>
      </main>
    );
  }

  const more = [...GAMES.filter((g) => g.id !== game.id), ...WORKING_GAMES.filter((g) => g.id !== game.id)].slice(0, 6);

  return (
    <main className="mx-auto flex w-full max-w-6xl flex-col gap-8">
      <TolsBreadcrumb
        items={[
          { label: "Lobby", to: "/" },
          { label: "Casino", to: "/casino" },
          { label: game.title },
        ]}
      />
      <GameTableProvider gameId={game.id}>
        <GameSwitch kind={game.kind} id={game.id} />
        <LiveFeed gameId={game.id} />
      </GameTableProvider>
      <GameLegend game={game} />
      <section>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="font-heading text-lg font-bold">More from TOLS</h2>
          <Link to="/casino" className="text-xs text-muted-foreground hover:text-foreground">
            View all
          </Link>
        </div>
        <GameGrid games={more} />
      </section>
    </main>
  );
}

function GameSwitch({ kind, id }: { kind: string; id: string }) {
  switch (kind) {
    case "crash":
      return <CrashGame gameId={id} />;
    case "roulette":
      return <RouletteGame gameId={id} />;
    case "blackjack":
      return <BlackjackGame gameId={id} />;
    case "slots":
      return <SlotsGame gameId={id} />;
    case "dice":
      return <DiceGame gameId={id} />;
    case "mines":
      return <MinesGame gameId={id} />;
    case "keno":
      return <KenoGame gameId={id} />;
    case "hilo":
      return <HiloGame gameId={id} />;
    case "pool":
      return <PoolGame gameId={id} />;
    case "iframe":
      return <AggregatorFrame gameId={id} />;
    default:
      return <AggregatorFrame gameId={id} />;
  }
}
