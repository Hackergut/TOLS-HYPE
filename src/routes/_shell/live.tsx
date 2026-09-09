import { createFileRoute } from "@tanstack/react-router";
import { GameGrid } from "@/components/games/game-grid";
import { TolsBreadcrumb } from "@/components/layout/tols-breadcrumb";
import { workingByCategory } from "@/lib/operator/working-games";

export const Route = createFileRoute("/_shell/live")({ component: LivePage });

function LivePage() {
  return (
    <main className="mx-auto flex w-full max-w-6xl flex-col gap-6">
      <TolsBreadcrumb items={[{ label: "Lobby", to: "/" }, { label: "Live" }]} />
      <header>
        <h1 className="font-heading text-3xl font-semibold tracking-tight">Live casino</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Flagship Evolution and Pragmatic Live tables. No demo — sign in, then real launch.
        </p>
      </header>
      <GameGrid games={workingByCategory("live")} />
    </main>
  );
}
