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
  const [amount, setAmount] = useState(meta.minBet);
  const startedAt = useRef(0);
  const raf = useRef(0);
  const roundRef = useRef<string | null>(null);
  const phaseRef = useRef<Phase>("idle");

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
        reportRound({
          win: false,
          label: `Crash ${formatMultiplier(res.crashAt)}`,
          stake: amount,
          payout: 0,
          multiplier: 0,
          view: { kind: "crash", crashAt: res.crashAt },
        });
        toast.error(`Crashed at ${formatMultiplier(res.crashAt)}`);
      } else {
        setPhase("cashed");
        setDisplay(res.multiplier);
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

  const color =
    phase === "crashed" ? "text-destructive" : phase === "cashed" ? "text-lime" : "text-foreground";

  return (
    <GameShell
      controls={
        <>
          <StakeField amount={amount} setAmount={setAmount} disabled={phase === "running"} />
          {phase === "running" ? (
            <LimeBet onClick={() => void cash()}>Cash out {formatMultiplier(display)}</LimeBet>
          ) : (
            <LimeBet onClick={() => void play()}>Bet</LimeBet>
          )}
        </>
      }
      play={
        <div className="flex flex-col items-center justify-center py-8">
          <p className="text-xs font-medium tracking-widest text-muted-foreground uppercase">Multiplier</p>
          <p className={`mt-4 font-heading text-6xl font-semibold tabular-nums tracking-tight ${color}`}>
            {formatMultiplier(display)}
          </p>
          <div className="mt-10 h-1.5 w-full max-w-md overflow-hidden rounded-full bg-muted">
            <div
              className={`h-full rounded-full ${phase === "crashed" ? "bg-destructive" : phase === "cashed" ? "bg-lime" : "bg-primary"}`}
              style={{ width: `${Math.min(100, Math.log(display) * 40)}%` }}
            />
          </div>
          {crashAt && phase === "crashed" ? (
            <p className="mt-4 text-sm text-muted-foreground">Round busted at {formatMultiplier(crashAt)}</p>
          ) : null}
        </div>
      }
    />
  );
}
