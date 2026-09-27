import { cn } from "cn";

/** Exact SVGs the operator attached — white/color wordmarks for the dark lobby. */
const LOGOS = [
  { src: "/brand/providers/hacksaw.svg", name: "Hacksaw Gaming" },
  { src: "/brand/providers/thunderkick.svg", name: "Thunderkick" },
  { src: "/brand/providers/avatarux.svg", name: "AvatarUX" },
  { src: "/brand/providers/btg.svg", name: "Big Time Gaming" },
  { src: "/brand/providers/red-tiger.svg", name: "Red Tiger" },
  { src: "/brand/providers/pgsoft.svg", name: "PG Soft" },
  { src: "/brand/providers/netent.svg", name: "NetEnt" },
  { src: "/brand/providers/trings.svg", name: "Trings Gaming" },
  { src: "/brand/providers/push-gaming.svg", name: "Push Gaming" },
  { src: "/brand/providers/bgaming.svg", name: "BGaming" },
  { src: "/brand/providers/evolution.svg", name: "Evolution" },
  { src: "/brand/providers/pragmatic-live.svg", name: "Pragmatic Live" },
  { src: "/brand/providers/shady-lady.svg", name: "Shady Lady" },
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
            className="h-8 w-auto max-w-[160px] object-contain object-center opacity-95 transition duration-200 hover:opacity-100 md:h-9"
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
