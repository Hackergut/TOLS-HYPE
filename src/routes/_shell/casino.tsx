import { useMemo } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { GameGrid } from "@/components/games/game-grid";
import { ProviderShelf } from "@/components/games/provider-shelf";
import { ProviderStrip } from "@/components/games/provider-strip";
import { TolsBreadcrumb } from "@/components/layout/tols-breadcrumb";
import { BluescreenTitle } from "@/components/brand/bluescreen-title";
import { CATEGORIES, GAMES, gamesByCategory, type CatalogGame, type GameCategory } from "@/lib/games-catalog";
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
  const { cat: catParam, provider: providerParam } = Route.useSearch();
  const cat = catParam ?? "all";
  const navigate = Route.useNavigate();
  const { games: remote, ready } = useRemoteCatalog();
  const providers = useMemo(() => groupByProvider(remote), [remote]);
  const selected = providers.find((p) => p.slug === providerParam) ?? null;
  const setProvider = (slug: string | null) =>
    navigate({ search: (prev) => ({ ...prev, provider: slug ?? undefined }) });
  const gridGames = useMemo(() => {
    const merged = merge(cat, remote);
    if (!selected) return merged;
    const ids = new Set(selected.games.map((g) => g.id));
    return merged.filter((g) => ids.has(g.id));
  }, [cat, remote, selected]);
  const showShelves = cat === "all" && !selected;
  const originals = useMemo(() => GAMES.filter((g) => g.original), []);
  const loading = !ready && remote.length === 0;

  return (
    <main className="mx-auto flex w-full max-w-6xl flex-col gap-6">
      <TolsBreadcrumb items={[{ label: "Lobby", to: "/" }, { label: "Casino" }]} />
      <header>
        <BluescreenTitle as="h1" className="text-2xl font-bold tracking-tight md:text-3xl">
          Casino
        </BluescreenTitle>
        <p className="mt-1 text-sm text-muted-foreground">
          Originals, studio providers, live tables, and slots.
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
        <>
          <section>
            <BluescreenTitle as="h2" className="mb-4 text-lg font-bold md:text-xl">
              Originals
            </BluescreenTitle>
            <GameGrid games={originals} />
          </section>
          {loading ? (
            <GameGrid games={[]} loading />
          ) : (
            providers.map((group) => <ProviderShelf key={group.slug} group={group} limit={10} />)
          )}
        </>
      ) : (
        <GameGrid games={gridGames} loading={loading && gridGames.length === 0} />
      )}
    </main>
  );
}
