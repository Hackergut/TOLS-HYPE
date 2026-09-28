import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { PlayGate } from "@/components/games/play-gate";
import { GameShell, LimeBet } from "@/components/games/game-shell";
import { useGameTable } from "@/components/games/game-table";
import { StakeField } from "@/components/games/stake-field";
import { crashMultiplierAt } from "@/lib/rng";
import { crashGrowth, liveCrashRound } from "@/lib/live-table";
import { formatMultiplier } from "@/lib/format";
import { useWallet } from "@/lib/wallet-context";
import { cashOutCrash, startCrash } from "@/lib/casino-api";
import { playSfx } from "@/lib/game-sound";

type Phase = "betting" | "running" | "crashed" | "cashed";

export function CrashGame({ gameId }: { gameId: string }) {
  return (
    <PlayGate>
      <CrashTable gameId={gameId} />
    </PlayGate>
  );
}

function CrashTable({ gameId }: { gameId: string }) {
  const { currency, applyBalances } = useWallet();
  const { reportRound } = useGameTable();
  const growth = crashGrowth(gameId);
  const orbit = gameId === "orbit-crash";
  const [phase, setPhase] = useState<Phase>("betting");
  const [display, setDisplay] = useState(1);
  const [crashAt, setCrashAt] = useState<number | null>(null);
  const [amount, setAmount] = useState(0);
  const [history, setHistory] = useState<number[]>([]);
  const [left, setLeft] = useState(6);
  const [armed, setArmed] = useState(true);
  const [inRound, setInRound] = useState(false);
  const roundRef = useRef<string | null>(null);
  const phaseRef = useRef<Phase>("betting");
  const stakeRef = useRef(0);
  const amountRef = useRef(0);
  const armedRef = useRef(true);
  const currencyRef = useRef(currency);
  const joined = useRef(-1);
  const joining = useRef(false);
  const seenBust = useRef(-1);

  phaseRef.current = phase;
  amountRef.current = amount;
  armedRef.current = armed;
  currencyRef.current = currency;

  async function join(n: number) {
    const stake = amountRef.current;
    try {
      const res = await startCrash({ data: { gameId, currency: currencyRef.current, amount: stake } });
      joined.current = n;
      stakeRef.current = stake;
      roundRef.current = res.roundId;
      setInRound(stake > 0);
    } catch (err) {
      joined.current = n;
      roundRef.current = null;
      stakeRef.current = 0;
      setInRound(false);
      if (stake > 0) toast.error(err instanceof Error ? err.message : "Bet missed the round");
    } finally {
      joining.current = false;
    }
  }

  useEffect(() => {
    let raf = 0;
    const loop = () => {
      const live = liveCrashRound(Date.now(), gameId, 0.04, growth);
      setDisplay(live.phase === "running" ? crashMultiplierAt(Date.now() - live.startedAt, growth) : live.display);
      setLeft(Math.max(0, Math.ceil(live.left / 1000)));
      setPhase(live.phase === "running" ? "running" : live.phase === "crashed" ? "crashed" : "betting");
      if (live.phase === "betting") {
        roundRef.current = null;
        setCrashAt(null);
      }
      if (live.phase === "running" && armedRef.current && joined.current !== live.n && !joining.current) {
        joining.current = true;
        void join(live.n);
      }
      if (live.phase === "crashed" && seenBust.current !== live.n) {
        seenBust.current = live.n;
        setCrashAt(live.crashAt);
        setHistory((h) => [live.crashAt, ...h].slice(0, 16));
        const stake = stakeRef.current;
        if (stake > 0 && roundRef.current) {
          reportRound({
            win: false,
            label: `Crash ${formatMultiplier(live.crashAt)}`,
            stake,
            payout: 0,
            multiplier: 0,
            view: { kind: "crash", crashAt: live.crashAt },
          });
          playSfx("boom");
        }
        stakeRef.current = 0;
        roundRef.current = null;
        setInRound(false);
      }
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [gameId, growth, reportRound]);

  async function cash() {
    if (!roundRef.current || phaseRef.current !== "running") return;
    const id = roundRef.current;
    const stake = stakeRef.current;
    roundRef.current = null;
    try {
      const res = await cashOutCrash({ data: { roundId: id } });
      applyBalances(res.balances);
      stakeRef.current = 0;
      setInRound(false);
      if (res.crashed) {
        playSfx("boom");
        if (stake > 0) toast.error(`Crashed at ${formatMultiplier(res.crashAt)}`);
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
            view: { kind: "crash", cashAt: res.multiplier, crashAt: res.crashAt },
          });
          toast.success(`Cashed out at ${formatMultiplier(res.multiplier)}`);
        }
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Cash out failed");
    }
  }

  return (
    <GameShell
      controls={
        <>
          <StakeField amount={amount} setAmount={setAmount} disabled={phase === "running"} />
          {phase === "running" && inRound ? (
            <LimeBet onClick={() => void cash()}>Cash out {formatMultiplier(display)}</LimeBet>
          ) : phase === "betting" ? (
            <LimeBet onClick={() => setArmed((v) => !v)}>
              {armed ? `In · ${left}s` : `Sit out · ${left}s`}
            </LimeBet>
          ) : (
            <LimeBet disabled>{orbit ? "Orbit live" : "Live"}</LimeBet>
          )}
        </>
      }
      play={
        orbit ? (
          <OrbitBoard display={display} phase={phase === "betting" ? "idle" : phase} crashAt={crashAt} history={history} />
        ) : (
          <CrashBoard display={display} phase={phase === "betting" ? "idle" : phase} crashAt={crashAt} history={history} />
        )
      }
    />
  );
}

