import { Link } from "@tanstack/react-router";
import { useState, type ReactNode } from "react";
import { cn } from "cn";
import { formatOdds, type OddsFormat } from "@/lib/odds";
import { TeamCrest } from "@/components/sports/team-crest";
import { leagueCrest } from "@/lib/club-crests";
import {
  hasDraw,
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
  const [more, setMore] = useState(false);
  const all = outcomesFor(event);
  const ml = all.filter((o) => o.market === "ml");
  const spread = all.filter((o) => o.market === "spread");
  const total = all.filter((o) => o.market === "total");
  const extra = all.filter((o) => o.market === "btts" || o.market === "dc");
  const draw = hasDraw(event);

  function click(o: Outcome) {
    onToggle(toSlipPick(event, o));
  }

  return (
    <article className="sb-card px-2.5 py-2">
      <div className="flex flex-col gap-2 md:flex-row md:items-center">
          <Link to="/sports/$id" params={{ id: event.id }} className="min-w-0 flex-1 hover:opacity-90">
          <p className="font-sub flex items-center gap-1.5 text-[0.6rem] tracking-[0.12em] text-muted-foreground uppercase">
            {event.live ? (
              <>
                <span className="sb-pip" />
                <span className="sb-live">Live {event.minute}</span>
              </>
            ) : (
              <span>{event.start}</span>
            )}
            <span className="inline-flex items-center gap-1 text-muted-foreground/70">
              · {leagueCrest(event.league) ? (
                <img src={leagueCrest(event.league)} alt="" className="inline size-3.5 object-contain" />
              ) : null}
              {event.league}
            </span>
          </p>
          <div className="mt-1 grid gap-0.5">
            <TeamRow abbr={event.homeAbbr} name={event.home} score={event.score?.[0]} />
            <TeamRow abbr={event.awayAbbr} name={event.away} score={event.score?.[1]} />
          </div>
          </Link>
          <div className="grid min-w-0 flex-[1.6] grid-cols-2 gap-1.5 md:grid-cols-3">
          <MarketCol title={draw ? "1X2" : "ML"} cols={draw ? 3 : 2} className="col-span-2 md:col-span-1">
            {ml.map((o) => (
              <OddBtn key={o.id} o={o} format={format} on={selected.has(o.id)} onClick={() => click(o)} />
            ))}
          </MarketCol>
          <MarketCol title="Spread" cols={2}>
            {spread.length ? (
              spread.map((o) => (
                <OddBtn key={o.id} o={o} format={format} on={selected.has(o.id)} onClick={() => click(o)} />
              ))
            ) : (
              <span className="col-span-2 self-center text-center text-[0.65rem] text-muted-foreground">—</span>
            )}
          </MarketCol>
          <MarketCol title="Total" cols={2}>
            {total.length ? (
              total.map((o) => (
                <OddBtn key={o.id} o={o} format={format} on={selected.has(o.id)} onClick={() => click(o)} />
              ))
            ) : (
              <span className="col-span-2 self-center text-center text-[0.65rem] text-muted-foreground">—</span>
            )}
          </MarketCol>
        </div>
      </div>
      {extra.length ? (
        <div className="mt-1.5">
          <button
            type="button"
            className="font-sub text-[0.6rem] tracking-[0.12em] text-muted-foreground uppercase hover:text-lime"
            onClick={() => setMore((v) => !v)}
          >
            {more ? "Hide" : `+${extra.length} markets`}
          </button>
          {more ? (
            <div className="mt-1.5 grid grid-cols-3 gap-1 sm:grid-cols-5">
              {extra.map((o) => (
                <OddBtn key={o.id} o={o} format={format} on={selected.has(o.id)} onClick={() => click(o)} />
              ))}
            </div>
          ) : null}
        </div>
      ) : null}
    </article>
  );
}

function MarketCol({
  title,
  cols,
  className,
  children,
}: {
  title: string;
  cols: 2 | 3;
  className?: string;
  children: ReactNode;
}) {
  return (
    <div className={cn("grid gap-0.5", className)}>
      <p className="font-sub text-center text-[0.55rem] tracking-[0.1em] text-muted-foreground uppercase">{title}</p>
      <div className={cn("grid gap-0.5", cols === 3 ? "grid-cols-3" : "grid-cols-2")}>{children}</div>
    </div>
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
      <span className="text-xs font-semibold sm:text-sm">{formatOdds(o.odds, format)}</span>
    </button>
  );
}

function TeamRow({ abbr, name, score }: { abbr: string; name: string; score?: number }) {
  return (
    <div className="flex items-center gap-1.5">
      <TeamCrest name={name} abbr={abbr} className="size-6 sm:size-7" />
      <span className="min-w-0 flex-1 truncate text-sm font-medium">{name}</span>
      {typeof score === "number" ? (
        <span className="w-5 text-right font-heading text-sm tabular-nums">{score}</span>
      ) : null}
    </div>
  );
}
