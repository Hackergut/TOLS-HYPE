import { createFileRoute } from "@tanstack/react-router";
import { GameGrid } from "@/components/games/game-grid";
import { TolsBreadcrumb } from "@/components/layout/tols-breadcrumb";
import { BluescreenTitle } from "@/components/brand/bluescreen-title";
import { ORIGINALS, isHouseOriginal } from "@/lib/games-catalog";

export const Route = createFileRoute("/_shell/originals")({
  component: OriginalsLobby,
});

function OriginalsLobby() {
  const games = ORIGINALS.filter(isHouseOriginal);
  return (
    <main className="mx-auto flex w-full max-w-6xl flex-col gap-6">
      <TolsBreadcrumb items={[{ label: "Lobby", to: "/" }, { label: "Originals" }]} />
      <header>
        <BluescreenTitle as="h1" className="text-2xl font-bold tracking-tight md:text-3xl">
          TOLS Originals
        </BluescreenTitle>
        <p className="mt-1 text-sm text-muted-foreground">
          House games on this UI. Provably fair. Not studio iframes.
        </p>
      </header>
      <GameGrid games={games} />
    </main>
  );
}
