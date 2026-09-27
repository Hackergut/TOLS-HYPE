import { cn } from "cn";

/** Exact provider SVGs the user sent. White wordmarks on dark. */
const LOGOS = [
  { src: "/brand/providers/user/01.svg", name: "NetEnt" },
  { src: "/brand/providers/user/02.svg", name: "Studio 2" },
  { src: "/brand/providers/user/03.svg", name: "Evolution" },
  { src: "/brand/providers/user/04.svg", name: "Studio 4" },
  { src: "/brand/providers/user/05.svg", name: "Studio 5" },
  { src: "/brand/providers/user/06.svg", name: "Studio 6" },
  { src: "/brand/providers/user/07.svg", name: "Studio 7" },
  { src: "/brand/providers/user/08.svg", name: "PG Soft" },
  { src: "/brand/providers/user/09.svg", name: "Studio 9" },
  { src: "/brand/providers/user/10.svg", name: "Studio 10" },
  { src: "/brand/providers/user/11.svg", name: "Studio 11" },
  { src: "/brand/providers/user/12.svg", name: "Studio 12" },
  { src: "/brand/providers/user/13.svg", name: "Studio 13" },
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
