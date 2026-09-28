import { useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import { RiArrowLeftSLine, RiArrowRightSLine } from "@remixicon/react";

/** Official art first. Those two already carry the lockup, so the HTML title stays off. */
const HERO_SLIDES = [
  {
    id: "brand",
    image: "/brand/hero/banner-chips.jpg",
    kicker: "TOLS",
    title: "TOLS",
    subtitle: "Chips, cards, originals.",
    cta: "PLAY",
    alt: "TOLS banner — cyan chips, paint and the T lockup",
    art: false,
    to: "/casino" as const,
  },
  {
    id: "horse-race",
    image: "/brand/hero/banner-derby.jpg",
    kicker: "HORSE RACE",
    title: "HORSE RACE",
    subtitle: "Six runners. Pick one.",
    cta: "RACE",
    alt: "TOLS Horse Race banner — jockeys in purple and magenta",
    art: false,
    to: "/games/$id" as const,
  },
  {
    id: "obsidian-blackjack",
    image: "https://i.imgur.com/3WS292W.jpeg",
    kicker: "TOLS",
    title: "TOLS ORIGINALS",
    subtitle: "Crash · Dice · Roulette · Blackjack",
    cta: "PLAY",
    alt: "TOLS official welcome banner",
    art: false,
    to: "/games/$id" as const,
  },
  {
    id: "neon-crash",
    image: "https://i.imgur.com/XSrb45H.jpeg",
    kicker: "CRASH",
    title: "NEON CRASH",
    subtitle: "Ride the curve. Cash out before it snaps.",
    cta: "RIDE",
    alt: "TOLS official banner — T mark and paint",
    art: false,
    to: "/games/$id" as const,
  },
  {
    id: "signal-dice",
    image: "https://i.imgur.com/oc8QKer.jpeg",
    kicker: "DICE",
    title: "SIGNAL DICE",
    subtitle: "Roll under or over. Instant.",
    cta: "BET",
    alt: "TOLS official banner — coins and cards",
    art: false,
    to: "/games/$id" as const,
  },
  {
    id: "obsidian-blackjack-2",
    image: "https://i.imgur.com/TYL209h.jpeg",
    kicker: "TABLE",
    title: "BLACKJACK",
    subtitle: "Dealer stands on 17. Blackjack pays 3:2.",
    cta: "DEAL",
    alt: "TOLS official banner — cards and chips",
    art: false,
    to: "/games/$id" as const,
  },
  {
    id: "crazy-tols",
    image: "https://i.imgur.com/Rp8qmiu.jpeg",
    kicker: "LIVE",
    title: "CRAZY TOLS",
    subtitle: "Money wheel · 4 bonus rounds",
    cta: "SPIN",
    alt: "TOLS official banner — hands passing chips",
    art: false,
    to: "/games/$id" as const,
  },
  {
    id: "pool-rush",
    image: "https://i.imgur.com/i7Mf7Ki.jpeg",
    kicker: "NEW",
    title: "POOL RUSH",
    subtitle: "Break the rack for multipliers.",
    cta: "BREAK",
    alt: "TOLS official banner — trophy podium",
    art: false,
    to: "/games/$id" as const,
  },
  {
    id: "midnight-roulette",
    image: "https://i.imgur.com/3APlAxH.jpeg",
    kicker: "TABLE",
    title: "TOLS ROULETTE",
    subtitle: "European single zero · 97.3% RTP",
    cta: "PLAY",
    alt: "TOLS official banner — aces",
    art: false,
    to: "/games/$id" as const,
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
      <div className="relative aspect-[2.15/1] w-full sm:aspect-[3/1] sm:min-h-44 md:min-h-56">
        {HERO_SLIDES.map((s, idx) => {
          const frame = (
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
          );
          const cls = "absolute inset-0 block transition-opacity duration-500";
          const style = { opacity: idx === i ? 1 : 0, pointerEvents: idx === i ? "auto" : "none" } as const;
          return s.to === "/casino" ? (
            <Link
              key={`${s.image}-${idx}`}
              to="/casino"
              tabIndex={idx === i ? 0 : -1}
              className={cls}
              style={style}
              aria-hidden={idx !== i}
            >
              {frame}
            </Link>
          ) : (
            <Link
              key={`${s.image}-${idx}`}
              to="/games/$id"
              params={{ id: s.id }}
              tabIndex={idx === i ? 0 : -1}
              className={cls}
              style={style}
              aria-hidden={idx !== i}
            >
              {frame}
            </Link>
          );
        })}
        {!current.art ? (
          <div className="pointer-events-none absolute inset-0 z-10 bg-linear-to-t from-black/75 via-black/20 to-transparent" />
        ) : null}
        {!current.art ? (
          <div className="pointer-events-none absolute inset-x-0 bottom-0 z-20 p-3 sm:p-4 md:p-6">
          <p className="text-[0.6rem] font-semibold tracking-[0.16em] text-lime uppercase md:text-xs">
            {current.kicker}
          </p>
          <p className="font-bluescreens mt-0.5 text-xl leading-none font-bold tracking-wide text-white uppercase sm:mt-1 sm:text-3xl md:text-4xl">
            {current.title}
          </p>
          <p className="mt-1 line-clamp-1 max-w-xl text-[11px] text-white/75 sm:text-sm">{current.subtitle}</p>
          <span className="mt-2 inline-flex rounded-full bg-lime px-2.5 py-1 text-[0.65rem] font-bold tracking-wide text-[#0d0d10] uppercase sm:mt-3 sm:px-3">
            {current.cta}
          </span>
        </div>
        ) : null}
        <button
          type="button"
          className="absolute right-11 bottom-2 z-30 grid size-7 place-items-center rounded-full bg-black/50 text-white sm:top-1/2 sm:right-auto sm:bottom-auto sm:left-2 sm:size-9 sm:-translate-y-1/2 md:left-3 md:size-10"
          onClick={() => setI((n) => (n + HERO_SLIDES.length - 1) % HERO_SLIDES.length)}
          aria-label="Previous banner"
        >
          <RiArrowLeftSLine />
        </button>
        <button
          type="button"
          className="absolute right-2 bottom-2 z-30 grid size-7 place-items-center rounded-full bg-black/50 text-white sm:top-1/2 sm:bottom-auto sm:size-9 sm:-translate-y-1/2 md:right-3 md:size-10"
          onClick={() => setI((n) => (n + 1) % HERO_SLIDES.length)}
          aria-label="Next banner"
        >
          <RiArrowRightSLine />
        </button>
        <div className="absolute bottom-2.5 left-1/2 z-30 hidden -translate-x-1/2 gap-1.5 sm:flex" role="tablist" aria-label="Hero banners">
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
