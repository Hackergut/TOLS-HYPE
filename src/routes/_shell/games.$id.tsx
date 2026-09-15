import { createFileRoute, Link, redirect } from "@tanstack/react-router";
import { BlackjackGame } from "@/components/games/blackjack-game";
import { CrashGame } from "@/components/games/crash-game";
import { DiceGame } from "@/components/games/dice-game";
import { GameGrid } from "@/components/games/game-grid";
import { HiloGame } from "@/components/games/hilo-game";
import { KenoGame } from "@/components/games/keno-game";
import { MinesGame } from "@/components/games/mines-game";
import { RouletteGame } from "@/components/games/roulette-game";
import { SlotsGame } from "@/components/games/slots-game";
import { CrazyTolsGame } from "@/components/games/crazy-tols-game";
import { PoolGame } from "@/components/games/pool-game";
import { LimboGame } from "@/components/games/limbo-game";
import { PlinkoGame } from "@/components/games/plinko-game";
import { TowerGame } from "@/components/games/tower-game";
import { AggregatorFrame } from "@/components/games/aggregator-frame";
import { GameLegend } from "@/components/games/game-legend";
import { LiveFeed } from "@/components/games/live-feed";
import { GameTableProvider } from "@/components/games/game-table";
import { GuestGamePanel, useGamePreviewOptional } from "@/components/games/guest-game-preview";
import { TolsBreadcrumb } from "@/components/layout/tols-breadcrumb";
import { GAMES, canonicalGameId, getGame } from "@/lib/games-catalog";
import { useRemoteCatalog } from "@/hooks/use-remote-catalog";

export const Route = createFileRoute("/_shell/games/$id")({
  beforeLoad: ({ params }) => {
    const canon = canonicalGameId(params.id);
    if (canon !== params.id) {
      throw redirect({ to: "/games/$id", params: { id: canon } });
    }
  },
  component: GamePage,
});

function GamePage() {
  const { id } = Route.useParams();
  const { games: remote } = useRemoteCatalog();
  const game = getGame(id) ?? remote.find((g) => g.id === id);
  const preview = useGamePreviewOptional();
  const more = GAMES.filter((g) => g.id !== id).slice(0, 6);

  if (game && preview?.isGuest) {
    return (
      <main className="mx-auto flex w-full max-w-3xl flex-col gap-6">
        <TolsBreadcrumb
          items={[
            { label: "Lobby", to: "/" },
            { label: "Casino", to: "/casino" },
            { label: game.title },
          ]}
        />
        <div className="overflow-hidden rounded-2xl bg-card ring-1 ring-border">
          <GuestGamePanel game={game} />
        </div>
      </main>
    );
  }

  if (!game) {
    return (
      <main className="mx-auto flex w-full max-w-6xl flex-col gap-8">
        <TolsBreadcrumb
          items={[
            { label: "Lobby", to: "/" },
            { label: "Casino", to: "/casino" },
            { label: id },
          ]}
        />
        {preview?.isGuest ? (
          <div className="rounded-2xl bg-card p-6 text-sm text-muted-foreground ring-1 ring-border">
            Sign in to launch this studio table.
          </div>
        ) : (
          <GameTableProvider gameId={id}>
            <AggregatorFrame gameId={id} />
            <LiveFeed gameId={id} />
          </GameTableProvider>
        )}
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
    case "limbo":
      return <LimboGame gameId={id} />;
    case "crazy":
      return <CrazyTolsGame gameId={id} />;
    case "plinko":
      return <PlinkoGame gameId={id} />;
    case "tower":
      return <TowerGame gameId={id} />;
    case "iframe":
      return <AggregatorFrame gameId={id} />;
    default:
      return <AggregatorFrame gameId={id} />;
  }
}