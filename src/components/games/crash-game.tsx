import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { PlayGate } from "@/components/games/play-gate";
import { GameShell, LimeBet } from "@/components/games/game-shell";
import { useGameTable } from "@/components/games/game-table";
import { StakeField } from "@/components/games/stake-field";
import { crashMultiplierAt } from "@/lib/rng";
import { formatMultiplier } from "@/lib/format";
import { useWallet } from "@/lib/wallet-context";
import { cashOutCrash, peekCrash, startCrash } from "@/lib/casino-api";
import { CURRENCY_META } from "@/lib/games-catalog";
import { playSfx } from "@/lib/game-sound";
import { effectiveSpeed } from "@/lib/game-speed";

type Phase = "idle" | "running" | "crashed" | "cashed";

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
  const meta = CURRENCY_META[currency];
  const [phase, setPhase] = useState<Phase>("idle");
  const [display, setDisplay] = useState(1);
  const [crashAt, setCrashAt] = useState<number | null>(null);
  const [amount, setAmount] = useState(0);
  const [history, setHistory] = useState<number[]>([]);
  const startedAt = useRef(0);
  const raf = useRef(0);
  const roundRef = useRef<string | null>(null);
  const phaseRef = useRef<Phase>("idle");
  const lastTick = useRef(0);

  useEffect(() => {
    phaseRef.current = phase;
  }, [phase]);

  useEffect(() => {
    return () => {
      if (raf.current) cancelAnimationFrame(raf.current);
    };
  }, []);

  function tick() {
    const elapsed = Date.now() - startedAt.current;
    setDisplay(crashMultiplierAt(elapsed));
    const gap = effectiveSpeed() === "fast" ? 180 : effectiveSpeed() === "instant" ? 0 : 420;
    if (gap && Date.now() - lastTick.current > gap) {
      lastTick.current = Date.now();
      playSfx("tick");
    }
    raf.current = requestAnimationFrame(tick);
  }

  async function play() {
    try {
      const res = await startCrash({ data: { gameId, currency, amount } });
      roundRef.current = res.roundId;
      startedAt.current = res.startedAt;
      setCrashAt(null);
      setDisplay(1);
      setPhase("running");
      raf.current = requestAnimationFrame(tick);
      void watchCrash(res.roundId);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Bet failed");
    }
  }

  async function watchCrash(id: string) {
    while (phaseRef.current === "running" && roundRef.current === id) {
      try {
        const peek = await peekCrash({ data: { roundId: id } });
        if (peek.crashed && phaseRef.current === "running") {
          if (raf.current) cancelAnimationFrame(raf.current);
          setPhase("crashed");
          setCrashAt(peek.crashAt);
          setDisplay(peek.crashAt ?? 1);
          reportRound({
            win: false,
            label: `Crash ${formatMultiplier(peek.crashAt ?? 1)}`,
            stake: amount,
            payout: 0,
            multiplier: 0,
            view: { kind: "crash", crashAt: peek.crashAt ?? 1 },
          });
          toast.error(`Crashed at ${formatMultiplier(peek.crashAt ?? 1)}`);
          playSfx("boom");
          setHistory((h) => [peek.crashAt ?? 1, ...h].slice(0, 16));
          return;
        }
      } catch {
        return;
      }
      await new Promise((r) => setTimeout(r, 120));
    }
  }

  async function cash() {
    if (!roundRef.current || phaseRef.current !== "running") return;
    try {
      const res = await cashOutCrash({ data: { roundId: roundRef.current } });
      if (raf.current) cancelAnimationFrame(raf.current);
      applyBalances(res.balances);
      if (res.crashed) {
        setPhase("crashed");
        setCrashAt(res.crashAt);
        setDisplay(res.crashAt);
        playSfx("boom");
        reportRound({
          win: false,
          label: `Crash ${formatMultiplier(res.crashAt)}`,
          stake: amount,
          payout: 0,
          multiplier: 0,
          view: { kind: "crash", crashAt: res.crashAt },
        });
        toast.error(`Crashed at ${formatMultiplier(res.crashAt)}`);
        setHistory((h) => [res.crashAt, ...h].slice(0, 16));
      } else {
        setPhase("cashed");
        setDisplay(res.multiplier);
        playSfx("cash");
        setHistory((h) => [res.multiplier, ...h].slice(0, 16));
        reportRound({
          win: true,
          label: `Cash ${formatMultiplier(res.multiplier)}`,
          stake: amount,
          payout: amount * res.multiplier,
          multiplier: res.multiplier,
          view: { kind: "crash", cashAt: res.multiplier, crashAt: res.crashAt },
        });
        toast.success(`Cashed out at ${formatMultiplier(res.multiplier)}`);
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
          {phase === "running" ? (
            <LimeBet onClick={() => void cash()}>Cash out {formatMultiplier(display)}</LimeBet>
          ) : (
            <LimeBet onClick={() => void play()}>Bet (next round)</LimeBet>
          )}
        </>
      }
      play={
        <CrashBoard
          display={display}
          phase={phase}
          crashAt={crashAt}
          history={history}
        />
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
  phase: Phase;
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
