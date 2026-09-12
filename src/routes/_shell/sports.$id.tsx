import { useMemo, useState } from "react";
import { Link, createFileRoute } from "@tanstack/react-router";
import { toast } from "sonner";
import { cn } from "cn";
import { BluescreenTitle } from "@/components/brand/bluescreen-title";
import { PlayGate } from "@/components/games/play-gate";
import { TolsBreadcrumb } from "@/components/layout/tols-breadcrumb";
import { MatchStage } from "@/components/sports/match-stage";
import { StatBlock } from "@/components/sports/stat-bars";
import { type SlipMode } from "@/components/sports/bet-slip";
import { SlipDock } from "@/components/sports/slip-dock";
import { TeamCrest } from "@/components/sports/team-crest";
import { placeSportBet } from "@/lib/casino-api";
import { formatMoney } from "@/lib/format";
import { formatOdds, type OddsFormat } from "@/lib/odds";
import { marketsGrouped, matchDossier } from "@/lib/match-dossier";
import { leagueCrest } from "@/lib/club-crests";
import { entitySlug, eventById, isPlayerSport, toSlipPick, type SlipPick } from "@/lib/sports-book";
import { useWallet } from "@/lib/wallet-context";

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
  const d = useMemo(() => matchDossier(event), [event]);
  const groups = useMemo(() => marketsGrouped(event), [event]);
  const { currency, applyBalances } = useWallet();
  const [section, setSection] = useState<"odds" | "live" | "stats" | "lineups" | "h2h">("odds");
  const [picks, setPicks] = useState<SlipPick[]>([]);
  const [amount, setAmount] = useState(0);
  const [busy, setBusy] = useState(false);
  const [mode, setMode] = useState<SlipMode>("single");
  const [format] = useState<OddsFormat>("decimal");
  const selected = useMemo(() => new Set(picks.map((p) => p.id)), [picks]);

  function toggle(pick: SlipPick) {
    setPicks((cur) => {
      if (cur.some((p) => p.id === pick.id)) return cur.filter((p) => p.id !== pick.id);
      const same = cur.filter((p) => !(p.eventId === pick.eventId && p.market === pick.market && p.selection === pick.selection));
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

  const { live, winProb } = d;
  const wp = winProb.home + winProb.draw + winProb.away || 1;

  return (
    <main className="mx-auto flex w-full max-w-6xl flex-col gap-4 pb-24 lg:pb-8">
      <TolsBreadcrumb items={[{ label: "Sports", to: "/sports" }, { label: event.league }, { label: `${event.homeAbbr}–${event.awayAbbr}` }]} />

      <section className="sb-card overflow-hidden px-4 py-5">
        <p className="font-sub mb-3 flex items-center justify-center gap-1.5 text-[0.65rem] tracking-[0.14em] text-muted-foreground uppercase">
          {event.live ? <span className="sb-live">Live {event.minute}</span> : <span>{event.start}</span>}
          <span className="inline-flex items-center gap-1">
            · {leagueCrest(event.league) ? <img src={leagueCrest(event.league)} alt="" className="size-3.5 object-contain" /> : null}
            {event.league}
          </span>
        </p>
        <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-3">
          <Crest event={event} side="home" />
          <div className="px-2 text-center">
            {event.score ? (
              <p className="font-heading text-4xl tabular-nums md:text-5xl">
                {event.score[0]}
                <span className="mx-1 text-lime">–</span>
                {event.score[1]}
              </p>
            ) : (
              <p className="font-heading text-xl tracking-[0.2em] text-lime">VS</p>
            )}
            {live.ht ? (
              <p className="text-[0.7rem] text-muted-foreground">
                HT {live.ht[0]}–{live.ht[1]}
              </p>
            ) : null}
            <p className="font-sub mt-1 text-[0.65rem] tracking-[0.12em] text-muted-foreground uppercase">{live.stage}</p>
          </div>
          <Crest event={event} side="away" />
        </div>
        <div className="mt-4 flex h-2 overflow-hidden rounded-full">
          <div className="bg-lime" style={{ width: `${(winProb.home / wp) * 100}%` }} />
          {winProb.draw > 0 ? <div className="bg-white/30" style={{ width: `${(winProb.draw / wp) * 100}%` }} /> : null}
          <div style={{ width: `${(winProb.away / wp) * 100}%`, background: "#904bf9" }} />
        </div>
        <div className="mt-1 flex justify-between text-[0.65rem] tabular-nums text-muted-foreground">
          <span className="text-lime">{winProb.home}%</span>
          {winProb.draw > 0 ? <span>Draw {winProb.draw}%</span> : <span />}
          <span style={{ color: "#904bf9" }}>{winProb.away}%</span>
        </div>
      </section>

      <div className="no-scrollbar -mx-3 flex gap-1 overflow-x-auto px-3 md:mx-0 md:flex-wrap md:px-0">
        {(["odds", "live", "stats", "lineups", "h2h"] as const).map((t) => (
          <button
            key={t}
            type="button"
            className={cn(
              "h-9 shrink-0 rounded-full px-4 text-xs font-semibold tracking-wide uppercase",
              section === t ? "bg-lime text-black" : "bg-muted text-muted-foreground",
            )}
            onClick={() => setSection(t)}
          >
            {t === "odds" ? "All odds" : t === "h2h" ? "H2H" : t}
          </button>
        ))}
      </div>

      {section === "odds" ? (
        <div className="grid gap-4 lg:grid-cols-[1fr_18rem]">
          <div className="grid gap-3">
            {groups.map((g) => (
              <section key={g.title} className="sb-card px-3 py-3">
                <h3 className="font-sub mb-2 text-[0.65rem] tracking-[0.14em] text-muted-foreground uppercase">{g.title}</h3>
                <div className="grid grid-cols-2 gap-1.5 sm:grid-cols-3">
                  {g.items.map((o) => (
                    <button
                      key={o.id}
                      type="button"
                      className={cn("sb-odd", selected.has(o.id) && "is-on")}
                      onClick={() => toggle(toSlipPick(event, o))}
                    >
                      <span className="truncate text-[0.55rem] uppercase opacity-70">{o.label}</span>
                      <span className="text-sm font-semibold">{formatOdds(o.odds, format)}</span>
                    </button>
                  ))}
                </div>
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
            onRemove={(pid) => setPicks((c) => c.filter((p) => p.id !== pid))}
            onClear={() => setPicks([])}
            onPlace={() => void place()}
          />
        </div>
      ) : null}

      {section === "live" ? (
        <div className="grid gap-3 lg:grid-cols-2">
          <MatchStage event={event} live={live} />
          <ShotMap shots={d.shots} />
          {live.events.length ? (
            <section className="sb-card px-3 py-3 lg:col-span-2">
              <h3 className="font-sub mb-2 text-[0.65rem] tracking-[0.14em] text-muted-foreground uppercase">Match feed</h3>
              <ul className="grid gap-1.5 text-sm">
                {live.events.map((e) => (
                  <li key={`${e.minute}-${e.player}-${e.kind}`} className="flex justify-between gap-2">
                    <span className={e.team === "home" ? "text-lime" : "text-[#904bf9]"}>
                      {e.kind === "goal" ? "Goal" : e.kind === "card" ? "Card" : "Sub"} · {e.player}
                    </span>
                    <span className="tabular-nums text-muted-foreground">{e.minute}</span>
                  </li>
                ))}
              </ul>
            </section>
          ) : (
            <p className="text-sm text-muted-foreground">Kick-off analytics load with the first event.</p>
          )}
        </div>
      ) : null}

      {section === "stats" ? (
        <div className="grid gap-3 md:grid-cols-2">
          <StatBlock title="General" rows={live.general} />
          <StatBlock title="Offense" rows={live.offense} />
          <StatBlock title="Defense" rows={live.defense} />
          <StatBlock title="Advanced" rows={d.extra} />
          {live.mma ? <StatBlock title="Target" rows={live.mma.target} /> : null}
        </div>
      ) : null}

      {section === "lineups" ? (
        <div className="grid gap-3 md:grid-cols-2">
          <XICard title={event.home} rows={d.xi.home} accent="lime" />
          <XICard title={event.away} rows={d.xi.away} accent="violet" />
          <FormRow label={event.home} form={d.form.home} />
          <FormRow label={event.away} form={d.form.away} />
        </div>
      ) : null}

      {section === "h2h" ? (
        <section className="sb-card px-3 py-3">
          <h3 className="font-sub mb-3 text-[0.65rem] tracking-[0.14em] text-muted-foreground uppercase">Last meetings</h3>
          <ul className="grid gap-2">
            {d.h2h.map((r) => (
              <li key={r.when} className="flex items-center justify-between rounded-lg bg-muted px-3 py-2 text-sm">
                <span className="text-muted-foreground">{r.when}</span>
                <span className="font-heading tabular-nums">
                  {event.homeAbbr} {r.home}–{r.away} {event.awayAbbr}
                </span>
                <span className={r.winner === "draw" ? "text-muted-foreground" : r.winner === "home" ? "text-lime" : "text-[#904bf9]"}>
                  {r.winner === "draw" ? "Draw" : r.winner === "home" ? event.homeAbbr : event.awayAbbr}
                </span>
              </li>
            ))}
          </ul>
        </section>
      ) : null}
    </main>
  );
}

function Crest({ event, side }: { event: import("@/lib/sports-book").SportEvent; side: "home" | "away" }) {
  const name = side === "home" ? event.home : event.away;
  const abbr = side === "home" ? event.homeAbbr : event.awayAbbr;
  const slug = entitySlug(name);
  const to = isPlayerSport(event.sport) ? "/sports/player/$slug" : "/sports/club/$slug";
  return (
    <Link to={to} params={{ slug }} className="min-w-0 text-center hover:opacity-90">
      <TeamCrest name={name} abbr={abbr} className="mx-auto size-16 sm:size-20" />
      <p className="mt-2 truncate text-sm font-medium">{name}</p>
    </Link>
  );
}

function ShotMap({ shots }: { shots: { x: number; y: number; team: "home" | "away"; on: boolean }[] }) {
  return (
    <section className="sb-card px-3 py-3">
      <h3 className="font-sub mb-2 text-center text-[0.65rem] tracking-[0.14em] text-muted-foreground uppercase">Shot map</h3>
      <svg viewBox="0 0 100 100" className="mx-auto block aspect-[3/2] w-full max-w-md rounded-lg bg-[#143018]">
        <rect x="2" y="2" width="96" height="96" fill="none" stroke="#00ffbd" strokeWidth="0.6" />
        <line x1="50" y1="2" x2="50" y2="98" stroke="#cdf32b" strokeWidth="0.4" opacity="0.6" />
        {shots.map((s, i) => (
          <circle
            key={i}
            cx={s.x}
            cy={s.y}
            r={s.on ? 1.8 : 1.2}
            fill={s.team === "home" ? "#00ffbd" : "#904bf9"}
            opacity={s.on ? 1 : 0.45}
          />
        ))}
      </svg>
    </section>
  );
}

function XICard({ title, rows, accent }: { title: string; rows: { num: number; name: string; pos: string }[]; accent: "lime" | "violet" }) {
  return (
    <section className="sb-card px-3 py-3">
      <h3 className="font-sub mb-2 text-[0.65rem] tracking-[0.14em] text-muted-foreground uppercase">{title}</h3>
      <ul className="grid gap-1 text-sm">
        {rows.map((p) => (
          <li key={`${p.num}-${p.name}`} className="flex items-center gap-2">
            <span className={cn("w-6 tabular-nums", accent === "lime" ? "text-lime" : "text-[#904bf9]")}>{p.num}</span>
            <span className="min-w-0 flex-1 truncate">{p.name}</span>
            <span className="text-[0.65rem] text-muted-foreground">{p.pos}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}

function FormRow({ label, form }: { label: string; form: ("W" | "D" | "L")[] }) {
  return (
    <div className="sb-card flex items-center justify-between px-3 py-3">
      <span className="truncate text-sm">{label}</span>
      <span className="flex gap-1">
        {form.map((c, i) => (
          <span
            key={i}
            className={cn(
              "grid size-6 place-items-center rounded text-[0.65rem] font-bold",
              c === "W" && "bg-lime text-black",
              c === "D" && "bg-muted text-muted-foreground",
              c === "L" && "bg-destructive/80 text-white",
            )}
          >
            {c}
          </span>
        ))}
      </span>
    </div>
  );
}
