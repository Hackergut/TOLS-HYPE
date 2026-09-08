import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { GameGrid } from "@/components/games/game-grid";
import { TolsBreadcrumb } from "@/components/layout/tols-breadcrumb";
import { CATEGORIES, gamesByCategory, type GameCategory } from "@/lib/games-catalog";

export const Route = createFileRoute("/_shell/casino")({ component: CasinoPage });

function CasinoPage() {
  const [cat, setCat] = useState<GameCategory | "all">("all");
  return (
    <main className="mx-auto flex w-full max-w-6xl flex-col gap-6">
      <TolsBreadcrumb items={[{ label: "Lobby", to: "/" }, { label: "Casino" }]} />
      <header>
        <h1 className="font-heading text-2xl font-bold tracking-tight md:text-3xl">Casino</h1>
        <p className="mt-1 text-sm text-muted-foreground">Originals, tables, live, and slots.</p>
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
      <GameGrid games={gamesByCategory(cat)} />
    </main>
  );
}
