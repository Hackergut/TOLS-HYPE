import { useMemo } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { GameGrid } from "@/components/games/game-grid";
import { ProviderStrip } from "@/components/games/provider-strip";
import { TolsBreadcrumb } from "@/components/layout/tols-breadcrumb";
import { BluescreenTitle } from "@/components/brand/bluescreen-title";
import { CATEGORIES, GAMES, type CatalogGame, type GameCategory } from "@/lib/games-catalog";
import { groupByProvider } from "@/lib/providers";
import { useRemoteCatalog } from "@/hooks/use-remote-catalog";

const CATS = CATEGORIES.map((c) => c.id);

function parseCat(value: unknown): GameCategory | "all" | undefined {
  if (typeof value !== "string") return undefined;
  return (CATS as string[]).includes(value) ? (value as GameCategory | "all") : undefined;
}

export const Route = createFileRoute("/_shell/casino")({
  component: CasinoPage,
  validateSearch: (search: Record<string, unknown>): { cat?: GameCategory | "all"; provider?: string } => ({
    ...(parseCat(search.cat) ? { cat: parseCat(search.cat) as GameCategory | "all" } : {}),
    ...(typeof search.provider === "string" && search.provider ? { provider: search.provider } : {}),
  }),
});

function ofCategory(cat: GameCategory, remote: CatalogGame[]): CatalogGame[] {
  const local = GAMES.filter((g) => g.category === cat);
  const studio = remote.filter((g) => g.category === cat);
  const seen = new Set(local.map((g) => g.id));
  return [...local, ...studio.filter((g) => !seen.has(g.id))];
}

function CasinoPage() {
  const { cat: catParam, provider: providerParam } = Route.useSearch();
  const cat = catParam ?? "all";
  const navigate = Route.useNavigate();
  const { games: remote, ready } = useRemoteCatalog();
  const providers = useMemo(() => groupByProvider(remote), [remote]);
  const selected = providers.find((p) => p.slug === providerParam) ?? null;
  const setProvider = (slug: string | null) =>
    navigate({ search: (prev) => ({ ...prev, provider: slug ?? undefined }) });
  const gridGames = useMemo(() => {
    const merged = cat === "all" ? [...GAMES, ...remote.filter((g) => !GAMES.some((local) => local.id === g.id))] : ofCategory(cat, remote);
    if (!selected) return merged;
    const ids = new Set(selected.games.map((g) => g.id));
    return merged.filter((g) => ids.has(g.id));
  }, [cat, remote, selected]);
  const sections = useMemo(
    () =>
      CATEGORIES.filter((c) => c.id !== "all").map((c) => ({
        ...c,
        id: c.id as GameCategory,
        games: ofCategory(c.id as GameCategory, remote),
      })),
    [remote],
  );
  const showShelves = cat === "all" && !selected;
  const loading = !ready && remote.length === 0;

  return (
    <main className="mx-auto flex w-full max-w-6xl flex-col gap-6">
      <TolsBreadcrumb items={[{ label: "Lobby", to: "/" }, { label: "Casino" }]} />
      <header>
        <BluescreenTitle as="h1" className="text-2xl font-bold tracking-tight md:text-3xl">
          Casino
        </BluescreenTitle>
        <p className="mt-1 text-sm text-muted-foreground">
          Originals first, then premium studios and the full Flexrix lobby.
          {ready && providers.length > 0 ? ` ${providers.length} providers live.` : ""}
        </p>
      </header>
      <div className="no-scrollbar -mx-3 flex gap-2 overflow-x-auto px-3 md:mx-0 md:flex-wrap md:overflow-visible md:px-0">
        {CATEGORIES.map((c) => (
          <Button
            key={c.id}
            variant={cat === c.id ? "default" : "outline"}
            className="h-10 shrink-0 rounded-full px-4"
            onClick={() => navigate({ search: (prev) => ({ ...prev, cat: c.id }) })}
          >
            {c.label}
          </Button>
        ))}
      </div>
      <ProviderStrip providers={providers} selected={selected?.slug ?? null} onSelect={setProvider} />
      {showShelves ? (
        sections.map((section) =>
          section.games.length === 0 ? null : (
            <section key={section.id}>
              <BluescreenTitle as="h2" className="mb-4 text-lg font-bold md:text-xl">
                {section.label}
              </BluescreenTitle>
              <GameGrid games={section.games} />
            </section>
          ),
        )
      ) : (
        <GameGrid games={gridGames} loading={loading && gridGames.length === 0} />
      )}
    </main>
  );
}
