import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { PlayGate } from "@/components/games/play-gate";
import { GameShell, LimeBet } from "@/components/games/game-shell";
import { useGameTable } from "@/components/games/game-table";
import { StakeField } from "@/components/games/stake-field";
import { playKeno } from "@/lib/casino-api";
import { useWallet } from "@/lib/wallet-context";
import { CURRENCY_META } from "@/lib/games-catalog";
import { formatMoney } from "@/lib/format";

const RISKS = ["classic", "low", "normie", "degen"] as const;

export function KenoGame({ gameId }: { gameId: string }) {
  return (
    <PlayGate>
      <KenoTable gameId={gameId} />
    </PlayGate>
  );
}

function KenoTable({ gameId }: { gameId: string }) {
  const { currency, applyBalances } = useWallet();
  const { reportRound } = useGameTable();
  const meta = CURRENCY_META[currency];
  const [picks, setPicks] = useState<number[]>([]);
  const [drawn, setDrawn] = useState<number[]>([]);
  const [hits, setHits] = useState<number | null>(null);
  const [amount, setAmount] = useState(meta.minBet);
  const [risk, setRisk] = useState<(typeof RISKS)[number]>("classic");
  const [busy, setBusy] = useState(false);

  function toggle(n: number) {
    setDrawn([]);
    setHits(null);
    setPicks((p) => {
      if (p.includes(n)) return p.filter((x) => x !== n);
      if (p.length >= 10) return p;
      return [...p, n].sort((a, b) => a - b);
    });
  }

  function autoPick() {
    const next: number[] = [];
    while (next.length < 8) {
      const n = 1 + Math.floor(Math.random() * 40);
      if (!next.includes(n)) next.push(n);
    }
    setPicks(next.sort((a, b) => a - b));
    setDrawn([]);
    setHits(null);
  }

  async function play() {
    if (picks.length < 1) {
      toast.message("Select 1–10 numbers");
      return;
    }
    setBusy(true);
    try {
      const res = await playKeno({ data: { gameId, currency, amount, picks, risk } });
      applyBalances(res.balances);
      setDrawn(res.drawn);
      setHits(res.hits);
      reportRound({
        win: res.payout > 0,
        label: `${res.hits} hits`,
        stake: amount,
        payout: res.payout,
        multiplier: amount ? res.payout / amount : 0,
        view: { kind: "keno", hits: res.hits },
        replay: () => {
          setDrawn(res.drawn);
          setHits(res.hits);
        },
      });
      if (res.payout > 0) toast.success(`${res.hits} hits · ${formatMoney(res.payout, currency)}`);
      else toast.message(`${res.hits} hits`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Bet failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <GameShell
      controls={
        <>
          <StakeField amount={amount} setAmount={setAmount} />
          <div>
            <p className="mb-2 text-xs text-muted-foreground">Risk</p>
            <div className="grid grid-cols-4 gap-1">
              {RISKS.map((r) => (
                <button
                  key={r}
                  type="button"
                  className={`h-10 rounded-lg text-xs capitalize ${
                    risk === r
                      ? "bg-primary font-semibold text-primary-foreground"
                      : "bg-muted text-muted-foreground hover:text-foreground"
                  }`}
                  onClick={() => setRisk(r)}
                >
                  {r}
                </button>
              ))}
            </div>
          </div>
          <LimeBet disabled={busy} onClick={() => void play()}>
            Bet
          </LimeBet>
        </>
      }
      play={
        <div className="mx-auto flex w-full max-w-lg flex-col items-stretch gap-4">
          <div className="grid grid-cols-8 gap-1.5">
            {Array.from({ length: 40 }, (_, i) => i + 1).map((n) => {
              const selected = picks.includes(n);
              const hit = drawn.includes(n) && selected;
              const house = drawn.includes(n) && !selected;
              return (
                <button
                  key={n}
                  type="button"
                  onClick={() => toggle(n)}
                  className={`aspect-square rounded-lg text-xs font-semibold tabular-nums ${
                    hit
                      ? "bg-lime text-background"
                      : house
                        ? "bg-destructive/70 text-white"
                        : selected
                          ? "bg-primary/20 text-primary ring-1 ring-primary"
                          : "bg-tile text-foreground"
                  }`}
                >
                  {n}
                </button>
              );
            })}
          </div>
          <p className="text-center text-xs text-muted-foreground">
            {hits !== null ? `${hits} hits this round` : "Select 1–10 numbers to play"}
          </p>
          <div className="grid grid-cols-2 gap-2">
            <Button variant="outline" className="h-11" onClick={autoPick}>
              Auto pick
            </Button>
            <Button
              variant="outline"
              className="h-11"
              onClick={() => {
                setPicks([]);
                setDrawn([]);
                setHits(null);
              }}
            >
              Clear table
            </Button>
          </div>
        </div>
      }
    />
  );
}
