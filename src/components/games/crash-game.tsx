import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { PlayGate } from "@/components/games/play-gate";
import { GameShell } from "@/components/games/game-shell";
import { LiveBetDesk } from "@/components/games/live-bet-desk";
import { crashMultiplierAt } from "@/lib/rng";
import { crashGrowth } from "@/lib/live-table";
import { HistoryPill } from "@/components/games/bet-pills";
import { formatMoney, formatMultiplier } from "@/lib/format";
import { useWallet } from "@/lib/wallet-context";
import { cashLive, liveTable, placeLiveBet, type LiveSnap, type LiveTapeBet } from "@/lib/live-room";
import { playSfx } from "@/lib/game-sound";
import { getGame, type Currency } from "@/lib/games-catalog";
import { useGameTable } from "@/components/games/game-table";

type Phase = "betting" | "running" | "crashed" | "cashed";

export function CrashGame({ gameId }: { gameId: string }) {
  return (
    <PlayGate>
      <CrashTable gameId={gameId} />
    </PlayGate>
  );
}

function CrashTable({ gameId }: { gameId: string }) {
  const { currency, balances, applyBalances } = useWallet();
  const { reportRound } = useGameTable();
  const growth = crashGrowth(gameId);
  const edge = getGame(gameId)?.edge ?? 0.04;
  const [phase, setPhase] = useState<Phase>("betting");
  const [display, setDisplay] = useState(1);
  const [crashAt, setCrashAt] = useState<number | null>(null);
  const [amount, setAmount] = useState(0);
  const [mode, setMode] = useState<"manual" | "auto">("manual");
  const [autoOn, setAutoOn] = useState(false);
  const [autoCash, setAutoCash] = useState(2);
  const [busy, setBusy] = useState(false);
  const [openBets, setOpenBets] = useState(true);
  const [history, setHistory] = useState<number[]>([]);
  const [left, setLeft] = useState(6);
  const [inRound, setInRound] = useState(false);
  const [tape, setTape] = useState<LiveSnap["bets"]>([]);
  const [hash, setHash] = useState("");
  const roundRef = useRef<string | null>(null);
  const phaseRef = useRef<Phase>("betting");
  const stakeRef = useRef(0);
  const amountRef = useRef(0);
  const modeRef = useRef(mode);
  const autoOnRef = useRef(false);
  const autoCashRef = useRef(2);
  const inRoundRef = useRef(false);
  const cashingRef = useRef(false);
  const currencyRef = useRef(currency);
  const joined = useRef(-1);
  const joining = useRef(false);
  const seenBust = useRef(-1);
  const clock = useRef({ startsAt: 0, offset: 0, phase: "betting" as Phase });

  phaseRef.current = phase;
  amountRef.current = amount;
  modeRef.current = mode;
  autoOnRef.current = autoOn;
  autoCashRef.current = autoCash;
  inRoundRef.current = inRound;
  currencyRef.current = currency;

  async function join(n: number) {
    const stake = amountRef.current;
    if (stake < 0) {
      joining.current = false;
      return;
    }
    try {
      const res = await placeLiveBet({
        data: { gameId, currency: currencyRef.current, amount: stake, pick: "" },
      });
      joined.current = n;
      stakeRef.current = stake;
      roundRef.current = String(res.snap.n);
      setInRound(true);
      applyBalances(res.balances);
    } catch (err) {
      joined.current = n;
      roundRef.current = null;
      stakeRef.current = 0;
      setInRound(false);
      toast.error(err instanceof Error ? err.message : "Bet missed the round");
    } finally {
      joining.current = false;
    }
  }

  useEffect(() => {
    let stop = false;
    let timer = 0;
    const pull = async () => {
      try {
        const snap = await liveTable({ data: { gameId } });
        if (stop) return;
        const offset = snap.serverNow - Date.now();
        clock.current = {
          startsAt: snap.startsAt,
          offset,
          phase: snap.phase === "running" ? "running" : snap.phase === "result" ? "crashed" : "betting",
        };
        setLeft(Math.max(0, Math.ceil(snap.left / 1000)));
        setTape(snap.bets);
        setHash(snap.hash);
        setHistory(snap.history.map((h) => Number.parseFloat(h.label)).filter((n) => Number.isFinite(n)));
        if (snap.phase === "betting") {
          setCrashAt(null);
          setPhase("betting");
          setDisplay(1);
          if (snap.you) {
            joined.current = snap.n;
            setInRound(snap.you.status === "open");
            stakeRef.current = snap.you.amount;
            roundRef.current = String(snap.n);
          } else if (autoOnRef.current && amountRef.current >= 0 && joined.current !== snap.n && !joining.current) {
            joining.current = true;
            void join(snap.n);
          }
        } else if (snap.phase === "running") {
          setPhase("running");
          setInRound(snap.you?.status === "open");
          if (snap.you?.status === "open") {
            stakeRef.current = snap.you.amount;
            roundRef.current = String(snap.n);
          }
        } else if (snap.phase === "locked") {
          setPhase("betting");
        } else if (seenBust.current !== snap.n) {
          seenBust.current = snap.n;
          const at = Number(snap.outcome?.crashAt ?? 1);
          setCrashAt(at);
          setPhase("crashed");
          const stake = stakeRef.current;
          const mine = snap.you;
          if (mine && mine.status !== "cashed") {
            reportRound({
              win: false,
              label: `Crash ${formatMultiplier(at)}`,
              stake,
              payout: 0,
              multiplier: 0,
              view: { kind: "crash", crashAt: at },
            });
            playSfx("boom");
          }
          stakeRef.current = 0;
          roundRef.current = null;
          setInRound(false);
        }
      } catch {
        // next poll retries
      } finally {
        if (!stop) timer = window.setTimeout(pull, 400);
      }
    };
    void pull();
    let raf = 0;
    const frame = () => {
      const { startsAt, offset, phase: livePhase } = clock.current;
      if (livePhase === "running" && startsAt) {
        const now = crashMultiplierAt(Date.now() + offset - startsAt, growth);
        setDisplay(now);
        setPhase("running");
        if (
          autoOnRef.current &&
          inRoundRef.current &&
          !cashingRef.current &&
          now >= autoCashRef.current
        ) {
          cashingRef.current = true;
          void cash().finally(() => {
            cashingRef.current = false;
          });
        }
      }
      raf = requestAnimationFrame(frame);
    };
    raf = requestAnimationFrame(frame);
    return () => {
      stop = true;
      window.clearTimeout(timer);
      cancelAnimationFrame(raf);
    };
  }, [applyBalances, gameId, growth, reportRound]);

  async function cash() {
    if (phaseRef.current !== "running" || !inRoundRef.current) return;
    const stake = stakeRef.current;
    roundRef.current = null;
    inRoundRef.current = false;
    setInRound(false);
    try {
      const res = await cashLive({ data: { gameId } });
      applyBalances(res.balances);
      stakeRef.current = 0;
      if (res.crashed) {
        playSfx("boom");
        if (stake > 0) toast.error("Crashed before cash out");
      } else {
        setPhase("cashed");
        setDisplay(res.multiplier);
        playSfx("cash");
        if (stake > 0) {
          reportRound({
            win: true,
            label: `Cash ${formatMultiplier(res.multiplier)}`,
            stake,
            payout: res.payout,
            multiplier: res.multiplier,
            view: { kind: "crash", cashAt: res.multiplier },
          });
          toast.success(`Cashed out at ${formatMultiplier(res.multiplier)}`);
        }
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Cash out failed");
    }
  }

  async function addBet() {
    if (amount < 0 || phase !== "betting" || inRound) return;
    setBusy(true);
    try {
      const res = await placeLiveBet({
        data: { gameId, currency, amount, pick: "" },
      });
      joined.current = res.snap.n;
      stakeRef.current = amount;
      roundRef.current = String(res.snap.n);
      setInRound(true);
      setTape(res.snap.bets);
      applyBalances(res.balances);
      playSfx("click");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Bet failed");
    } finally {
      setBusy(false);
    }
  }

  const cashing = phase === "running" && inRound;
  const profit = cashing ? Math.max(0, stakeRef.current * (display - 1)) : 0;

  return (
    <GameShell
      controls={
        <LiveBetDesk
          mode={mode}
          setMode={(next) => {
            setMode(next);
            if (next !== "auto") setAutoOn(false);
          }}
          amount={amount}
          setAmount={setAmount}
          busy={busy}
          currency={currency}
          balance={balances[currency]}
          profit={profit}
          closed={phase !== "betting"}
          inRound={inRound && phase === "betting"}
          onAdd={() => void addBet()}
          autoRunning={autoOn}
          onAutoToggle={() => setAutoOn((on) => !on)}
          buttonLabel={cashing ? `Cash out ${formatMultiplier(display)}` : undefined}
          onButton={cashing ? () => void cash() : undefined}
          bets={tape}
          openBets={openBets}
          setOpenBets={setOpenBets}
          formatPick={(bet) => (bet.cashMult ? `${Number(bet.cashMult).toFixed(2)}×` : bet.status === "lost" ? "bust" : "in")}
        >
          {mode === "auto" ? (
            <label className="grid gap-1">
              <span className="text-xs font-medium">Cash out at</span>
              <input
                type="number"
                min={1.01}
                step={0.01}
                value={autoCash}
                onChange={(e) => setAutoCash(Math.max(1.01, Number(e.target.value) || 1.01))}
                className="h-12 rounded-md bg-[#202329] px-4 text-sm tabular-nums outline-none"
              />
            </label>
          ) : null}
        </LiveBetDesk>
      }
      play={
        <CrashStage
          display={display}
          phase={phase === "betting" ? "idle" : phase}
          crashAt={crashAt}
          history={history}
          bets={tape}
          hash={hash}
          growth={growth}
          edge={edge}
          left={left}
        />
      }
    />
  );
}

const CHANCE_AT = [1.5, 2, 3, 5, 10, 25];

function reachChance(mult: number, edge: number) {
  if (mult <= 1) return edge;
  return Math.max(0, Math.min(1, (1 - edge) / mult));
}

function CrashStage({
  display,
  phase,
  crashAt,
  history,
  bets,
  hash,
  growth,
  edge,
  left,
}: {
  display: number;
  phase: "idle" | "running" | "crashed" | "cashed";
  crashAt: number | null;
  history: number[];
  bets: LiveSnap["bets"];
  hash: string;
  growth: number;
  edge: number;
  left: number;
}) {
  const shown = phase === "crashed" ? (crashAt ?? display) : display;
  return (
    <div className="flex w-full flex-col gap-3">
      <div className="flex items-center gap-2">
        <span className="shrink-0 text-[10px] font-semibold tracking-[0.16em] text-muted-foreground uppercase">Exits</span>
        <div className="flex min-w-0 flex-1 gap-1 overflow-x-auto">
          {history.length === 0 ? (
            <span className="text-[11px] text-muted-foreground">Waiting for the first bust</span>
          ) : (
            history.map((n, i) => <HistoryPill key={`${n}-${i}`} label={formatMultiplier(n)} />)
          )}
        </div>
      </div>
      <CrashChart display={shown} phase={phase} growth={growth} left={left} />
      <div className="grid gap-3 lg:grid-cols-[220px_minmax(0,1fr)]">
        <ChanceCard edge={edge} />
        <PlayersCard bets={bets} display={display} phase={phase} hash={hash} />
      </div>
    </div>
  );
}

function CrashChart({
  display,
  phase,
  growth,
  left,
}: {
  display: number;
  phase: "idle" | "running" | "crashed" | "cashed";
  growth: number;
  left: number;
}) {
  const bust = phase === "crashed";
  const mult = Math.max(1, display);
  const elapsed = mult <= 1.001 ? 0 : Math.log(mult) / growth;
  const yMax = Math.max(2, mult * 1.25);
  const steps = 64;
  const pts: string[] = [];
  for (let i = 0; i <= steps; i += 1) {
    const t = (i / steps) * elapsed;
    const v = Math.min(yMax, Math.exp(growth * t));
    const x = 36 + (i / steps) * 560;
    const y = 286 - ((v - 1) / (yMax - 1)) * 246;
    pts.push(`${i === 0 ? "M" : "L"}${x.toFixed(1)} ${y.toFixed(1)}`);
  }
  const line = elapsed > 0 ? pts.join(" ") : "M36 286 L596 286";
  const last = pts[pts.length - 1]?.slice(1).split(" ").map(Number) ?? [36, 286];
  const stroke = bust ? "#ff5b73" : "#c6ff4a";
  const grids = [1, 2, 5, 10, 20].filter((g) => g < yMax || g === 1);
  return (
    <div className="relative h-72 w-full overflow-hidden rounded-xl bg-[#0c0e12] ring-1 ring-white/10">
      <svg viewBox="0 0 640 320" className="size-full" aria-hidden>
        {grids.map((g) => {
          const y = 286 - ((g - 1) / (yMax - 1)) * 246;
          return (
            <g key={g}>
              <line x1="36" x2="620" y1={y} y2={y} stroke="rgba(255,255,255,0.08)" />
              <text x="8" y={y + 4} fill="rgba(255,255,255,0.35)" fontSize="11">
                {g}x
              </text>
            </g>
          );
        })}
        <path d={`${line} L${last[0]} 286 L36 286 Z`} fill={stroke} opacity="0.14" />
        <path d={line} fill="none" stroke={stroke} strokeWidth="3" strokeLinejoin="round" />
        {elapsed > 0 ? <circle cx={last[0]} cy={last[1]} r="5" fill={stroke} /> : null}
      </svg>
      <div className="pointer-events-none absolute inset-0 grid place-items-center">
        <div className="text-center">
          <p className={`font-heading text-5xl font-bold tabular-nums ${bust ? "text-[#ff5b73]" : "text-lime"}`}>
            {formatMultiplier(mult)}
          </p>
          <p className="mt-1 text-xs font-semibold tracking-wide text-white/70 uppercase">
            {bust ? "Crashed" : phase === "idle" ? `Next round · ${left}s` : "Rising"}
          </p>
        </div>
      </div>
    </div>
  );
}

function ChanceCard({ edge }: { edge: number }) {
  return (
    <section className="rounded-xl bg-[#0c0e12] p-3 ring-1 ring-white/10">
      <h3 className="text-[10px] font-semibold tracking-[0.16em] text-muted-foreground uppercase">Probability</h3>
      <p className="mt-1 text-[11px] text-white/50">Chance the round reaches</p>
      <ul className="mt-2 space-y-1">
        <li className="flex items-center justify-between text-xs">
          <span className="tabular-nums text-[#ff8b7b]">1.00x instant</span>
          <span className="tabular-nums text-white/80">{(edge * 100).toFixed(1)}%</span>
        </li>
        {CHANCE_AT.map((m) => (
          <li key={m} className="flex items-center justify-between text-xs">
            <span className={`tabular-nums ${m >= 2 ? "text-lime" : "text-white/80"}`}>{m.toFixed(2)}x</span>
            <span className="tabular-nums text-white/80">{(reachChance(m, edge) * 100).toFixed(1)}%</span>
          </li>
        ))}
      </ul>
    </section>
  );
}

function PlayersCard({
  bets,
  display,
  phase,
  hash,
}: {
  bets: LiveTapeBet[];
  display: number;
  phase: "idle" | "running" | "crashed" | "cashed";
  hash: string;
}) {
  return (
    <section className="min-w-0 rounded-xl bg-[#0c0e12] ring-1 ring-white/10">
      <header className="flex items-center justify-between border-b border-white/10 px-3 py-2">
        <h3 className="text-[10px] font-semibold tracking-[0.16em] text-muted-foreground uppercase">Players</h3>
        <span className="text-[11px] tabular-nums text-white/50">{bets.length}</span>
      </header>
      <div className="grid grid-cols-[1.3fr_0.9fr_0.6fr_0.8fr] px-3 py-1.5 text-[10px] tracking-wide text-white/35 uppercase">
        <span>User</span>
        <span className="text-right">Bet</span>
        <span className="text-right">X</span>
        <span className="text-right">Profit</span>
      </div>
      {bets.length === 0 ? (
        <p className="px-3 py-6 text-center text-xs text-muted-foreground">No bets this round</p>
      ) : (
        <ul className="max-h-44 overflow-y-auto">
          {bets.map((bet, i) => (
            <PlayerRow key={`${bet.name}-${i}`} bet={bet} display={display} phase={phase} />
          ))}
        </ul>
      )}
      {hash ? <p className="truncate border-t border-white/10 px-3 py-1.5 text-[10px] text-white/30">HASH {hash.slice(0, 18)}</p> : null}
    </section>
  );
}

function PlayerRow({
  bet,
  display,
  phase,
}: {
  bet: LiveTapeBet;
  display: number;
  phase: "idle" | "running" | "crashed" | "cashed";
}) {
  const currency = bet.currency as Currency;
  const open = bet.status === "open" && phase === "running";
  const mult = bet.cashMult ?? (open ? display : null);
  const profit =
    bet.status === "lost" ? -bet.amount : bet.payout != null && bet.payout > 0 ? bet.payout - bet.amount : open ? bet.amount * display - bet.amount : null;
  return (
    <li className={`grid grid-cols-[1.3fr_0.9fr_0.6fr_0.8fr] px-3 py-1 text-xs ${bet.mine ? "bg-lime/10" : ""}`}>
      <span className={`truncate ${bet.mine ? "font-semibold text-lime" : "text-white/85"}`}>{bet.name}</span>
      <span className="text-right tabular-nums text-white/70">
        {formatMoney(bet.amount, currency)} {bet.currency}
      </span>
      <span className={`text-right tabular-nums ${bet.status === "lost" ? "text-[#ff8b7b]" : "text-lime"}`}>
        {mult != null && bet.status !== "lost" ? formatMultiplier(mult) : "—"}
      </span>
      <span className={`text-right tabular-nums ${profit != null && profit >= 0 ? "text-lime" : "text-[#ff8b7b]"}`}>
        {profit == null ? "—" : `${profit >= 0 ? "+" : ""}${formatMoney(profit, currency)}`}
      </span>
    </li>
  );
}
