import { useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import { RiArrowLeftSLine, RiArrowRightSLine } from "@remixicon/react";
import { HERO_SLIDES } from "@/lib/hero-slides";
import { Button } from "@/components/ui/button";

export function Hero() {
  const [i, setI] = useState(0);
  const slide = HERO_SLIDES[i]!;
  const label = `${slide.titleLime} ${slide.titleRest}`;

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
      data-hero
      aria-roledescription="carousel"
      aria-label="Featured TOLS originals"
      className="relative overflow-hidden rounded-2xl bg-card shadow-[var(--shadow-glow)]"
    >
      <h1 className="sr-only">
        TOLS casino — originals for crash, dice, roulette, blackjack, mines, keno, pool rush and crazy tols.
        18+ play-money tables.
      </h1>
      <div className="relative min-h-40 w-full sm:min-h-56 md:min-h-72 lg:min-h-80">
        {HERO_SLIDES.map((s, idx) =>
          idx === i || idx === (i + 1) % HERO_SLIDES.length ? (
            <img
              key={`${s.image}-${idx}`}
              src={s.image}
              alt={idx === i ? s.alt : ""}
              width={1200}
              height={400}
              decoding="async"
              fetchPriority={idx === i ? "high" : "low"}
              loading={idx === i ? "eager" : "lazy"}
              className="absolute inset-0 size-full object-cover transition-opacity duration-500"
              style={{ objectPosition: s.position, opacity: idx === i ? 1 : 0 }}
            />
          ) : null,
        )}
        <div className="pointer-events-none absolute inset-0 bg-linear-to-t from-black/80 via-black/30 to-transparent md:bg-linear-to-r md:from-black/80 md:via-black/35 md:to-transparent" />
        <div className="relative z-10 flex h-full min-h-40 items-end justify-between gap-3 p-3 sm:min-h-44 sm:p-4 md:min-h-72 md:p-8">
          <div className="min-w-0 max-w-md">
            <p className="text-[0.65rem] font-semibold tracking-[0.2em] text-lime uppercase">{slide.kicker}</p>
            <h2
              aria-live="polite"
              className="font-heading text-xl font-black tracking-tight uppercase drop-shadow-[0_2px_10px_rgb(0_0_0_/_0.85)] sm:text-2xl md:text-5xl"
            >
              <span className="text-lime">{slide.titleLime}</span>{" "}
              <span className="text-white">{slide.titleRest}</span>
            </h2>
            <p className="mt-1 max-w-md text-[0.7rem] text-white/90 sm:text-xs md:text-sm">{slide.subtitle}</p>
          </div>
          <Button
            asChild
            className="mb-0.5 h-11 min-h-11 shrink-0 rounded-lg border border-lime bg-transparent px-4 font-semibold text-lime hover:bg-lime hover:text-black md:h-11 md:px-6"
          >
            <Link to="/games/$id" params={{ id: slide.id }} aria-label={`${slide.cta} ${label}`}>
              {slide.cta}
            </Link>
          </Button>
        </div>
        <button
          type="button"
          className="absolute top-1/2 left-2 z-10 grid size-11 -translate-y-1/2 place-items-center rounded-full bg-black/50 text-white md:left-3 md:size-10"
          onClick={() => setI((n) => (n + HERO_SLIDES.length - 1) % HERO_SLIDES.length)}
          aria-label="Previous featured game"
        >
          <RiArrowLeftSLine />
        </button>
        <button
          type="button"
          className="absolute top-1/2 right-2 z-10 grid size-11 -translate-y-1/2 place-items-center rounded-full bg-black/50 text-white md:right-3 md:size-10"
          onClick={() => setI((n) => (n + 1) % HERO_SLIDES.length)}
          aria-label="Next featured game"
        >
          <RiArrowRightSLine />
        </button>
        <div className="absolute bottom-2 left-1/2 z-10 flex -translate-x-1/2 gap-1.5" role="tablist" aria-label="Hero slides">
          {HERO_SLIDES.map((s, idx) => (
            <button
              key={`${s.image}-dot-${idx}`}
              type="button"
              role="tab"
              aria-selected={idx === i}
              aria-label={`${s.titleLime} ${s.titleRest}`}
              className={`h-1 min-h-1 rounded-full transition-all ${idx === i ? "w-6 bg-primary" : "w-2 bg-white/40"}`}
              onClick={() => setI(idx)}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
