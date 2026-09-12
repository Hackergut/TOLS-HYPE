import { useMemo, useState } from "react";
import { Link, createFileRoute } from "@tanstack/react-router";
import { toast } from "sonner";
import { BluescreenTitle } from "@/components/brand/bluescreen-title";
import { PlayGate } from "@/components/games/play-gate";
import { TolsBreadcrumb } from "@/components/layout/tols-breadcrumb";
import { EventCard } from "@/components/sports/event-card";
import { MatchStage } from "@/components/sports/match-stage";
import { StatBlock } from "@/components/sports/stat-bars";
import { type SlipMode } from "@/components/sports/bet-slip";
import { SlipDock } from "@/components/sports/slip-dock";
import { placeSportBet } from "@/lib/casino-api";
import { formatMoney } from "@/lib/format";
import { matchLive } from "@/lib/match-live";
import { type OddsFormat } from "@/lib/odds";
import { eventById, type SlipPick } from "@/lib/sports-book";
import { useWallet } from "@/lib/wallet-context";
import { TeamCrest } from "@/components/sports/team-crest";

export const Route = createFileRoute("/_shell/sports/$id")({
  component: MatchPage,
});

function MatchPage() {
  const { id } = Route.useParams();
  const event = eventById(id);
  if (!event) {
    return (
      <main className="mx-auto max-w-xl py-16 text-center">
        <p className="text-muted-foreground">Match not on the board.</p>
        <Link to="/sports" className="mt-3 inline-block text-sm text-lime">
          Back to markets
        </Link>
      </main>
    );
  }
  return (
    <PlayGate>
      <MatchCenter />
    </PlayGate>
  );
}

function MatchCenter() {
  const { id } = Route.useParams();
  const event = eventById(id)!;
  const live = useMemo(() => matchLive(event), [event]);
  const { currency, applyBalances } = useWallet();
  const [tab, setTab] = useState<"live" | "bet">(event.live ? "live" : "bet");
  const [picks, setPicks] = useState<SlipPick[]>([]);
  const [amount, setAmount] = useState(10);
  const [busy, setBusy] = useState(false);
  const [mode, setMode] = useState<SlipMode>("single");
  const [format] = useState<OddsFormat>("decimal");
  const selected = useMemo(() => new Set(picks.map((p) => p.id)), [picks]);

  function toggle(pick: SlipPick) {
    setPicks((cur) => {
      if (cur.some((p) => p.id === pick.id)) return cur.filter((p) => p.id !== pick.id);
      const same = cur.filter((p) => !(p.eventId === pick.eventId && p.market === pick.market));
      return [...same, pick];
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
    <main className="relative mx-auto flex w-full max-w-3xl flex-col gap-4">
      <Link
        to="/sports"
        className="absolute top-0 left-0 z-1 grid size-10 place-items-center rounded-full text-lg text-muted-foreground md:hidden"
        aria-label="Back"
      >
        ‹
      </Link>
      <div className="hidden md:block">
      <TolsBreadcrumb
        items={[
          { label: "Sports", to: "/sports" },
          { label: event.league },
        ]}
      />
      </div>
      <header className="text-center">
        {event.live ? (
          <p className="mb-2 inline-flex items-center gap-1 rounded-full bg-lime px-2 py-0.5 text-[0.65rem] font-bold tracking-wide text-black uppercase">
            Live
          </p>
        ) : null}
        <BluescreenTitle as="h1" className="text-2xl font-bold md:text-3xl">
          {event.league}
        </BluescreenTitle>
        <p className="font-sub mt-1 text-sm text-muted-foreground">{live.stage}</p>
      </header>

      <section className="sb-card px-4 py-5">
        <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-3">
          <Crest abbr={event.homeAbbr} name={event.home} />
          <div className="text-center">
            {event.score ? (
              <p className="font-heading text-3xl tracking-wide tabular-nums sm:text-4xl md:text-5xl">
                {event.score[0]}
                <span className="mx-1 text-lime">:</span>
                {event.score[1]}
              </p>
            ) : (
              <p className="font-heading text-xl tracking-[0.2em] text-lime">VS</p>
            )}
            {live.ht ? <p className="text-[0.7rem] text-muted-foreground">({live.ht[0]} – {live.ht[1]})</p> : null}
            <p className="font-sub mt-1 text-[0.65rem] tracking-[0.12em] text-muted-foreground uppercase">
              {event.live ? event.minute : event.start}
            </p>
          </div>
          <Crest abbr={event.awayAbbr} name={event.away} />
        </div>
      </section>

      <div className="sticky top-12 z-20 -mx-3 flex justify-center gap-2 bg-background/80 px-3 py-2 backdrop-blur-xl md:static md:mx-0 md:bg-transparent md:p-0 md:backdrop-blur-none">
        {(["live", "bet"] as const).map((t) => (
          <button
            key={t}
            type="button"
            className={cn(
              "h-9 min-w-20 rounded-full px-4 text-xs font-semibold tracking-wide uppercase",
              tab === t ? "bg-lime text-black" : "bg-muted text-muted-foreground",
            )}
            onClick={() => setTab(t)}
          >
            {t === "live" ? "Live" : "1X2"}
          </button>
        ))}
      </div>

      {tab === "live" ? (
        <div className="grid gap-3">
          <MatchStage event={event} live={live} />
          {live.events.length ? (
            <section className="sb-card px-3 py-3">
              <h3 className="font-sub mb-2 text-[0.65rem] tracking-[0.14em] text-muted-foreground uppercase">Feed</h3>
              <ul className="grid gap-1.5 text-sm">
                {live.events.map((e) => (
                  <li key={`${e.minute}-${e.player}`} className="flex justify-between gap-2">
                    <span className={e.team === "home" ? "text-lime" : "text-[#904bf9]"}>
                      {e.kind === "goal" ? "Goal" : e.kind === "card" ? "Card" : "Sub"} · {e.player}
                    </span>
                    <span className="tabular-nums text-muted-foreground">{e.minute}</span>
                  </li>
                ))}
              </ul>
            </section>
          ) : null}
          <StatBlock title="General" rows={live.general} />
          <StatBlock title="Offense" rows={live.offense} />
          <StatBlock title="Defense" rows={live.defense} />
          {live.mma ? <StatBlock title="Target" rows={live.mma.target} /> : null}
        </div>
      ) : (
        <div className="grid gap-3 pb-16 lg:grid-cols-[1fr_16rem] lg:pb-0">
          <EventCard event={event} selected={selected} format={format} onToggle={toggle} />
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
      )}
    </main>
  );
}

function Crest({ abbr, name }: { abbr: string; name: string }) {
  return (
    <div className="min-w-0 text-center">
      <TeamCrest name={name} abbr={abbr} className="mx-auto size-14" />
      <p className="mt-2 truncate text-sm font-medium">{name}</p>
    </div>
  );
}
