import { useState } from "react";
import { toast } from "sonner";
import { useWallet } from "@/lib/wallet-context";
import { cashTower, pickTower, startTower } from "@/lib/casino-api";
import { PlayGate } from "@/components/games/play-gate";
import { GameShell, LimeBet } from "@/components/games/game-shell";
import { useGameTable } from "@/components/games/game-table";
import { StakeField } from "@/components/games/stake-field";
import { formatMoney, formatMultiplier } from "@/lib/format";
import { playSfx } from "@/lib/game-sound";
import { TOWER_COLS, TOWER_ROWS, towerMultiplier } from "@/lib/originals";
import { cn } from "cn";

export function TowerGame({ gameId }: { gameId: string }) {
  return (
    <PlayGate>
      <TowerTable gameId={gameId} />
    </PlayGate>
  );
}

function TowerTable({ gameId }: { gameId: string }) {
  const { currency, applyBalances } = useWallet();
  const { reportRound } = useGameTable();
  const [amount, setAmount] = useState(0);
  const [roundId, setRoundId] = useState<string | null>(null);
  const [row, setRow] = useState(0);
  const [deaths, setDeaths] = useState<number[] | null>(null);
  const [picks, setPicks] = useState<number[]>([]);
  const [busy, setBusy] = useState(false);
  const mult = towerMultiplier(row);

  async function start() {
    setBusy(true);
    try {
      const res = await startTower({ data: { gameId, currency, amount } });
      setRoundId(res.roundId);
      setRow(0);
      setDeaths(null);
      setPicks([]);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Bet failed");
    } finally {
      setBusy(false);
    }
  }

  async function pick(col: number) {
    if (!roundId || deaths) return;
    try {
      const res = await pickTower({ data: { roundId, col } });
      if (res.boom) {
        setDeaths(res.deaths ?? null);
        setRoundId(null);
        playSfx("boom");
        reportRound({
          win: false,
          label: "Fall",
          stake: amount,
          payout: 0,
          multiplier: 0,
          view: { kind: "tower", row, boom: true },
        });
        toast.error("Death tile.");
        return;
      }
      setPicks((p) => [...p, col]);
      setRow(res.row);
      playSfx("gem");
      if (res.done) {
        if (res.balances) applyBalances(res.balances);
        setRoundId(null);
        reportRound({
          win: true,
          label: `Summit ${formatMultiplier(res.multiplier)}`,
          stake: amount,
          payout: res.payout ?? 0,
          multiplier: res.multiplier,
        });
        toast.success(`Won ${formatMoney(res.payout ?? 0, currency)} ${currency}`);
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Pick failed");
    }
  }

  async function cash() {
    if (!roundId || row === 0) return;
    try {
      const res = await cashTower({ data: { roundId } });
      applyBalances(res.balances);
      setRoundId(null);
      reportRound({
        win: res.payout > 0,
        label: `Cash ${formatMultiplier(res.multiplier)}`,
        stake: amount,
        payout: res.payout,
        multiplier: res.multiplier,
      });
      toast.success(`Cashed ${formatMoney(res.payout, currency)} ${currency}`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Cash out failed");
    }
  }

  return (
    <GameShell
      controls={
        <>
          {roundId ? (
            <LimeBet disabled={busy || row === 0} onClick={() => void cash()}>
              Cash out {formatMultiplier(mult)}
            </LimeBet>
          ) : (
            <LimeBet disabled={busy} onClick={() => void start()}>
              Start
            </LimeBet>
          )}
          <StakeField amount={amount} setAmount={setAmount} />
        </>
      }
      play={
        <div className="mx-auto flex w-full max-w-sm flex-col-reverse gap-1.5 py-4">
          {Array.from({ length: TOWER_ROWS }).map((_, r) => {
            const live = roundId && r === row && !deaths;
            return (
              <div key={r} className="grid grid-cols-3 gap-1.5">
                {Array.from({ length: TOWER_COLS }).map((_, c) => {
                  const dead = deaths?.[r] === c;
                  const safe = picks[r] === c;
                  return (
                    <button
                      key={c}
                      type="button"
                      disabled={!live}
                      onClick={() => void pick(c)}
                      className={cn(
                        "h-11 rounded-lg text-xs font-medium",
                        dead && "bg-destructive/80",
                        safe && "bg-lime text-black",
                        !dead && !safe && live && "bg-muted hover:bg-lime/40",
                        !dead && !safe && !live && "bg-card ring-1 ring-border",
                      )}
                    >
                      {dead ? "×" : safe ? "●" : r === TOWER_ROWS - 1 ? formatMultiplier(towerMultiplier(r + 1)) : ""}
                    </button>
                  );
                })}
              </div>
            );
          })}
        </div>
      }
    />
  );
}
