import { createFileRoute } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { GameGrid } from "@/components/games/game-grid";
import { TolsBreadcrumb } from "@/components/layout/tols-breadcrumb";
import { BluescreenTitle } from "@/components/brand/bluescreen-title";
import { CATEGORIES, GAMES, gamesByCategory, type CatalogGame, type GameCategory } from "@/lib/games-catalog";
import { useRemoteCatalog } from "@/hooks/use-remote-catalog";

const CATS = CATEGORIES.map((c) => c.id);

function parseCat(value: unknown): GameCategory | "all" | undefined {
  if (typeof value !== "string") return undefined;
  return (CATS as string[]).includes(value) ? (value as GameCategory | "all") : undefined;
}

export const Route = createFileRoute("/_shell/casino")({
  component: CasinoPage,
  validateSearch: (search: Record<string, unknown>): { cat?: GameCategory | "all" } => {
    const cat = parseCat(search.cat);
    return cat ? { cat } : {};
  },
});

function merge(cat: GameCategory | "all", remote: CatalogGame[]): CatalogGame[] {
  const local = cat === "all" ? GAMES : gamesByCategory(cat);
  const studio =
    cat === "all"
      ? remote
      : cat === "originals"
        ? []
        : remote.filter((g) => (cat === "live" ? g.live : g.category === cat));
  const seen = new Set(local.map((g) => g.id));
  return [...local, ...studio.filter((g) => !seen.has(g.id))];
}

function CasinoPage() {
  const { cat: catParam } = Route.useSearch();
  const cat = catParam ?? "all";
  const navigate = Route.useNavigate();
  const { games: remote, ready } = useRemoteCatalog();
  return (
    <main className="mx-auto flex w-full max-w-6xl flex-col gap-6">
      <TolsBreadcrumb items={[{ label: "Lobby", to: "/" }, { label: "Casino" }]} />
      <header>
        <BluescreenTitle as="h1" className="text-2xl font-bold tracking-tight md:text-3xl">
          Casino
        </BluescreenTitle>
        <p className="mt-1 text-sm text-muted-foreground">Originals, Flexrix studio, live, and slots.</p>
      </header>
      <div className="no-scrollbar -mx-3 flex gap-2 overflow-x-auto px-3 md:mx-0 md:flex-wrap md:overflow-visible md:px-0">
        {CATEGORIES.map((c) => (
          <Button
            key={c.id}
            variant={cat === c.id ? "default" : "outline"}
            className="h-10 shrink-0 rounded-full px-4"
            onClick={() => navigate({ search: { cat: c.id } })}
          >
            {c.label}
          </Button>
        ))}
      </div>
      <GameGrid games={merge(cat, remote)} loading={!ready && remote.length === 0} />
    </main>
  );
}
