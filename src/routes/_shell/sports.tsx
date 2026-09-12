import { useMemo, useState } from "react";
import { Link, createFileRoute } from "@tanstack/react-router";
import {
  RiBasketballLine,
  RiBoxingLine,
  RiFootballLine,
  RiGamepadLine,
  RiPingPongLine,
} from "@remixicon/react";
import { toast } from "sonner";
import { BluescreenTitle } from "@/components/brand/bluescreen-title";
import { PlayGate } from "@/components/games/play-gate";
import { TolsBreadcrumb } from "@/components/layout/tols-breadcrumb";
import { FieldBoard } from "@/components/sports/field-board";
import { type SlipMode } from "@/components/sports/bet-slip";
import { SlipDock } from "@/components/sports/slip-dock";
import { EventCard } from "@/components/sports/event-card";
import { FlexrixSportsFrame } from "@/components/sports/flexrix-frame";
import { placeSportBet } from "@/lib/casino-api";
import { cn } from "cn";
import { formatMoney } from "@/lib/format";
import { ODDS_FORMATS, type OddsFormat } from "@/lib/odds";
import {
  SPORT_META,
  featuredEvents,
  groupedByLeague,
  eventsBySport,
  type SlipPick,
  type SportKind,
} from "@/lib/sports-book";
import { useWallet } from "@/lib/wallet-context";

const SPORTS: Array<SportKind | "all"> = ["all", "football", "basketball", "tennis", "mma", "esports"];

function parseSport(value: unknown): SportKind | "all" {
  if (typeof value === "string" && (SPORTS as string[]).includes(value)) return value as SportKind | "all";
  return "all";
}

export const Route = createFileRoute("/_shell/sports")({
  component: SportsPage,
  validateSearch: (search: Record<string, unknown>): { sport?: SportKind | "all" } => {
    const sport = parseSport(search.sport);
    return sport === "all" ? {} : { sport };
  },
});

const FILTERS: { id: SportKind | "all"; label: string; Icon: typeof RiFootballLine }[] = [
  { id: "all", label: "All", Icon: RiFootballLine },
  { id: "football", label: "Football", Icon: RiFootballLine },
  { id: "basketball", label: "Basketball", Icon: RiBasketballLine },
  { id: "tennis", label: "Tennis", Icon: RiPingPongLine },
  { id: "mma", label: "MMA", Icon: RiBoxingLine },
  { id: "esports", label: "Esports", Icon: RiGamepadLine },
];

function SportsPage() {
  return (
    <PlayGate>
      <SportsBook />
    </PlayGate>
  );
}

function SportsBook() {
  const { sport: sportParam } = Route.useSearch();
  const navigate = Route.useNavigate();
  const sport = sportParam ?? "all";
  const { currency, applyBalances } = useWallet();
  const [amount, setAmount] = useState(10);
  const [picks, setPicks] = useState<SlipPick[]>([]);
  const [busy, setBusy] = useState(false);
  const [mode, setMode] = useState<SlipMode>("single");
  const [format, setFormat] = useState<OddsFormat>("decimal");

  const events = useMemo(() => eventsBySport(sport), [sport]);
  const groups = useMemo(() => groupedByLeague(events), [events]);
  const featured = useMemo(() => featuredEvents(), []);
  const selected = useMemo(() => new Set(picks.map((p) => p.id)), [picks]);

  function setSport(next: SportKind | "all") {
    void navigate({ search: next === "all" ? {} : { sport: next } });
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
    try {
      const res = await placeSportBet({
        data: {
          amount,
          currency,
          mode: picks.length > 1 && mode === "combo" ? "combo" : "single",
          legs: picks.map((p) => ({ eventId: p.eventId, market: p.market, selection: p.selection })),
        },
      });
      applyBalances(res.balances);
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
            Markets
          </BluescreenTitle>
          <p className="font-sub mt-1 text-sm text-muted-foreground">Live book in English. Wallet callbacks on TOLS.</p>
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

      <FlexrixSportsFrame />

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

      {sport === "all" ? (
        <section className="grid gap-2 md:grid-cols-2">
          {featured.map((ev) => (
            <Link key={ev.id} to="/sports/$id" params={{ id: ev.id }} className="sb-card text-left">
              <FieldBoard event={ev} />
            </Link>
          ))}
        </section>
      ) : (
        <section className="sb-card relative isolate overflow-hidden">
          <img src={SPORT_META[sport].field} alt="" className="h-20 w-full object-cover sm:h-24" />
          <div className="absolute inset-0 bg-linear-to-t from-background to-transparent" />
          <p className="font-heading absolute bottom-2 left-3 text-lg tracking-wide">{SPORT_META[sport].label}</p>
        </section>
      )}

      <div className="grid items-start gap-3 lg:grid-cols-[1fr_16.5rem]">
        <div className="grid gap-4 pb-16 lg:pb-0">
          {groups.map(([league, list]) => (
            <section key={league} className="grid gap-1.5">
              <h2 className="font-sub text-[0.65rem] tracking-[0.14em] text-muted-foreground uppercase">{league}</h2>
              {list.map((ev) => (
                <EventCard key={ev.id} event={ev} selected={selected} format={format} onToggle={toggle} />
              ))}
            </section>
          ))}
        </div>
        <SlipDock
          picks={picks}
          amount={amount}
          currency={currency}
          busy={busy}
          mode={picks.length < 2 ? "single" : mode}
          format={format}
          onMode={setMode}
          onAmount={setAmount}
          onRemove={(id) => setPicks((c) => c.filter((p) => p.id !== id))}
          onClear={() => setPicks([])}
          onPlace={() => void place()}
        />
      </div>
    </main>
  );
}
