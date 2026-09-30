import { useMemo } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Hero } from "@/components/home/hero";
import { LogoLoop } from "@/components/home/logo-loop";
import { PromoBanner } from "@/components/home/promo-banner";
import { LobbySection } from "@/components/games/lobby-section";
import { ProviderStrip } from "@/components/games/provider-strip";
import { BluescreenTitle } from "@/components/brand/bluescreen-title";
import { groupByProvider } from "@/lib/providers";
import {
  lobbyPool,
  sectionByCategory,
} from "@/lib/lobby-sections";
import { useRemoteCatalog } from "@/hooks/use-remote-catalog";

const TITLE = "TOLS — Originals casino | Crash, Dice, Roulette, Blackjack";
const DESC =
  "TOLS originals casino. Play crash, dice, roulette, blackjack, mines, keno, pool rush and crazy tols. 18+ play-money tables, provably fair.";
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
  const navigate = useNavigate();
  const { games: studio, ready, flexrix } = useRemoteCatalog();
  const pool = useMemo(() => lobbyPool(studio), [studio]);
  const originals = useMemo(() => sectionByCategory(pool, "originals"), [pool]);
  const slots = useMemo(() => sectionByCategory(pool, "slots"), [pool]);
  const crash = useMemo(() => sectionByCategory(pool, "crash"), [pool]);
  const tables = useMemo(() => sectionByCategory(pool, "table"), [pool]);
  const live = useMemo(() => sectionByCategory(pool, "live"), [pool]);
  const providers = useMemo(() => groupByProvider(studio), [studio]);
  const loading = !ready && studio.length === 0;
  const hubDown = Boolean(flexrix.error) && studio.length === 0;

  return (
    <main className="tols-lobby mx-auto w-full max-w-6xl">
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
          }),
        }}
      />
      <Hero />
      <LogoLoop />
      <PromoBanner />

      <LobbySection title="Originals" cat="originals" games={originals} limit={24} />
      <LobbySection title="Crash" cat="crash" games={crash} limit={24} />
      <LobbySection title="Slots" cat="slots" games={slots} loading={loading} limit={24} />
      <LobbySection title="Table Games" cat="table" games={tables} limit={24} />
      <LobbySection title="Live Show" cat="live" games={live} loading={loading} limit={24} />

      <section aria-label="Providers" className="flex flex-col gap-2.5">
        <div className="flex items-end gap-3">
          <BluescreenTitle as="h2" className="text-lg font-bold md:text-xl">
            Providers
          </BluescreenTitle>
          <span className="pb-0.5 text-xs text-muted-foreground">{providers.length || ""}</span>
        </div>
        {hubDown ? (
          <p className="text-sm text-muted-foreground">Studio lobby is waiting on the Flexrix hub.</p>
        ) : (
          <ProviderStrip
            providers={providers}
            selected={null}
            onSelect={(slug) => {
              if (slug) navigate({ to: "/casino", search: { provider: slug } });
            }}
          />
        )}
      </section>
    </main>
  );
}
