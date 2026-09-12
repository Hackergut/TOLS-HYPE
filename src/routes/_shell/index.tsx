import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Hero } from "@/components/home/hero";
import { PromoBanner } from "@/components/home/promo-banner";
import { GameGrid } from "@/components/games/game-grid";
import { Button } from "@/components/ui/button";
import { BluescreenTitle } from "@/components/brand/bluescreen-title";
import { CATEGORIES, GAMES, gamesByCategory, type GameCategory } from "@/lib/games-catalog";
import { useRemoteCatalog } from "@/hooks/use-remote-catalog";

const TITLE = "TOLS — Originals casino | Crash, Dice, Roulette, Blackjack";
const DESC =
  "TOLS originals casino. Play crash, dice, roulette, blackjack, mines, keno, pool rush and neon sevens. 18+ play-money tables, provably fair.";
const OG = "/brand/promo/hero-main.jpg";

export const Route = createFileRoute("/_shell/")({
  component: Home,
  head: () => ({
    meta: [
      { title: TITLE },
      { name: "description", content: DESC },
      { name: "robots", content: "index,follow" },
      { property: "og:type", content: "website" },
      { property: "og:title", content: TITLE },
      { property: "og:description", content: DESC },
      { property: "og:image", content: OG },
      { property: "og:image:alt", content: "TOLS lime chip with official T among dark silicone cards" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:title", content: TITLE },
      { name: "twitter:description", content: DESC },
      { name: "twitter:image", content: OG },
    ],
    links: [{ rel: "canonical", href: "/" }],
  }),
});

function Home() {
  const [cat, setCat] = useState<GameCategory | "all">("all");
  const { games: studio, ready, flexrix } = useRemoteCatalog();
  const originals = GAMES.filter((g) => g.original);
  const local = cat === "all" ? originals : gamesByCategory(cat);
  const remote =
    cat === "all"
      ? studio.filter((g) => !g.live)
      : cat === "originals"
        ? []
        : studio.filter((g) => (cat === "live" ? g.live : g.category === cat));
  const slots = studio.filter((g) => !g.live && g.category === "slots");
  const live = studio.filter((g) => g.live);
  const hubDown = Boolean(flexrix.error) && studio.length === 0;

  return (
    <main className="mx-auto flex w-full max-w-6xl flex-col gap-6 md:gap-8">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "WebSite",
            name: "TOLS",
            description: DESC,
            url: "/",
            image: OG,
            potentialAction: {
              "@type": "SearchAction",
              target: "/casino",
              query: "casino originals",
            },
          }),
        }}
      />
      <Hero />
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
      <PromoBanner />
      {cat !== "slots" && cat !== "live" ? (
        <section>
          <BluescreenTitle as="h2" className="mb-4 text-lg font-bold md:text-xl">
            Originals
          </BluescreenTitle>
          <GameGrid games={local} />
        </section>
      ) : null}
      {cat === "all" || cat === "slots" ? (
        <section>
          <BluescreenTitle as="h2" className="mb-4 text-lg font-bold md:text-xl">
            Slots
          </BluescreenTitle>
          {hubDown ? (
            <p className="text-sm text-muted-foreground">
              Flexrix hub is configured but not listing games yet. Check FLEXRIX_MERCHANT_KEY on Vercel.
            </p>
          ) : (
            <GameGrid games={cat === "all" ? slots : remote} loading={!ready && slots.length === 0} />
          )}
        </section>
      ) : null}
      {cat === "all" || cat === "live" ? (
        <section>
          <BluescreenTitle as="h2" className="mb-4 text-lg font-bold md:text-xl">
            Live show
          </BluescreenTitle>
          <GameGrid games={cat === "all" ? live : remote} loading={!ready && live.length === 0} />
        </section>
      ) : null}
      {cat !== "all" && cat !== "slots" && cat !== "live" && cat !== "originals" ? (
        <section>
          <BluescreenTitle as="h2" className="mb-4 text-lg font-bold md:text-xl">
            Studio
          </BluescreenTitle>
          <GameGrid games={remote} loading={!ready && remote.length === 0} />
        </section>
      ) : null}
    </main>
  );
}
