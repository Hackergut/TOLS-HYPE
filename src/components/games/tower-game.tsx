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
import { TOWER_SETUPS, towerBombs, towerMultiplier, type TowerMode, type TowerPattern } from "@/lib/originals";
import { cn } from "cn";

const MODES: { id: TowerMode; label: string }[] = [
  { id: "easy", label: "Easy" },
  { id: "medium", label: "Medium" },
  { id: "hard", label: "Hard" },
  { id: "expert", label: "Expert" },
  { id: "master", label: "Master" },
];

const PATTERNS: { id: TowerPattern; label: string; hint: string }[] = [
  { id: "classic", label: "Classic", hint: "Random each floor" },
  { id: "snake", label: "Snake", hint: "Walks one column per floor" },
  { id: "mirror", label: "Mirror", hint: "Edges, then the center" },
  { id: "edges", label: "Edges", hint: "Bombs stay on the sides" },
];

function modeHint(id: TowerMode) {
  const s = TOWER_SETUPS[id];
  return `${s.cols} tiles · ${s.bombs} bomb${s.bombs > 1 ? "s" : ""} · ${s.rows} floors`;
}

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
  const rows = bombs?.length || setup.rows;
  const mult = towerMultiplier(row, setup.cols, setup.bombs);
  const shape = towerBombs(
    [0.15, 0.42, 0.73, 0.28, 0.61, 0.88, 0.07, 0.51, 0.33, 0.19, 0.66, 0.9, 0.4, 0.22, 0.77, 0.11, 0.55, 0.84, 0.36, 0.63],
    setup.cols,
    setup.bombs,
    Math.min(6, setup.rows),
    pattern,
  );

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
          <FieldLabel label="Difficulty" hint={modeHint(mode)}>
            <div className="grid gap-1">
              {MODES.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  disabled={Boolean(roundId)}
                  onClick={() => setMode(item.id)}
                  className={cn(
                    "flex h-9 items-center justify-between rounded-md px-2.5 text-left text-xs",
                    mode === item.id ? "bg-lime font-semibold text-black" : "bg-muted text-muted-foreground",
                  )}
                >
                  <span>{item.label}</span>
                  <span className="tabular-nums opacity-80">{modeHint(item.id)}</span>
                </button>
              ))}
            </div>
          </FieldLabel>
          <FieldLabel label="Pattern" hint={PATTERNS.find((p) => p.id === pattern)?.hint}>
            <div className="grid grid-cols-2 gap-1">
              {PATTERNS.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  disabled={Boolean(roundId)}
                  onClick={() => setPattern(item.id)}
                  className={cn(
                    "h-9 rounded-md px-2 text-xs font-semibold",
                    pattern === item.id ? "bg-white text-black" : "bg-muted text-muted-foreground",
                  )}
                >
                  {item.label}
                </button>
              ))}
            </div>
            <div className="mt-1 flex flex-col-reverse gap-0.5 opacity-80" aria-hidden>
              {shape.map((floor, r) => (
                <div key={r} className="grid gap-0.5" style={{ gridTemplateColumns: `repeat(${setup.cols}, minmax(0, 1fr))` }}>
                  {Array.from({ length: setup.cols }).map((_, c) => (
                    <span
                      key={c}
                      className={cn("h-1.5 rounded-sm", floor.includes(c) ? "bg-destructive" : "bg-muted")}
                    />
                  ))}
                </div>
              ))}
            </div>
          </FieldLabel>
        </>
      }
      play={
        <div className="mx-auto flex w-full max-w-sm flex-col gap-2 py-4">
          <p className="text-center text-[11px] font-semibold tracking-[0.14em] text-muted-foreground uppercase">
            {mode} · {pattern} · {setup.cols}×{setup.rows} · {setup.bombs} bomb{setup.bombs > 1 ? "s" : ""}
          </p>
          <div className="flex flex-col-reverse gap-1.5">
          {Array.from({ length: rows }).map((_, r) => {
            const live = roundId && r === row && !bombs;
            return (
              <div key={r} className="flex items-center gap-1.5">
                <span className="w-11 shrink-0 text-right text-[10px] tabular-nums text-muted-foreground">
                  {formatMultiplier(towerMultiplier(r + 1, setup.cols, setup.bombs))}
                </span>
                <div className="grid flex-1 gap-1.5" style={{ gridTemplateColumns: `repeat(${setup.cols}, minmax(0, 1fr))` }}>
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
                      {dead ? "×" : safe ? "●" : ""}
                    </button>
                  );
                })}
                </div>
              </div>
            );
          })}
          </div>
        </div>
      }
    />
  );
}
