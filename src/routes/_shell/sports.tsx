import { useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import {
  RiBaseballLine,
  RiBasketballLine,
  RiBookOpenLine,
  RiBoxingLine,
  RiCalendar2Line,
  RiFileList3Line,
  RiFireLine,
  RiFootballLine,
  RiGamepadLine,
  RiPingPongLine,
  RiSnowflakeLine,
  RiTrophyLine,
} from "@remixicon/react";
import { toast } from "sonner";
import { BluescreenTitle } from "@/components/brand/bluescreen-title";
import { PlayGate } from "@/components/games/play-gate";
import { TolsBreadcrumb } from "@/components/layout/tols-breadcrumb";
import { FieldBoard } from "@/components/sports/field-board";
import { type SlipMode } from "@/components/sports/bet-slip";
import { SlipDock } from "@/components/sports/slip-dock";
import { EventCard } from "@/components/sports/event-card";
import { placeSportBet } from "@/lib/casino-api";
import { cn } from "cn";
import { formatMoney } from "@/lib/format";
import type { Currency } from "@/lib/games-catalog";
import { newBetId, recordBet, useBetHistory } from "@/lib/bet-history";
import { ODDS_FORMATS, formatOdds, type OddsFormat } from "@/lib/odds";
import {
  SPORT_META,
  featuredEvents,
  groupedByLeague,
  eventsBySport,
  liveEvents,
  upcomingEvents,
  allLeagues,
  type SlipPick,
  type SportEvent,
  type SportKind,
} from "@/lib/sports-book";
import { useWallet } from "@/lib/wallet-context";

const SPORTS: Array<SportKind | "all"> = ["all", "football", "basketball", "tennis", "mma", "esports", "baseball", "hockey"];

export type SportsTab = "home" | "live" | "upcoming" | "leagues" | "bets" | "guide";

const TABS: { id: SportsTab; label: string; Icon: typeof RiFootballLine }[] = [
  { id: "home", label: "Home", Icon: RiFootballLine },
  { id: "live", label: "Live now", Icon: RiFireLine },
  { id: "upcoming", label: "Upcoming", Icon: RiCalendar2Line },
  { id: "leagues", label: "Leagues", Icon: RiTrophyLine },
  { id: "bets", label: "My bets", Icon: RiFileList3Line },
  { id: "guide", label: "Odds guide", Icon: RiBookOpenLine },
];

function parseSport(value: unknown): SportKind | "all" {
  if (typeof value === "string" && (SPORTS as string[]).includes(value)) return value as SportKind | "all";
  return "all";
}

function parseTab(value: unknown): SportsTab {
  if (typeof value === "string" && TABS.some((t) => t.id === value)) return value as SportsTab;
  return "home";
}

export const Route = createFileRoute("/_shell/sports")({
  component: SportsPage,
  validateSearch: (search: Record<string, unknown>): { sport?: SportKind | "all"; tab?: SportsTab } => {
    const sport = parseSport(search.sport);
    const tab = parseTab(search.tab);
    return sport === "all" && tab === "home"
      ? {}
      : { ...(sport !== "all" ? { sport } : {}), ...(tab !== "home" ? { tab } : {}) };
  },
});

const FILTERS: { id: SportKind | "all"; label: string; Icon: typeof RiFootballLine }[] = [
  { id: "all", label: "All", Icon: RiFootballLine },
  { id: "football", label: "Football", Icon: RiFootballLine },
  { id: "basketball", label: "Basketball", Icon: RiBasketballLine },
  { id: "tennis", label: "Tennis", Icon: RiPingPongLine },
  { id: "mma", label: "MMA", Icon: RiBoxingLine },
  { id: "esports", label: "Esports", Icon: RiGamepadLine },
  { id: "baseball", label: "Baseball", Icon: RiBaseballLine },
  { id: "hockey", label: "Ice hockey", Icon: RiSnowflakeLine },
];

function SportsPage() {
  return (
    <PlayGate>
      <SportsBook />
    </PlayGate>
  );
}

function SportsBook() {
  const { sport: sportParam, tab: tabParam } = Route.useSearch();
  const navigate = Route.useNavigate();
  const sport = sportParam ?? "all";
  const tab = tabParam ?? "home";
  const { currency, applyBalances } = useWallet();
  const [amount, setAmount] = useState(0);
  const [picks, setPicks] = useState<SlipPick[]>([]);
  const [busy, setBusy] = useState(false);
  const [mode, setMode] = useState<SlipMode>("single");
  const [systemK, setSystemK] = useState(2);
  const [format, setFormat] = useState<OddsFormat>("decimal");

  const events = useMemo(() => eventsBySport(sport), [sport]);
  const groups = useMemo(() => groupedByLeague(events), [events]);
  const featured = useMemo(() => featuredEvents(), []);
  const live = useMemo(() => liveEvents(), []);
  const upcoming = useMemo(() => upcomingEvents(), []);
  const leagues = useMemo(() => allLeagues(), []);
  const selected = useMemo(() => new Set(picks.map((p) => p.id)), [picks]);

  function setSport(next: SportKind | "all") {
    void navigate({ search: { ...(next !== "all" ? { sport: next } : {}), ...(tab !== "home" ? { tab } : {}) } });
  }

  function setTab(next: SportsTab) {
    void navigate({ search: { ...(sport !== "all" ? { sport } : {}), ...(next !== "home" ? { tab: next } : {}) } });
  }

  function toggle(pick: SlipPick) {
    setPicks((cur) => {
      if (cur.some((p) => p.id === pick.id)) return cur.filter((p) => p.id !== pick.id);
      const sameMarket = cur.filter((p) => !(p.eventId === pick.eventId && p.market === pick.market));
      return [...sameMarket, pick];
    });
  }

  async function place() {
    if (!picks.length) return;
    setBusy(true);
    const ticketMode: "single" | "combo" | "system" =
      mode === "combo" && picks.length >= 2 ? "combo" : mode === "system" && picks.length >= 3 ? "system" : "single";
    const stakeTotal = ticketMode === "single" ? amount * picks.length : amount;
    try {
      const res = await placeSportBet({
        data: {
          amount,
          currency,
          mode: ticketMode,
          systemK: ticketMode === "system" ? Math.min(systemK, picks.length - 1) : undefined,
          legs: picks.map((p) => ({ eventId: p.eventId, market: p.market, selection: p.selection })),
        },
      });
      applyBalances(res.balances);
      recordBet({
        id: newBetId(),
        gameId: `sports-${ticketMode}`,
        title:
          picks.length === 1
            ? picks[0]!.fixture
            : `${picks[0]!.fixture} +${picks.length - 1}`,
        kind: "sports",
        win: res.payout > 0,
        label:
          ticketMode === "system"
            ? `System ${Math.min(systemK, picks.length - 1)}/${picks.length} · ${"hits" in res ? res.hits : 0} hits`
            : ticketMode === "combo"
              ? `Acca · ${picks.length} legs`
              : picks[0]!.marketLabel,
        stake: stakeTotal,
        payout: res.payout,
        multiplier: stakeTotal > 0 ? res.payout / stakeTotal : 0,
        currency,
        fair: null,
        view: null,
        at: Date.now(),
      });
      if (res.payout > 0) toast.success(`Won ${formatMoney(res.payout, currency)} ${currency}`);
      else toast.message("Ticket settled · no hit");
      setPicks([]);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Bet failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="mx-auto flex w-full max-w-6xl flex-col gap-4">
      <TolsBreadcrumb items={[{ label: "Sports", to: "/sports" }]} />
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="font-sub text-[0.65rem] tracking-[0.14em] text-lime uppercase">Sportsbook</p>
          <BluescreenTitle as="h1" className="text-3xl font-bold md:text-4xl">
            Sports
          </BluescreenTitle>
          <p className="font-sub mt-1 text-sm text-muted-foreground">
            7 sports · 8 market families · singles, accas and system tickets · 6 odds systems.
          </p>
        </div>
        <div className="flex rounded-lg bg-muted p-0.5">
          {ODDS_FORMATS.map((f) => (
            <button
              key={f.id}
              type="button"
              className={cn(
                "h-8 rounded-md px-2.5 text-xs font-medium",
                format === f.id ? "bg-lime text-black" : "text-muted-foreground hover:text-foreground",
              )}
              onClick={() => setFormat(f.id)}
            >
              {f.label}
            </button>
          ))}
        </div>
      </header>

      <nav className="flex gap-1 overflow-x-auto pb-0.5" aria-label="Sports sections">
        {TABS.map((t) => {
          const on = tab === t.id;
          return (
            <button
              key={t.id}
              type="button"
              onClick={() => setTab(t.id)}
              className={cn(
                "inline-flex h-9 shrink-0 items-center gap-1.5 rounded-full px-3 text-xs font-semibold",
                on ? "bg-lime text-black" : "bg-muted text-muted-foreground hover:text-foreground",
              )}
            >
              <t.Icon className="size-3.5" />
              {t.label}
            </button>
          );
        })}
      </nav>

      <div className="flex gap-1 overflow-x-auto pb-0.5">
        {FILTERS.map((f) => {
          const on = sport === f.id;
          return (
            <button
              key={f.id}
              type="button"
              onClick={() => setSport(f.id)}
              className={cn(
                "inline-flex h-8 shrink-0 items-center gap-1.5 rounded-full px-2.5 text-xs font-medium",
                on ? "bg-lime text-black" : "bg-muted text-muted-foreground hover:text-foreground",
              )}
            >
              <f.Icon className="size-3.5" />
              {f.label}
            </button>
          );
        })}
      </div>

      {sport !== "all" ? (
        <section className="sb-card relative isolate overflow-hidden">
          <img src={SPORT_META[sport].field} alt="" className="h-20 w-full object-cover sm:h-24" />
          <div className="absolute inset-0 bg-linear-to-t from-background to-transparent" />
          <p className="font-heading absolute bottom-2 left-3 text-lg tracking-wide">{SPORT_META[sport].label}</p>
        </section>
      ) : null}

      <div className="grid items-start gap-3 lg:grid-cols-[1fr_16.5rem]">
        <div className="grid gap-4 pb-16 lg:pb-0">
          {tab === "home" ? (
            <>
              {sport === "all" ? (
                <section className="grid gap-2 md:grid-cols-2">
                  {featured.map((ev) => (
                    <div key={ev.id} className="sb-card text-left">
                      <FieldBoard event={ev} />
                    </div>
                  ))}
                </section>
              ) : null}
              {groups.map(([league, list]) => (
                <section key={league} className="grid gap-1.5">
                  <h2 className="font-sub text-[0.65rem] tracking-[0.14em] text-muted-foreground uppercase">{league}</h2>
                  {list.map((ev) => (
                    <EventCard key={ev.id} event={ev} selected={selected} format={format} onToggle={toggle} />
                  ))}
                </section>
              ))}
            </>
          ) : tab === "live" ? (
            <EventList
              title="In play now"
              empty="No live events right now."
              events={live.filter((e) => sport === "all" || e.sport === sport)}
              selected={selected}
              format={format}
              onToggle={toggle}
            />
          ) : tab === "upcoming" ? (
            <EventList
              title="Upcoming fixtures"
              empty="No upcoming fixtures in this sport."
              events={upcoming.filter((e) => sport === "all" || e.sport === sport)}
              selected={selected}
              format={format}
              onToggle={toggle}
            />
          ) : tab === "leagues" ? (
            <LeaguesTab
              leagues={leagues.filter((l) => sport === "all" || l.sport === sport)}
              selected={selected}
              format={format}
              onToggle={toggle}
            />
          ) : tab === "bets" ? (
            <MyBetsTab />
          ) : (
            <GuideTab format={format} />
          )}
        </div>
        <SlipDock
          picks={picks}
          amount={amount}
          currency={currency}
          busy={busy}
          mode={picks.length < 2 ? "single" : mode}
          systemK={systemK}
          format={format}
          onMode={setMode}
          onSystemK={setSystemK}
          onAmount={setAmount}
          onRemove={(id) => setPicks((cur) => cur.filter((p) => p.id !== id))}
          onClear={() => setPicks([])}
          onPlace={() => void place()}
        />
      </div>
    </main>
  );
}

function EventList({
  title,
  empty,
  events,
  selected,
  format,
  onToggle,
}: {
  title: string;
  empty: string;
  events: SportEvent[];
  selected: Set<string>;
  format: OddsFormat;
  onToggle: (p: SlipPick) => void;
}) {
  if (!events.length) return <EmptyTab label={empty} />;
  return (
    <section className="grid gap-1.5">
      <h2 className="font-sub text-[0.65rem] tracking-[0.14em] text-muted-foreground uppercase">{title}</h2>
      {events.map((ev) => (
        <EventCard key={ev.id} event={ev} selected={selected} format={format} onToggle={onToggle} />
      ))}
    </section>
  );
}

function LeaguesTab({
  leagues,
  selected,
  format,
  onToggle,
}: {
  leagues: { league: string; sport: SportKind; events: SportEvent[] }[];
  selected: Set<string>;
  format: OddsFormat;
  onToggle: (p: SlipPick) => void;
}) {
  if (!leagues.length) return <EmptyTab label="No leagues in this sport yet." />;
  return (
    <section className="grid gap-4">
      {leagues.map((l) => (
        <div key={l.league} className="grid gap-1.5">
          <h2 className="font-sub text-[0.65rem] tracking-[0.14em] text-muted-foreground uppercase">
            {l.league} · {SPORT_META[l.sport].label}
          </h2>
          {l.events.map((ev) => (
            <EventCard key={ev.id} event={ev} selected={selected} format={format} onToggle={onToggle} />
          ))}
        </div>
      ))}
    </section>
  );
}

function MyBetsTab() {
  const rounds = useBetHistory().filter((r) => r.gameId.startsWith("sports-"));
  if (!rounds.length) {
    return <EmptyTab label="No sports tickets yet. Place your first bet from any market." />;
  }
  return (
    <section className="grid gap-2">
      <h2 className="font-sub text-[0.65rem] tracking-[0.14em] text-muted-foreground uppercase">Sports tickets</h2>
      {rounds.map((r) => (
        <article key={r.id} className="sb-card flex items-center justify-between gap-3 px-3 py-2.5">
          <div className="min-w-0">
            <p className="truncate text-sm font-medium">{r.title}</p>
            <p className="truncate text-xs text-muted-foreground">{r.label}</p>
          </div>
          <div className="shrink-0 text-right">
            <p className={cn("font-heading text-sm", r.win ? "text-lime" : "text-muted-foreground")}>
              {r.win ? "WON" : "LOST"}
            </p>
            <p className="text-[0.7rem] tabular-nums text-muted-foreground">
              {formatMoney(r.stake, r.currency as Currency)} → {formatMoney(r.payout, r.currency as Currency)}
            </p>
          </div>
        </article>
      ))}
    </section>
  );
}

function GuideTab({ format }: { format: OddsFormat }) {
  const SYSTEM_NAMES: Record<OddsFormat, string> = {
    decimal: "Decimal (European)",
    american: "American (US)",
    fractional: "Fractional (UK)",
    hongkong: "Hong Kong",
    malay: "Malay",
    indonesian: "Indonesian",
  };
  return (
    <section className="grid gap-4">
      <div className="sb-card grid gap-3 p-4">
        <h2 className="font-heading text-sm tracking-wide">Odds systems</h2>
        <p className="text-xs text-muted-foreground">
          Same price, six notations. Switch anytime from the header — every board updates instantly.
        </p>
        <div className="grid gap-2 sm:grid-cols-2">
          {ODDS_FORMATS.map((f) => (
            <div key={f.id} className="flex items-center justify-between rounded-lg bg-muted/50 px-3 py-2">
              <div>
                <p className="text-xs font-semibold">{SYSTEM_NAMES[f.id]}</p>
                <p className="text-[0.65rem] tabular-nums text-muted-foreground">2.25 shows as {formatOdds(2.25, f.id)}</p>
              </div>
              {format === f.id ? <span className="text-[0.6rem] font-bold text-lime">ACTIVE</span> : null}
            </div>
          ))}
        </div>
      </div>
      <div className="sb-card grid gap-3 p-4">
        <h2 className="font-heading text-sm tracking-wide">Market families</h2>
        <p className="text-xs text-muted-foreground">Every sport runs its own mix. Open an event for the full book.</p>
        <ul className="grid gap-1.5 text-xs">
          {[
            ["1X2", "Match result — home, draw or away. Football and hockey."],
            ["Moneyline", "Two-way winner. Basketball, tennis, MMA, esports, baseball."],
            ["Spread / handicap", "One side gets a virtual head start (e.g. -4.5 points)."],
            ["Total (O/U)", "Combined score over or under a line (e.g. 2.5 goals)."],
            ["BTTS", "Both teams to score — yes/no. Football."],
            ["Double chance", "Cover two of three outcomes (1X, 12, X2)."],
            ["Odd/Even", "Total score parity."],
            ["Draw no bet", "Two-way price on the winner — draw refunds the stake."],
            ["Correct score", "Exact final score at long odds."],
          ].map(([name, desc]) => (
            <li key={name} className="flex gap-2 rounded-lg bg-muted/50 px-3 py-2">
              <span className="shrink-0 font-semibold text-lime">{name}</span>
              <span className="text-muted-foreground">{desc}</span>
            </li>
          ))}
        </ul>
      </div>
      <div className="sb-card grid gap-3 p-4">
        <h2 className="font-heading text-sm tracking-wide">Ticket types</h2>
        <ul className="grid gap-1.5 text-xs">
          {[
            ["Singles", "One stake per pick. Each leg settles on its own."],
            ["Acca (combo)", "All legs must win. Odds multiply — one stake, big price."],
            ["System", "Cover combinations: 2/3 means every 2-leg combo of your 3 picks. One miss doesn't kill the whole ticket."],
          ].map(([name, desc]) => (
            <li key={name} className="flex gap-2 rounded-lg bg-muted/50 px-3 py-2">
              <span className="shrink-0 font-semibold text-lime">{name}</span>
              <span className="text-muted-foreground">{desc}</span>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

function EmptyTab({ label }: { label: string }) {
  return (
    <section className="sb-card grid place-items-center p-8 text-center">
      <p className="text-sm text-muted-foreground">{label}</p>
    </section>
  );
}