function CrashHex({ n, hot }: { n: number; hot?: boolean }) {
  return (
    <span
      className={`grid size-14 place-items-center text-[0.7rem] font-bold tabular-nums ${
        hot ? "bg-lime text-black" : n >= 2 ? "bg-lime/80 text-black" : "bg-muted text-muted-foreground"
      }`}
      style={{ clipPath: "polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)" }}
    >
      {formatMultiplier(n)}
    </span>
  );
}

function CrashBoard({
  display,
  phase,
  crashAt,
  history,
}: {
  display: number;
  phase: "idle" | "running" | "crashed" | "cashed";
  crashAt: number | null;
  history: number[];
}) {
  const fill = Math.min(88, 12 + Math.log(Math.max(1, display)) * 32);
  const sides = [history[1] ?? 1.01, history[0] ?? 1.28];
  const right = [history[2] ?? 1.35, history[3] ?? 1.0];
  return (
    <div className="flex flex-col items-center gap-4">
      <div className="flex flex-wrap justify-center gap-1.5">
        {history.slice(0, 6).map((n, i) => (
          <span
            key={`${n}-${i}`}
            className={`rounded-md px-2 py-1 text-[0.7rem] font-bold tabular-nums ${
              n >= 2 ? "bg-lime text-black" : "bg-muted text-muted-foreground"
            }`}
          >
            {formatMultiplier(n)}
          </span>
        ))}
      </div>
      <div className="flex h-64 w-full max-w-md items-end justify-center gap-2">
        {sides.map((n, i) => (
          <div key={`l${i}`} className="flex h-[55%] w-16 items-center justify-center rounded-xl bg-muted/40 opacity-50">
            <CrashHex n={n} />
          </div>
        ))}
        <div
          className={`relative h-full w-28 overflow-hidden rounded-2xl ring-2 ${
            phase === "crashed" ? "ring-purple" : "ring-lime"
          }`}
        >
          <div
            className={`absolute inset-x-0 bottom-0 ${phase === "crashed" ? "bg-purple" : "bg-lime"}`}
            style={{ height: `${fill}%` }}
          />
          <div className="absolute top-[16%] left-1/2 z-10 -translate-x-1/2">
            <CrashHex n={display} hot={phase !== "crashed"} />
          </div>
          <span className="absolute bottom-3 left-1/2 z-10 h-[38%] w-px -translate-x-1/2 bg-white/80" />
          <span className="absolute bottom-2 left-1/2 z-10 size-3 -translate-x-1/2 rounded-full bg-white" />
        </div>
        {right.map((n, i) => (
          <div key={`r${i}`} className="flex h-[55%] w-16 items-center justify-center rounded-xl bg-muted/40 opacity-50">
            <CrashHex n={n} />
          </div>
        ))}
      </div>
      <p className="text-xs text-muted-foreground">
        <span className="mr-1 inline-block size-1.5 rounded-full bg-lime" />
        {phase === "running" ? "Live" : phase === "crashed" ? `Bust ${formatMultiplier(crashAt ?? display)}` : "Next round"}
      </p>
    </div>
  );
}

function OrbitBoard({
  display,
  phase,
  crashAt,
  history,
}: {
  display: number;
  phase: "idle" | "running" | "crashed" | "cashed";
  crashAt: number | null;
  history: number[];
}) {
  const turn = Math.min(0.92, Math.log(Math.max(1, display)) / 4);
  return (
    <div className="flex flex-col items-center gap-4">
      <div className="flex flex-wrap justify-center gap-1.5">
        {history.slice(0, 8).map((n, i) => (
          <span
            key={`${n}-${i}`}
            className={`rounded-md px-2 py-1 text-[0.7rem] font-bold tabular-nums ${
              n >= 2 ? "bg-lime text-black" : "bg-muted text-muted-foreground"
            }`}
          >
            {formatMultiplier(n)}
          </span>
        ))}
      </div>
      <div className="relative grid size-64 place-items-center">
        <div
          className={`absolute inset-3 rounded-full border-2 border-dashed ${phase === "crashed" ? "border-purple" : "border-lime/70"}`}
          style={{ transform: `rotate(${turn * 360}deg)` }}
        />
        <div className={`absolute inset-10 rounded-full border ${phase === "crashed" ? "border-purple" : "border-lime/40"}`} />
        <div
          className="absolute size-3 rounded-full bg-lime shadow-[0_0_12px_#b6ff3b]"
          style={{
            transform: `rotate(${turn * 360}deg) translateY(-92px)`,
          }}
        />
        <p className={`font-heading text-4xl font-bold tabular-nums ${phase === "crashed" ? "text-purple" : "text-lime"}`}>
          {formatMultiplier(phase === "crashed" ? (crashAt ?? display) : display)}
        </p>
      </div>
      <p className="text-xs text-muted-foreground">Slower orbit · same cash-out</p>
    </div>
  );
}
