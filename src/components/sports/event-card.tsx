import { Link } from "@tanstack/react-router";
import { type ReactNode } from "react";
import { cn } from "cn";
import { formatOdds, type OddsFormat } from "@/lib/odds";
import { TeamCrest } from "@/components/sports/team-crest";
import { leagueCrest } from "@/lib/club-crests";
import {
  entitySlug,
  hasDraw,
  isPlayerSport,
  outcomesFor,
  toSlipPick,
  type Outcome,
  type SlipPick,
  type SportEvent,
} from "@/lib/sports-book";

export function EventCard({
  event,
  selected,
  format,
  onToggle,
}: {
  event: SportEvent;
  selected: Set<string>;
  format: OddsFormat;
  onToggle: (pick: SlipPick) => void;
}) {
  const all = outcomesFor(event);
  const ml = all.filter((o) => o.market === "ml");
  const draw = hasDraw(event);

  function click(o: Outcome) {
    onToggle(toSlipPick(event, o));
  }

  if (event.sport === "tennis" || event.sport === "mma") {
    return (
      <article className="sb-card overflow-hidden px-3 py-3">
        <Header event={event} />
        <div className="mt-2 grid grid-cols-[1fr_auto_1fr] items-center gap-2">
          <EntityLink event={event} side="home">
            <Portrait name={event.home} abbr={event.homeAbbr} />
          </EntityLink>
          <Link to="/sports/$id" params={{ id: event.id }} className="text-center">
            {event.score ? (
              <p className="font-heading text-2xl tabular-nums">
                {event.score[0]}
                <span className="mx-1 text-lime">:</span>
                {event.score[1]}
              </p>
            ) : (
              <p className="font-heading text-xs tracking-[0.2em] text-lime">VS</p>
            )}
            <p className="font-sub mt-1 text-[0.6rem] text-muted-foreground uppercase">
              {event.live ? event.minute : event.start}
            </p>
          </Link>
          <EntityLink event={event} side="away">
            <Portrait name={event.away} abbr={event.awayAbbr} />
          </EntityLink>
        </div>
        <div className={cn("mt-3 grid gap-1.5", draw ? "grid-cols-3" : "grid-cols-2")}>
          {ml.map((o) => (
            <OddBtn key={o.id} o={o} format={format} on={selected.has(o.id)} onClick={() => click(o)} />
          ))}
        </div>
      </article>
    );
  }

  return (
    <article className="sb-card overflow-hidden px-3 py-2.5">
      <Header event={event} />
      <div className="mt-2 flex items-stretch gap-3">
        <div className="min-w-0 flex-1">
          <EntityLink event={event} side="home">
            <TeamRow name={event.home} abbr={event.homeAbbr} score={event.score?.[0]} />
          </EntityLink>
          <EntityLink event={event} side="away">
            <TeamRow name={event.away} abbr={event.awayAbbr} score={event.score?.[1]} />
          </EntityLink>
        </div>
        <Link to="/sports/$id" params={{ id: event.id }} className="flex w-10 shrink-0 flex-col items-center justify-center">
          {event.live ? (
            <span className="font-sub text-[0.6rem] text-lime">{event.minute}</span>
          ) : (
            <span className="font-heading text-[0.65rem] tracking-wide text-lime">VS</span>
          )}
        </Link>
        <div className={cn("grid w-[7.5rem] shrink-0 gap-1", draw ? "grid-rows-3" : "grid-rows-2")}>
          {ml.map((o, i) => (
            <button
              key={o.id}
              type="button"
              className={cn("sb-odd is-row h-8 justify-between px-2", selected.has(o.id) && "is-on")}
              onClick={() => click(o)}
            >
              <span className="text-[0.6rem] opacity-60">{draw ? ["1", "X", "2"][i] : i === 0 ? "1" : "2"}</span>
              <span className="text-sm font-semibold tabular-nums">{formatOdds(o.odds, format)}</span>
            </button>
          ))}
        </div>
      </div>
    </article>
  );
}

function Header({ event }: { event: SportEvent }) {
  return (
    <p className="font-sub flex items-center gap-1.5 text-[0.6rem] tracking-[0.12em] text-muted-foreground uppercase">
      {event.live ? (
        <span className="sb-live inline-flex items-center gap-1">
          <span className="sb-pip" />
          Live
        </span>
      ) : null}
      {leagueCrest(event.league) ? (
        <img src={leagueCrest(event.league)} alt="" className="size-3.5 object-contain" />
      ) : null}
      <span className="truncate">{event.league}</span>
      {!event.live ? <span className="ml-auto tabular-nums">{event.start}</span> : null}
    </p>
  );
}

function TeamRow({ name, abbr, score }: { name: string; abbr: string; score?: number }) {
  return (
    <div className="flex h-9 items-center gap-2">
      <TeamCrest name={name} abbr={abbr} className="size-7" />
      <span className="min-w-0 flex-1 truncate text-sm font-medium">{name}</span>
      {score != null ? <span className="w-5 text-right font-heading text-sm tabular-nums">{score}</span> : null}
    </div>
  );
}

function Portrait({ name, abbr }: { name: string; abbr: string }) {
  return (
    <div className="flex flex-col items-center gap-1">
      <TeamCrest name={name} abbr={abbr} className="size-16 rounded-full object-cover sm:size-20" />
      <span className="max-w-24 truncate text-center text-xs font-medium">{name}</span>
    </div>
  );
}

function EntityLink({ event, side, children }: { event: SportEvent; side: "home" | "away"; children: ReactNode }) {
  const name = side === "home" ? event.home : event.away;
  const slug = entitySlug(name);
  const to = isPlayerSport(event.sport) ? "/sports/player/$slug" : "/sports/club/$slug";
  return (
    <Link to={to} params={{ slug }} className="min-w-0 hover:opacity-90">
      {children}
    </Link>
  );
}

function OddBtn({
  o,
  format,
  on,
  onClick,
}: {
  o: Outcome;
  format: OddsFormat;
  on: boolean;
  onClick: () => void;
}) {
  return (
    <button type="button" className={cn("sb-odd", on && "is-on")} onClick={onClick}>
      <span className="max-w-full truncate text-[0.55rem] font-medium tracking-wide uppercase opacity-70">{o.label}</span>
      <span className="text-sm font-semibold">{formatOdds(o.odds, format)}</span>
    </button>
  );
}
