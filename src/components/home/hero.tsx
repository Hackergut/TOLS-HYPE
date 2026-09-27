import { useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import { RiArrowLeftSLine, RiArrowRightSLine } from "@remixicon/react";

/** Official 1200×400 pack as image. Titles live in HTML, not baked into the JPEG. */
const HERO_SLIDES = [
  {
    id: "obsidian-blackjack",
    image: "https://i.imgur.com/3WS292W.jpeg",
    kicker: "TOLS",
    title: "TOLS ORIGINALS",
    subtitle: "Crash · Dice · Roulette · Blackjack",
    cta: "PLAY",
    alt: "TOLS official welcome banner",
  },
  {
    id: "neon-crash",
    image: "https://i.imgur.com/XSrb45H.jpeg",
    kicker: "CRASH",
    title: "NEON CRASH",
    subtitle: "Ride the curve. Cash out before it snaps.",
    cta: "RIDE",
    alt: "TOLS official banner — T mark and paint",
  },
  {
    id: "signal-dice",
    image: "https://i.imgur.com/oc8QKer.jpeg",
    kicker: "DICE",
    title: "SIGNAL DICE",
    subtitle: "Roll under or over. Instant.",
    cta: "BET",
    alt: "TOLS official banner — coins and cards",
  },
  {
    id: "obsidian-blackjack-2",
    image: "https://i.imgur.com/TYL209h.jpeg",
    kicker: "TABLE",
    title: "BLACKJACK",
    subtitle: "Dealer stands on 17. Blackjack pays 3:2.",
    cta: "DEAL",
    alt: "TOLS official banner — cards and chips",
  },
  {
    id: "crazy-tols",
    image: "https://i.imgur.com/Rp8qmiu.jpeg",
    kicker: "LIVE",
    title: "CRAZY TOLS",
    subtitle: "Money wheel · 4 bonus rounds",
    cta: "SPIN",
    alt: "TOLS official banner — hands passing chips",
  },
  {
    id: "pool-rush",
    image: "https://i.imgur.com/i7Mf7Ki.jpeg",
    kicker: "NEW",
    title: "POOL RUSH",
    subtitle: "Break the rack for multipliers.",
    cta: "BREAK",
    alt: "TOLS official banner — trophy podium",
  },
  {
    id: "midnight-roulette",
    image: "https://i.imgur.com/3APlAxH.jpeg",
    kicker: "TABLE",
    title: "TOLS ROULETTE",
    subtitle: "European single zero · 97.3% RTP",
    cta: "PLAY",
    alt: "TOLS official banner — aces",
  },
] as const;

export function Hero() {
  const [i, setI] = useState(0);
  const current = HERO_SLIDES[i] ?? HERO_SLIDES[0];

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
            <img
              src={s.image}
              alt={idx === i ? s.alt : ""}
              width={1200}
              height={400}
              decoding="async"
              fetchPriority={idx === i ? "high" : "low"}
              loading={idx === i ? "eager" : "lazy"}
              className="absolute inset-0 size-full object-cover object-center"
            />
          </Link>
        ))}
        <div className="pointer-events-none absolute inset-0 z-10 bg-linear-to-t from-black/75 via-black/20 to-transparent" />
        <div className="pointer-events-none absolute inset-x-0 bottom-0 z-20 p-4 md:p-6">
          <p className="text-[0.65rem] font-semibold tracking-[0.18em] text-lime uppercase md:text-xs">
            {current.kicker}
          </p>
          <p className="font-bluescreens mt-1 text-2xl font-bold tracking-wide text-white uppercase sm:text-3xl md:text-4xl">
            {current.title}
          </p>
          <p className="mt-1 max-w-xl text-xs text-white/75 sm:text-sm">{current.subtitle}</p>
          <span className="mt-3 inline-flex rounded-full bg-lime px-3 py-1 text-[0.7rem] font-bold tracking-wide text-[#0d0d10] uppercase">
            {current.cta}
          </span>
        </div>
        <button
          type="button"
          className="absolute top-1/2 left-2 z-30 grid size-9 -translate-y-1/2 place-items-center rounded-full bg-black/50 text-white md:left-3 md:size-10"
          onClick={() => setI((n) => (n + HERO_SLIDES.length - 1) % HERO_SLIDES.length)}
          aria-label="Previous banner"
        >
          <RiArrowLeftSLine />
        </button>
        <button
          type="button"
          className="absolute top-1/2 right-2 z-30 grid size-9 -translate-y-1/2 place-items-center rounded-full bg-black/50 text-white md:right-3 md:size-10"
          onClick={() => setI((n) => (n + 1) % HERO_SLIDES.length)}
          aria-label="Next banner"
        >
          <RiArrowRightSLine />
        </button>
        <div className="absolute bottom-3 left-1/2 z-30 flex -translate-x-1/2 gap-1.5" role="tablist" aria-label="Hero banners">
          {HERO_SLIDES.map((s, idx) => (
            <button
              key={`${s.image}-${idx}`}
              type="button"
              role="tab"
              aria-selected={idx === i}
              aria-label={s.title}
              className={`h-1 rounded-full transition-all ${idx === i ? "w-6 bg-lime" : "w-2 bg-white/40"}`}
              onClick={() => setI(idx)}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
