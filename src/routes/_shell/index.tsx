import { createFileRoute } from "@tanstack/react-router";
import { Hero } from "@/components/home/hero";
import { PromoCardGrid } from "@/components/home/promo-card-grid";

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
  return (
    <main className="mx-auto flex w-full max-w-6xl flex-col gap-8 md:gap-10">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({ "@context": "https://schema.org", "@type": "WebSite", name: "TOLS", description: DESC, url: "/", image: OG }),
        }}
      />
      <Hero />
      <PromoCardGrid />
    </main>
  );
}
