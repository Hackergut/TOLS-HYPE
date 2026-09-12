import { SPORT_META, type SportEvent } from "@/lib/sports-book";
import { TeamCrest } from "@/components/sports/team-crest";
import { leagueCrest } from "@/lib/club-crests";

export function FieldBoard({ event }: { event: SportEvent }) {
  const field = SPORT_META[event.sport].field;
  const tennis = event.sport === "tennis";

  return (
    <div className="sb-field relative isolate h-24 overflow-hidden sm:h-28 md:h-32">
      {tennis ? <TennisCourt /> : <img src={field} alt="" className="absolute inset-0 size-full object-cover" loading="lazy" decoding="async" />}
      <div className="absolute inset-0 bg-linear-to-t from-background via-background/35 to-background/20" />
      <div className="absolute top-2 left-2 z-1 flex items-center gap-1.5">
        {event.live ? (
          <span className="inline-flex items-center gap-1 rounded-md bg-black/60 px-1.5 py-0.5 text-[0.6rem] font-medium tracking-wide uppercase">
            <span className="sb-pip" />
            <span className="sb-live">Live {event.minute}</span>
          </span>
        ) : (
          <span className="rounded-md bg-black/60 px-1.5 py-0.5 text-[0.6rem] font-medium tracking-wide text-muted-foreground uppercase">
            {event.start}
          </span>
        )}
      </div>
      <div className="absolute inset-x-0 bottom-0 z-1 flex items-end justify-between gap-2 px-3 pb-2">
        <Crest abbr={event.homeAbbr} name={event.home} align="left" />
        <div className="text-center">
          {event.score ? (
            <p className="font-heading text-2xl tracking-wide tabular-nums">
              {event.score[0]}
              <span className="mx-1 text-lime">–</span>
              {event.score[1]}
            </p>
          ) : (
            <p className="font-heading text-sm tracking-[0.2em] text-lime">VS</p>
          )}
          <p className="font-sub mt-1 text-[0.65rem] tracking-[0.14em] text-muted-foreground uppercase">{event.league}</p>
        </div>
        <Crest abbr={event.awayAbbr} name={event.away} align="right" />
      </div>
    </div>
  );
}

function Crest({ abbr, name, align }: { abbr: string; name: string; align: "left" | "right" }) {
  return (
    <div className={`flex min-w-0 items-center gap-2 ${align === "right" ? "flex-row-reverse text-right" : ""}`}>
      <TeamCrest name={name} abbr={abbr} className="size-8" />
      <span className="hidden truncate text-sm font-medium sm:block">{name}</span>
    </div>
  );
}

function TennisCourt() {
  return (
    <svg viewBox="0 0 160 90" className="absolute inset-0 size-full" preserveAspectRatio="xMidYMid slice" aria-hidden>
      <rect width="160" height="90" fill="#1c0529" />
      <rect x="18" y="10" width="124" height="70" fill="#2a0a3d" stroke="#00ffbd" strokeWidth="1.2" />
      <line x1="80" y1="10" x2="80" y2="80" stroke="#00ffbd" strokeWidth="1.4" />
      <rect x="18" y="24" width="124" height="42" fill="none" stroke="#00ffbd" strokeWidth="0.8" />
      <line x1="18" y1="45" x2="142" y2="45" stroke="#00ffbd" strokeWidth="0.6" opacity="0.7" />
      <line x1="80" y1="24" x2="80" y2="66" stroke="#00ffbd" strokeWidth="0.6" opacity="0.5" />
    </svg>
  );
}
