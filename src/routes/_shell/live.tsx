import { createFileRoute } from "@tanstack/react-router";
import { GameGrid } from "@/components/games/game-grid";
import { TolsBreadcrumb } from "@/components/layout/tols-breadcrumb";
import { BluescreenTitle } from "@/components/brand/bluescreen-title";
import { GAMES } from "@/lib/games-catalog";
import { useRemoteCatalog } from "@/hooks/use-remote-catalog";

export const Route = createFileRoute("/_shell/live")({ component: LivePage });

function LivePage() {
  const { games: remote, ready } = useRemoteCatalog();
  const local = GAMES.filter((g) => g.live);
  const studio = remote.filter((g) => g.live);
  const seen = new Set(local.map((g) => g.id));
  return (
    <main className="mx-auto flex w-full max-w-6xl flex-col gap-6">
      <TolsBreadcrumb items={[{ label: "Lobby", to: "/" }, { label: "Live" }]} />
      <header>
        <BluescreenTitle as="h1" className="text-3xl font-semibold tracking-tight">
          Live casino
        </BluescreenTitle>
        <p className="mt-1 text-sm text-muted-foreground">
          Evolution and studio tables from the live Flexrix hub, plus TOLS originals.
        </p>
      </header>
      <GameGrid games={[...local, ...studio.filter((g) => !seen.has(g.id))]} loading={!ready && studio.length === 0} />
    </main>
  );
}
