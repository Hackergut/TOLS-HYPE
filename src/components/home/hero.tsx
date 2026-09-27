import { useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import { RiArrowLeftSLine, RiArrowRightSLine } from "@remixicon/react";

/** User pack 1–6.jpg + TOLS BANNER. Fallback = same art already in /brand/affiliate. */
const HERO_SLIDES = [
  {
    id: "obsidian-blackjack",
    image: "/brand/hero/welcome.jpg",
    fallback: "/brand/affiliate/hero-brand.jpg",
    alt: "TOLS official welcome banner",
  },
  {
    id: "neon-crash",
    image: "/brand/hero/1.jpg",
    fallback: "/brand/affiliate/banner-income.jpg",
    alt: "TOLS official banner — T mark and paint",
  },
  {
    id: "signal-dice",
    image: "/brand/hero/2.jpg",
    fallback: "/brand/affiliate/banner-info.jpg",
    alt: "TOLS official banner — coins and cards",
  },
  {
    id: "obsidian-blackjack",
    image: "/brand/hero/3.jpg",
    fallback: "/brand/affiliate/banner-promote.jpg",
    alt: "TOLS official banner — cards and chips",
  },
  {
    id: "crazy-tols",
    image: "/brand/hero/4.jpg",
    fallback: "/brand/affiliate/banner-referrals.jpg",
    alt: "TOLS official banner — hands passing chips",
  },
  {
    id: "pool-rush",
    image: "/brand/hero/5.jpg",
    fallback: "/brand/affiliate/banner-rank-win.jpg",
    alt: "TOLS official banner — trophy podium",
  },
  {
    id: "midnight-roulette",
    image: "/brand/hero/6.jpg",
    fallback: "/brand/affiliate/banner-pro.jpg",
    alt: "TOLS official banner — aces",
  },
] as const;

function BannerImg({ src, fallback, alt, priority }: { src: string; fallback: string; alt: string; priority: boolean }) {
  const [url, setUrl] = useState(src);
  return (
    <img
      src={url}
      alt={alt}
      width={1200}
      height={400}
      decoding="async"
      fetchPriority={priority ? "high" : "low"}
      loading={priority ? "eager" : "lazy"}
      onError={() => {
        if (url !== fallback) setUrl(fallback);
      }}
      className="absolute inset-0 size-full object-cover object-center"
    />
  );
}

export function Hero() {
  const [i, setI] = useState(0);

  useEffect(() => {
    const tick = () => setI((n) => (n + 1) % HERO_SLIDES.length);
    let t = 0;
    function start() {
      window.clearInterval(t);
      if (document.hidden) return;
      t = window.setInterval(tick, 7000);
    }
    start();
    document.addEventListener("visibilitychange", start);
    return () => {
      window.clearInterval(t);
      document.removeEventListener("visibilitychange", start);
    };
  }, []);

  return (
    <section
      aria-roledescription="carousel"
      aria-label="Official TOLS banners"
      className="relative overflow-hidden rounded-2xl bg-[#101014] shadow-[var(--shadow-glow)]"
    >
      <h1 className="sr-only">
        TOLS casino — originals for crash, dice, roulette, blackjack, mines, keno, pool rush and crazy tols.
        18+ play-money tables.
      </h1>
      <div className="relative aspect-[3/1] w-full min-h-36 sm:min-h-44 md:min-h-56">
        {HERO_SLIDES.map((s, idx) => (
          <Link
            key={`${s.image}-${idx}`}
            to="/games/$id"
            params={{ id: s.id }}
            tabIndex={idx === i ? 0 : -1}
            className="absolute inset-0 block transition-opacity duration-500"
            style={{ opacity: idx === i ? 1 : 0, pointerEvents: idx === i ? "auto" : "none" }}
            aria-hidden={idx !== i}
          >
            <BannerImg src={s.image} fallback={s.fallback} alt={idx === i ? s.alt : ""} priority={idx === i} />
          </Link>
        ))}
        <button
          type="button"
          className="absolute top-1/2 left-2 z-10 grid size-9 -translate-y-1/2 place-items-center rounded-full bg-black/50 text-white md:left-3 md:size-10"
          onClick={() => setI((n) => (n + HERO_SLIDES.length - 1) % HERO_SLIDES.length)}
          aria-label="Previous banner"
        >
          <RiArrowLeftSLine />
        </button>
        <button
          type="button"
          className="absolute top-1/2 right-2 z-10 grid size-9 -translate-y-1/2 place-items-center rounded-full bg-black/50 text-white md:right-3 md:size-10"
          onClick={() => setI((n) => (n + 1) % HERO_SLIDES.length)}
          aria-label="Next banner"
        >
          <RiArrowRightSLine />
        </button>
        <div className="absolute bottom-3 left-1/2 z-10 flex -translate-x-1/2 gap-1.5" role="tablist" aria-label="Hero banners">
          {HERO_SLIDES.map((s, idx) => (
            <button
              key={`${s.image}-${idx}`}
              type="button"
              role="tab"
              aria-selected={idx === i}
              aria-label={s.alt}
              className={`h-1 rounded-full transition-all ${idx === i ? "w-6 bg-lime" : "w-2 bg-white/40"}`}
              onClick={() => setI(idx)}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
