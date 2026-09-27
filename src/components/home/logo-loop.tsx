import { cn } from "cn";

/** Official white SVG wordmarks supplied for the lobby ticker. */
const LOGOS = [
  { src: "/brand/providers/shady-lady.svg", name: "Shady Lady" },
  { src: "/brand/providers/thunderkick.svg", name: "Thunderkick" },
  { src: "/brand/providers/avatarux.svg", name: "AvatarUX" },
  { src: "/brand/providers/btg.svg", name: "Big Time Gaming" },
  { src: "/brand/providers/red-tiger.svg", name: "Red Tiger" },
  { src: "/brand/providers/pgsoft.svg", name: "PG Soft" },
  { src: "/brand/providers/netent.svg", name: "NetEnt" },
  { src: "/brand/providers/trings.svg", name: "7Rings Gaming" },
  { src: "/brand/providers/push-gaming.svg", name: "Push Gaming" },
  { src: "/brand/providers/bgaming.svg", name: "BGaming" },
  { src: "/brand/providers/elk.svg", name: "ELK Studios" },
  { src: "/brand/providers/pragmatic-live.svg", name: "Pragmatic Live" },
  { src: "/brand/providers/betsoft.svg", name: "Betsoft" },
] as const;

function Track({ ariaHidden = false }: { ariaHidden?: boolean }) {
  return (
    <ul
      className="flex shrink-0 items-center gap-6 pr-6 md:gap-14 md:pr-14"
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
            className="h-6 w-auto max-w-[120px] object-contain object-center md:h-9 md:max-w-[190px]"
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
        "tols-logo-viewport group relative -mx-3 overflow-hidden border-y border-white/8 py-2 md:mx-0 md:rounded-xl md:border md:px-0",
        className,
      )}
    >
      <div className="pointer-events-none absolute inset-y-0 left-0 z-1 w-16 bg-linear-to-r from-[#0d0d10] to-transparent md:w-24" />
      <div className="pointer-events-none absolute inset-y-0 right-0 z-1 w-16 bg-linear-to-l from-[#0d0d10] to-transparent md:w-24" />
      <div className="flex w-max">
        <div className="tols-logo-track">
          <Track />
          <Track ariaHidden />
        </div>
      </div>
    </section>
  );
}
