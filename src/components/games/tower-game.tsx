import { useState } from "react";
import { toast } from "sonner";
import { useWallet } from "@/lib/wallet-context";
import { cashTower, pickTower, startTower } from "@/lib/casino-api";
import { PlayGate } from "@/components/games/play-gate";
import { GameShell, LimeBet } from "@/components/games/game-shell";
import { useGameTable } from "@/components/games/game-table";
import { StakeField, FieldLabel } from "@/components/games/stake-field";
import { formatMoney, formatMultiplier } from "@/lib/format";
import { playSfx } from "@/lib/game-sound";
import { TOWER_SETUPS, towerMultiplier, type TowerMode, type TowerPattern } from "@/lib/originals";
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
  const [mode, setMode] = useState<TowerMode>("medium");
  const [pattern, setPattern] = useState<TowerPattern>("classic");
  const [roundId, setRoundId] = useState<string | null>(null);
  const [row, setRow] = useState(0);
  const [bombs, setBombs] = useState<number[][] | null>(null);
  const [picks, setPicks] = useState<number[]>([]);
  const [busy, setBusy] = useState(false);
  const setup = TOWER_SETUPS[mode];
  const cols = bombs ? bombs[0]?.length ? setup.cols : setup.cols : setup.cols;
  const rows = bombs?.length || setup.rows;
  const mult = towerMultiplier(row, setup.cols, setup.bombs);

  async function start() {
    setBusy(true);
    try {
      const res = await startTower({ data: { gameId, currency, amount, mode, pattern } });
      setRoundId(res.roundId);
      setRow(0);
      setBombs(null);
      setPicks([]);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Bet failed");
    } finally {
      setBusy(false);
    }
  }

  async function pick(col: number) {
    if (!roundId || bombs) return;
    try {
      const res = await pickTower({ data: { roundId, col } });
      if (res.boom) {
        setBombs(res.bombs ?? null);
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
          <StakeField amount={amount} setAmount={setAmount} disabled={Boolean(roundId)} />
          <FieldLabel label="Difficulty">
            <div className="grid grid-cols-3 gap-1">
              {(Object.keys(TOWER_SETUPS) as TowerMode[]).map((id) => (
                <button
                  key={id}
                  type="button"
                  disabled={Boolean(roundId)}
                  onClick={() => setMode(id)}
                  className={cn(
                    "h-8 rounded-md text-[0.65rem] font-semibold capitalize",
                    mode === id ? "bg-lime text-black" : "bg-muted text-muted-foreground",
                  )}
                >
                  {id}
                </button>
              ))}
            </div>
          </FieldLabel>
          <FieldLabel label="Pattern">
            <div className="grid grid-cols-4 gap-1">
              {(["classic", "snake", "mirror", "edges"] as TowerPattern[]).map((id) => (
                <button
                  key={id}
                  type="button"
                  disabled={Boolean(roundId)}
                  onClick={() => setPattern(id)}
                  className={cn(
                    "h-8 rounded-md text-[0.65rem] font-semibold capitalize",
                    pattern === id ? "bg-white text-black" : "bg-muted text-muted-foreground",
                  )}
                >
                  {id}
                </button>
              ))}
            </div>
          </FieldLabel>
        </>
      }
      play={
        <div className="mx-auto flex w-full max-w-sm flex-col-reverse gap-1.5 py-4">
          {Array.from({ length: rows }).map((_, r) => {
            const live = roundId && r === row && !bombs;
            return (
              <div key={r} className="grid gap-1.5" style={{ gridTemplateColumns: `repeat(${setup.cols}, minmax(0, 1fr))` }}>
                {Array.from({ length: setup.cols }).map((_, c) => {
                  const dead = Boolean(bombs?.[r]?.includes(c));
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
                      {dead ? "×" : safe ? "●" : r === rows - 1 ? formatMultiplier(towerMultiplier(r + 1, setup.cols, setup.bombs)) : ""}
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
