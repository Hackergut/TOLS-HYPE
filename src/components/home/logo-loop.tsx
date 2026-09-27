import { cn } from "cn";

/** Paths that actually exist in public/brand/providers/. */
const LOGOS = [
  { src: "/brand/providers/pragmatic-play.png", name: "Pragmatic Play" },
  { src: "/brand/providers/evolution-gaming.png", name: "Evolution" },
  { src: "/brand/providers/hacksaw.png", name: "Hacksaw Gaming" },
  { src: "/brand/providers/pgsoft.jpg", name: "PG Soft" },
  { src: "/brand/providers/netent.png", name: "NetEnt" },
  { src: "/brand/providers/relax-gaming.png", name: "Relax Gaming" },
  { src: "/brand/providers/playngo.png", name: "Play'n GO" },
  { src: "/brand/providers/yggdrasil.png", name: "Yggdrasil" },
  { src: "/brand/providers/redtiger.png", name: "Red Tiger" },
  { src: "/brand/providers/endorphina.png", name: "Endorphina" },
  { src: "/brand/providers/habanero.png", name: "Habanero" },
  { src: "/brand/providers/greentube.png", name: "Greentube" },
] as const;

function Track({ ariaHidden = false }: { ariaHidden?: boolean }) {
  return (
    <ul
      className="flex shrink-0 items-center gap-10 pr-10 md:gap-14 md:pr-14"
      aria-hidden={ariaHidden || undefined}
    >
      {LOGOS.map((logo) => (
        <li key={`${logo.src}-${ariaHidden ? "b" : "a"}`} className="flex h-10 shrink-0 items-center">
          <img
            src={logo.src}
            alt={ariaHidden ? "" : logo.name}
            title={logo.name}
            loading="lazy"
            decoding="async"
            draggable={false}
            onError={(e) => {
              e.currentTarget.style.display = "none";
            }}
            className="h-8 w-auto max-w-[148px] object-contain object-center opacity-90 transition duration-200 hover:opacity-100 md:h-9"
          />
        </li>
      ))}
    </ul>
  );
}

/** iCarLux-style infinite logo ticker. Pause on hover / reduced motion. */
export function LogoLoop({ className }: { className?: string }) {
  return (
    <section
      aria-label="Studio partners"
      className={cn(
        "relative -mx-3 overflow-hidden border-y border-white/8 py-5 md:mx-0 md:rounded-xl md:border md:px-0",
        className,
      )}
    >
      <style>{`
        @keyframes tols-logo-loop {
          from { transform: translate3d(0,0,0); }
          to { transform: translate3d(-50%,0,0); }
        }
        .tols-logo-track {
          animation: tols-logo-loop 42s linear infinite;
          width: max-content;
        }
        .group:hover .tols-logo-track {
          animation-play-state: paused;
        }
        @media (prefers-reduced-motion: reduce) {
          .tols-logo-track { animation: none; }
        }
      `}</style>
      <div className="pointer-events-none absolute inset-y-0 left-0 z-1 w-16 bg-linear-to-r from-[#0d0d10] to-transparent md:w-24" />
      <div className="pointer-events-none absolute inset-y-0 right-0 z-1 w-16 bg-linear-to-l from-[#0d0d10] to-transparent md:w-24" />
      <div className="group flex w-max">
        <div className="tols-logo-track flex">
          <Track />
          <Track ariaHidden />
        </div>
      </div>
    </section>
  );
}
