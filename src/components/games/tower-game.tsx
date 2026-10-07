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
import { sleep, speedDelay } from "@/lib/game-speed";
import { TOWER_SETUPS, towerMultiplier, type TowerMode, type TowerPattern } from "@/lib/originals";
import { cn } from "cn";

const MODES: { id: TowerMode; label: string }[] = [
  { id: "easy", label: "Easy" },
  { id: "medium", label: "Intermediate" },
  { id: "hard", label: "Hard" },
  { id: "expert", label: "Expert" },
  { id: "master", label: "Master" },
];

const PATTERNS: { id: TowerPattern; label: string; hint: string }[] = [
  { id: "classic", label: "Classic", hint: "Random each floor" },
  { id: "snake", label: "Snake", hint: "Walks one column per floor" },
  { id: "mirror", label: "Mirror", hint: "Edges, rotated by the seed" },
  { id: "edges", label: "Edges", hint: "Sides, rotated by the seed" },
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
  const { reportRound, notePlay } = useGameTable();
  const [amount, setAmount] = useState(0);
  const [mode, setMode] = useState<TowerMode>("medium");
  const [play, setPlay] = useState<"manual" | "auto">("manual");
  const [autoCol, setAutoCol] = useState<number | null>(null);
  const [autoFloors, setAutoFloors] = useState(4);
  const [pattern, setPattern] = useState<TowerPattern>("classic");
  const [roundId, setRoundId] = useState<string | null>(null);
  const [row, setRow] = useState(0);
  const [bombs, setBombs] = useState<number[][] | null>(null);
  const [picks, setPicks] = useState<number[]>([]);
  const [busy, setBusy] = useState(false);
  const setup = TOWER_SETUPS[mode];
  const rows = bombs?.length || setup.rows;
  const mult = towerMultiplier(row, setup.cols, setup.bombs);

  async function start() {
    notePlay();
    setBusy(true);
    try {
      const res = await startTower({ data: { gameId, currency, amount, mode, pattern } });
      setRoundId(res.roundId);
      setRow(0);
      setBombs(null);
      setPicks([]);
      if (play === "auto") await climb(res.roundId);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Bet failed");
    } finally {
      setBusy(false);
    }
  }

  async function climb(id: string) {
    const cols = TOWER_SETUPS[mode].cols;
    const stopAt = Math.max(1, Math.min(TOWER_SETUPS[mode].rows, autoFloors));
    let floor = 0;
    for (let n = 0; n < stopAt; n += 1) {
      const col = autoCol == null ? Math.floor(Math.random() * cols) : Math.min(autoCol, cols - 1);
      const res = await pickTower({ data: { roundId: id, col } });
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
          view: { kind: "tower", row: floor, boom: true },
        });
        toast.error("Death tile.");
        return;
      }
      setPicks((p) => [...p, col]);
      setRow(res.row);
      floor = res.row;
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
        return;
      }
      const step = speedDelay("step");
      if (step > 0) await sleep(step);
    }
    if (floor > 0) {
      const res = await cashTower({ data: { roundId: id } });
      applyBalances(res.balances);
      setBombs(res.bombs ?? null);
      setRoundId(null);
      reportRound({
        win: res.payout > 0,
        label: `Cash ${formatMultiplier(res.multiplier)}`,
        stake: amount,
        payout: res.payout,
        multiplier: res.multiplier,
      });
      toast.success(`Cashed ${formatMoney(res.payout, currency)} ${currency}`);
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
      setBombs(res.bombs ?? null);
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

  const live = Boolean(roundId);
  const currentProfit = row === 0 ? 0 : Math.max(0, amount * mult - amount);
  const nextMult = towerMultiplier(Math.min(rows, row + 1), setup.cols, setup.bombs);
  const nextProfit = Math.max(0, amount * nextMult - amount);
  const cashValue = row === 0 ? 0 : amount * mult;

  function randomTile() {
    if (!roundId || bombs) return;
    void pick(Math.floor(Math.random() * setup.cols));
  }

  return (
    <GameShell
      controls={
        <div className="flex min-h-full flex-col">
          <div className={cn("flex gap-1 rounded-md bg-[#202329] p-1.5", live && "pointer-events-none opacity-70")} role="tablist">
            {(["manual", "auto"] as const).map((tab) => (
              <button
                key={tab}
                type="button"
                aria-selected={play === tab}
                onClick={() => setPlay(tab)}
                className={cn(
                  "h-9 flex-1 rounded-md text-sm font-medium capitalize",
                  play === tab ? "bg-[#343843] text-white" : "text-[#bec6d1]",
                )}
              >
                {tab}
              </button>
            ))}
          </div>
          <div className="mt-6 grid gap-4">
            <div className={live ? "pointer-events-none opacity-70" : undefined}>
              <StakeField amount={amount} setAmount={setAmount} disabled={live} />
            </div>
            <div className="grid gap-1">
              <span className="text-xs font-medium">Difficulty</span>
              <div className="grid gap-1">
                {MODES.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    disabled={live}
                    onClick={() => setMode(item.id)}
                    className={cn(
                      "flex h-9 items-center justify-between rounded-md px-2.5 text-left text-xs",
                      mode === item.id ? "bg-lime font-semibold text-black" : "bg-[#202329] text-[#bec6d1]",
                      live && "opacity-70",
                    )}
                  >
                    <span>{item.label}</span>
                    <span className="tabular-nums opacity-80">{modeHint(item.id)}</span>
                  </button>
                ))}
              </div>
            </div>
            {play === "auto" && !live ? (
              <div className="grid gap-3">
                <div className="grid gap-1">
                  <span className="text-xs font-medium">Column</span>
                  <div className="grid grid-cols-4 gap-1">
                    <button
                      type="button"
                      onClick={() => setAutoCol(null)}
                      className={cn("h-9 rounded-md text-xs font-semibold", autoCol == null ? "bg-lime text-black" : "bg-[#202329] text-[#bec6d1]")}
                    >
                      Random
                    </button>
                    {Array.from({ length: setup.cols }, (_, col) => (
                      <button
                        key={col}
                        type="button"
                        onClick={() => setAutoCol(col)}
                        className={cn("h-9 rounded-md text-xs font-semibold", autoCol === col ? "bg-lime text-black" : "bg-[#202329] text-[#bec6d1]")}
                      >
                        {col + 1}
                      </button>
                    ))}
                  </div>
                </div>
                <FieldLabel label="Floors" hint={`Cash after ${autoFloors}`}>
                  <input
                    type="number"
                    min={1}
                    max={setup.rows}
                    value={autoFloors}
                    onChange={(e) => setAutoFloors(Math.max(1, Math.min(setup.rows, Number(e.target.value) || 1)))}
                    className="h-12 w-full rounded-md bg-[#202329] px-3 text-sm tabular-nums"
                  />
                </FieldLabel>
              </div>
            ) : null}
            {live ? null : (
              <FieldLabel label="Pattern" hint={PATTERNS.find((p) => p.id === pattern)?.hint}>
                <div className="grid grid-cols-2 gap-1">
                  {PATTERNS.map((item) => (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => setPattern(item.id)}
                      className={cn(
                        "h-9 rounded-md px-2 text-xs font-semibold",
                        pattern === item.id ? "bg-white text-black" : "bg-[#202329] text-[#bec6d1]",
                      )}
                    >
                      {item.label}
                    </button>
                  ))}
                </div>
              </FieldLabel>
            )}
          </div>
          {live ? (
            <div className="mt-4 grid gap-3">
              <button
                type="button"
                disabled={busy || Boolean(bombs)}
                onClick={randomTile}
                className="h-12 rounded-md bg-[#202329] text-sm font-medium"
              >
                Pick a random tile
              </button>
              <LimeBet disabled={busy || row === 0} onClick={() => void cash()}>
                Cash out {formatMoney(cashValue, currency)} {currency}
              </LimeBet>
              <section className="rounded-lg border border-[#2a2e38] px-4 py-4">
                <div className="mb-2 flex items-center justify-between text-xs font-medium">
                  <span>Current profit</span>
                  <span className="tabular-nums text-[#9ba5b4]">{formatMoney(currentProfit, currency)} {currency}</span>
                </div>
                <div className="flex items-center justify-between text-sm font-bold text-[#828998]">
                  <span className="tabular-nums">{formatMoney(currentProfit, currency)} {currency}</span>
                  <span className="tabular-nums">{row === 0 ? "0.00x" : formatMultiplier(mult)}</span>
                </div>
                <div className="my-2 flex items-center gap-2">
                  <span className="h-px flex-1 bg-[#202329]" />
                  <span className="grid size-6 place-items-center rounded-full bg-[#202329] text-[#9ba5b4]">
                    <svg viewBox="0 0 16 16" className="size-3.5" aria-hidden>
                      <path d="M4 6.5 8 10.5 12 6.5" fill="none" stroke="currentColor" strokeWidth="1.5" />
                    </svg>
                  </span>
                  <span className="h-px flex-1 bg-[#202329]" />
                </div>
                <div className="mb-2 flex items-center justify-between text-xs font-medium">
                  <span>Next tile profit</span>
                  <span className="tabular-nums text-[#9ba5b4]">{formatMoney(nextProfit, currency)} {currency}</span>
                </div>
                <div className="flex items-center justify-between text-sm font-bold text-lime">
                  <span className="tabular-nums">{formatMoney(nextProfit, currency)} {currency}</span>
                  <span className="tabular-nums">{formatMultiplier(nextMult)}</span>
                </div>
              </section>
            </div>
          ) : (
            <LimeBet className="mt-4" disabled={busy} onClick={() => void start()}>
              {busy ? "Playing" : play === "auto" ? "Start Autobet" : "Bet"}
            </LimeBet>
          )}
        </div>
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
