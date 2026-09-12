import type { MatchLive } from "@/lib/match-live";
import type { SportEvent } from "@/lib/sports-book";

export function MatchStage({ event, live }: { event: SportEvent; live: MatchLive }) {
  if (event.sport === "tennis") return <TennisStage event={event} live={live} />;
  if (event.sport === "mma") return <MmaStage event={event} live={live} />;
  return <PitchStage event={event} live={live} />;
}

function PitchStage({ event, live }: { event: SportEvent; live: MatchLive }) {
  const min = parseInt(event.minute ?? "0", 10) || 0;
  return (
    <div className="sb-card px-3 py-4">
      <svg viewBox="0 0 320 150" className="mx-auto block w-full max-w-md" aria-hidden>
        <defs>
          <linearGradient id="pitch" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#1a4a12" />
            <stop offset="1" stopColor="#0f2e0c" />
          </linearGradient>
        </defs>
        <polygon points="40,28 280,28 310,128 10,128" fill="url(#pitch)" stroke="#00ffbd" strokeWidth="1.2" />
        <line x1="160" y1="28" x2="160" y2="128" stroke="#cdf32b" strokeWidth="0.8" opacity="0.7" />
        <ellipse cx="160" cy="78" rx="22" ry="14" fill="none" stroke="#cdf32b" strokeWidth="0.8" opacity="0.7" />
        <polygon points="40,50 88,50 80,106 18,106" fill="none" stroke="#cdf32b" strokeWidth="0.7" opacity="0.6" />
        <polygon points="280,50 232,50 240,106 302,106" fill="none" stroke="#cdf32b" strokeWidth="0.7" opacity="0.6" />
      </svg>
      <div className="relative mx-auto mt-3 h-8 max-w-md">
        <div className="absolute inset-x-0 top-1/2 h-0.5 -translate-y-1/2 bg-muted" />
        <span className="absolute top-5 left-0 text-[0.55rem] text-muted-foreground">0'</span>
        <span className="absolute top-5 left-1/2 -translate-x-1/2 text-[0.55rem] text-muted-foreground">45'</span>
        <span className="absolute top-5 right-0 text-[0.55rem] text-muted-foreground">90'</span>
        {live.events
          .filter((e) => e.kind === "goal")
          .map((e) => {
            const m = Math.min(90, parseInt(e.minute, 10) || 0);
            return (
              <span
                key={`${e.minute}-${e.player}`}
                className={`absolute top-0 size-3 -translate-x-1/2 rounded-full ${e.team === "home" ? "bg-lime" : "bg-violet"}`}
                style={{ left: `${(m / 90) * 100}%` }}
                title={`${e.player} ${e.minute}`}
              />
            );
          })}
        {event.live ? (
          <span className="absolute top-0 h-3 w-0.5 bg-lime" style={{ left: `${Math.min(100, (min / 90) * 100)}%` }} />
        ) : null}
      </div>
    </div>
  );
}

function TennisStage({ event, live }: { event: SportEvent; live: MatchLive }) {
  const t = live.tennis;
  return (
    <div className="sb-card px-3 py-4">
      <svg viewBox="0 0 320 140" className="mx-auto block w-full max-w-md" aria-hidden>
        <polygon points="50,24 270,24 305,122 15,122" fill="#1c4a8a" stroke="#34edcd" strokeWidth="1.2" />
        <line x1="160" y1="24" x2="160" y2="122" stroke="#e8f4ff" strokeWidth="1" />
        <rect x="70" y="44" width="180" height="58" fill="none" stroke="#e8f4ff" strokeWidth="0.8" />
        <circle cx="200" cy="70" r="5" fill="#cdf32b" />
      </svg>
      {t ? (
        <div className="mt-3 grid grid-cols-2 gap-2 text-center text-sm">
          <p>
            {event.home} {t.serving === "home" ? "· serve" : ""}
            <span className="mt-1 block font-heading text-xl tabular-nums">{t.points[0]}</span>
          </p>
          <p>
            {event.away} {t.serving === "away" ? "· serve" : ""}
            <span className="mt-1 block font-heading text-xl tabular-nums">{t.points[1]}</span>
          </p>
        </div>
      ) : null}
    </div>
  );
}

function MmaStage({ event, live }: { event: SportEvent; live: MatchLive }) {
  const m = live.mma;
  return (
    <div className="sb-card grid grid-cols-[1fr_auto_1fr] items-end gap-2 px-3 py-4">
      <div className="text-center">
        <p className="font-heading text-lg">{event.homeAbbr}</p>
        <p className="text-[0.65rem] text-muted-foreground">{m?.control[0]} control</p>
        <div className="mx-auto mt-2 h-28 w-16 rounded-md bg-lime/20" />
      </div>
      <div className="flex flex-col items-center gap-2 pb-6">
        <p className="font-heading text-3xl text-muted-foreground">{m?.round ?? 1}</p>
        <p className="font-sub text-[0.6rem] tracking-[0.14em] text-lime uppercase">Round</p>
        <p className="rounded-md bg-lime px-2 py-0.5 text-xs font-bold text-black">{m?.clock}</p>
        <div className="h-28 w-1.5 overflow-hidden rounded-full bg-muted">
          <div className="h-3/5 w-full bg-lime" />
        </div>
      </div>
      <div className="text-center">
        <p className="font-heading text-lg">{event.awayAbbr}</p>
        <p className="text-[0.65rem] text-muted-foreground">{m?.control[1]} control</p>
        <div className="mx-auto mt-2 h-28 w-16 rounded-md" style={{ background: "rgb(144 75 249 / 0.25)" }} />
      </div>
    </div>
  );
}
