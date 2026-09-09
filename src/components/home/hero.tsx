import { useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import { RiArrowLeftSLine, RiArrowRightSLine } from "@remixicon/react";
import { HERO_SLIDES } from "@/lib/games-catalog";
import { Button } from "@/components/ui/button";

export function Hero() {
  const [i, setI] = useState(0);
  const slide = HERO_SLIDES[i]!;
  const label = `${slide.titleLime} ${slide.titleRest}`;

  useEffect(() => {
    const t = window.setInterval(() => setI((n) => (n + 1) % HERO_SLIDES.length), 7000);
    return () => window.clearInterval(t);
  }, []);

  return (
    <section
      aria-roledescription="carousel"
      aria-label="Featured TOLS originals"
      className="relative overflow-hidden rounded-2xl bg-card shadow-[var(--shadow-glow)]"
    >
      <h1 className="sr-only">
        TOLS casino — originals for crash, dice, roulette, blackjack, mines, keno, pool rush and neon sevens.
        18+ play-money tables.
      </h1>
      <div className="relative min-h-44 w-full md:min-h-72 lg:min-h-80">
        {HERO_SLIDES.map((s, idx) => (
          <img
            key={s.id}
            src={s.image}
            alt={s.alt}
            width={1792}
            height={1008}
            decoding={idx === 0 ? "sync" : "async"}
            fetchPriority={idx === 0 ? "high" : "low"}
            className="absolute inset-0 size-full object-cover transition-opacity duration-500"
            style={{ objectPosition: s.position, opacity: idx === i ? 1 : 0 }}
          />
        ))}
        <div className="pointer-events-none absolute inset-0 bg-linear-to-t from-black/75 via-black/25 to-transparent md:bg-linear-to-r md:from-black/80 md:via-black/35 md:to-transparent" />
        <div className="relative z-10 flex h-full min-h-44 items-end justify-between gap-4 p-4 md:min-h-72 md:p-8">
          <div className="min-w-0 max-w-md">
            <p className="font-bluescreens text-[0.65rem] tracking-[0.22em] text-lime uppercase">{slide.kicker}</p>
            <h2
              aria-live="polite"
              className="font-bluescreens text-2xl font-black tracking-wide uppercase drop-shadow-[0_2px_10px_rgb(0_0_0_/_0.85)] md:text-5xl"
            >
              <span className="text-lime">{slide.titleLime}</span>{" "}
              <span className="text-white">{slide.titleRest}</span>
            </h2>
            <p className="mt-1 max-w-md text-xs text-white md:text-sm">{slide.subtitle}</p>
          </div>
          <Button
            asChild
            className="mb-0.5 h-10 shrink-0 rounded-lg border border-lime bg-transparent px-5 font-semibold text-lime hover:bg-lime hover:text-primary md:h-11 md:px-6"
          >
            <Link to="/games/$id" params={{ id: slide.id }} aria-label={`${slide.cta} ${label}`}>
              {slide.cta}
            </Link>
          </Button>
        </div>
        <button
          type="button"
          className="absolute top-1/2 left-2 z-10 grid size-9 -translate-y-1/2 place-items-center rounded-full bg-black/50 text-white md:left-3 md:size-10"
          onClick={() => setI((n) => (n + HERO_SLIDES.length - 1) % HERO_SLIDES.length)}
          aria-label="Previous featured game"
        >
          <RiArrowLeftSLine />
        </button>
        <button
          type="button"
          className="absolute top-1/2 right-2 z-10 grid size-9 -translate-y-1/2 place-items-center rounded-full bg-black/50 text-white md:right-3 md:size-10"
          onClick={() => setI((n) => (n + 1) % HERO_SLIDES.length)}
          aria-label="Next featured game"
        >
          <RiArrowRightSLine />
        </button>
        <div className="absolute bottom-3 left-1/2 z-10 flex -translate-x-1/2 gap-1.5" role="tablist" aria-label="Hero slides">
          {HERO_SLIDES.map((s, idx) => (
            <button
              key={s.id}
              type="button"
              role="tab"
              aria-selected={idx === i}
              aria-label={`${s.titleLime} ${s.titleRest}`}
              className={`h-1 rounded-full transition-all ${idx === i ? "w-6 bg-primary" : "w-2 bg-white/40"}`}
              onClick={() => setI(idx)}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
