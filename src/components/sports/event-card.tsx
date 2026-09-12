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
    <article className="sb-card overflow-hidden px-2.5 py-2">
      <p className="font-sub mb-2 flex items-center justify-center gap-1.5 text-[0.6rem] tracking-[0.12em] text-muted-foreground uppercase">
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
      <Link to="/sports/$id" params={{ id: event.id }} className="hover:opacity-90">
        <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-2">
          <Side name={event.home} abbr={event.homeAbbr} score={event.score?.[0]} align="left" />
          <div className="px-1 text-center">
            {event.score ? (
              <p className="font-heading text-lg tabular-nums sm:text-xl">
                {event.score[0]}
                <span className="mx-0.5 text-lime">–</span>
                {event.score[1]}
              </p>
            ) : (
              <p className="font-heading text-xs tracking-[0.18em] text-lime">VS</p>
            )}
          </div>
          <Side name={event.away} abbr={event.awayAbbr} score={event.score?.[1]} align="right" />
        </div>
      </Link>
      <div className="mt-2 grid min-w-0 grid-cols-2 gap-1.5 md:grid-cols-3">
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

function Side({
  name,
  abbr,
  score,
  align,
}: {
  name: string;
  abbr: string;
  score?: number;
  align: "left" | "right";
}) {
  return (
    <div className={cn("flex min-w-0 items-center gap-1.5", align === "right" && "flex-row-reverse text-right")}>
      <TeamCrest name={name} abbr={abbr} className="size-8 sm:size-9" />
      <span className="min-w-0 truncate text-sm font-medium">{name}</span>
    </div>
  );
}
