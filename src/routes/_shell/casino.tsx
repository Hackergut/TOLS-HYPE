import { useMemo } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { GameGrid } from "@/components/games/game-grid";
import { TolsBreadcrumb } from "@/components/layout/tols-breadcrumb";
import { CATEGORIES, ORIGINALS, type GameCategory } from "@/lib/games-catalog";
import { workingByCategory } from "@/lib/operator/working-games";

const CATS = new Set(["all", "originals", "slots", "table", "live", "crash"]);

export const Route = createFileRoute("/_shell/casino")({
  validateSearch: (search: Record<string, unknown>): { cat: GameCategory | "all" } => ({
    cat: CATS.has(String(search.cat)) ? (search.cat as GameCategory | "all") : "all",
  }),
  component: CasinoPage,
});

function CasinoPage() {
  const { cat, navigate } = Route.useSearch();
  const setCat = (next: GameCategory | "all") => {
    void navigate({ search: { cat: next } });
  };
  const games = useMemo(() => {
    if (cat === "originals") return ORIGINALS.filter((g) => g.original);
    if (cat === "table") return ORIGINALS.filter((g) => g.category === "table");
    if (cat === "crash") return ORIGINALS.filter((g) => g.category === "crash");
    const originals =
      cat === "all" ? ORIGINALS.filter((g) => g.original) : ORIGINALS.filter((g) => g.original && g.category === cat);
    return [...originals, ...workingByCategory(cat)];
  }, [cat]);

  return (
    <main className="mx-auto flex w-full max-w-6xl flex-col gap-6">
      <TolsBreadcrumb items={[{ label: "Lobby", to: "/" }, { label: "Casino" }]} />
      <header>
        <h1 className="font-bluescreens text-2xl font-bold tracking-wide uppercase md:text-3xl">Casino</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          TOLS originals plus verified slots and live tables that launch on Flexrix.
        </p>
      </header>
      <div className="no-scrollbar -mx-3 flex gap-2 overflow-x-auto px-3 md:mx-0 md:flex-wrap md:overflow-visible md:px-0">
        {CATEGORIES.map((c) => (
          <Button
            key={c.id}
            variant={cat === c.id ? "default" : "outline"}
            className="h-10 shrink-0 rounded-full px-4"
            onClick={() => setCat(c.id)}
          >
            {c.label}
          </Button>
        ))}
      </div>
      <GameGrid games={games} />
    </main>
  );
}
