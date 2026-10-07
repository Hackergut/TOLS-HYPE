import { useRef, useState } from "react";
import { toast } from "sonner";
import { useWallet } from "@/lib/wallet-context";
import { cashOutMines, revealMine, startMines } from "@/lib/casino-api";
import { PlayGate } from "@/components/games/play-gate";
import { GameShell, LimeBet } from "@/components/games/game-shell";
import { useGameTable } from "@/components/games/game-table";
import { StakeField } from "@/components/games/stake-field";
import { formatMoney, formatMultiplier } from "@/lib/format";
import { minesMultiplier } from "@/lib/originals";
import { playSfx } from "@/lib/game-sound";
import { sleep, speedDelay } from "@/lib/game-speed";
import { cn } from "cn";

const TILES = 25;

export function MinesGame({ gameId }: { gameId: string }) {
  return (
    <PlayGate>
      <MinesTable gameId={gameId} />
    </PlayGate>
  );
}

function MinesTable({ gameId }: { gameId: string }) {
  const { currency, applyBalances } = useWallet();
  const { reportRound, notePlay } = useGameTable();
  const [mode, setMode] = useState<"manual" | "auto">("manual");
  const [roundId, setRoundId] = useState<string | null>(null);
  const [revealed, setRevealed] = useState<number[]>([]);
  const [mines, setMines] = useState<number[] | null>(null);
  const [multiplier, setMultiplier] = useState(1);
  const [busy, setBusy] = useState(false);
  const [amount, setAmount] = useState(0);
  const [mineCount, setMineCount] = useState(3);
  const [autoGems, setAutoGems] = useState(3);
  const [autoN, setAutoN] = useState(0);
  const [autoOn, setAutoOn] = useState(false);
  const [queue, setQueue] = useState<number[]>([]);
  const stopRef = useRef(false);
  const runningRef = useRef(false);

  const next = minesMultiplier(revealed.length + 1, mineCount, TILES);
  const live = Boolean(roundId);

  function tilesForAuto() {
    const cap = Math.max(1, Math.min(autoGems, TILES - mineCount));
    if (queue.length) return queue.slice(0, cap);
    const bag = Array.from({ length: TILES }, (_, i) => i);
    for (let i = bag.length - 1; i > 0; i -= 1) {
      const j = Math.floor(Math.random() * (i + 1));
      const swap = bag[i]!;
      bag[i] = bag[j]!;
      bag[j] = swap;
    }
    return bag.slice(0, cap);
  }

  async function playAutoRound(tiles: number[]) {
    notePlay();
    const res = await startMines({ data: { gameId, currency, amount, mineCount } });
    setRoundId(res.roundId);
    setRevealed([]);
    setMines(null);
    setMultiplier(1);
    try {
      await runAuto(res.roundId, tiles);
    } catch (err) {
      setRoundId(null);
      throw err;
    }
  }

  async function startAuto() {
    if (runningRef.current) {
      stopRef.current = true;
      setAutoOn(false);
      return;
    }
    const tiles = tilesForAuto();
    stopRef.current = false;
    runningRef.current = true;
    setAutoOn(true);
    const cap = autoN > 0 ? Math.min(autoN, 100) : 100;
    let ran = 0;
    try {
      for (let i = 0; i < cap && !stopRef.current; i += 1) {
        await playAutoRound(tiles);
        ran += 1;
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Autobet failed");
    }
    if (autoN === 0 && ran >= cap && !stopRef.current) toast.message("Autobet stopped at 100");
    stopRef.current = false;
    runningRef.current = false;
    setAutoOn(false);
    setBusy(false);
  }

  async function start() {
    setBusy(true);
    try {
      const res = await startMines({ data: { gameId, currency, amount, mineCount } });
      setRoundId(res.roundId);
      setRevealed([]);
      setMines(null);
      setMultiplier(1);
    } catch (err) {
      setRoundId(null);
      toast.error(err instanceof Error ? err.message : "Bet failed");
    } finally {
      setBusy(false);
    }
  }

  async function runAuto(id: string, tiles: number[]) {
    const picked = new Set<number>();
    for (const index of tiles) {
      if (stopRef.current && picked.size > 0) break;
      if (picked.has(index)) continue;
      picked.add(index);
      const res = await revealMine({ data: { roundId: id, index } });
      setRevealed(res.revealed);
      setMultiplier(res.multiplier);
      if (res.boom) {
        setMines(res.mines);
        if (res.balances) applyBalances(res.balances);
        setRoundId(null);
        playSfx("boom");
        reportRound({
          win: false,
          label: "Mine",
          stake: amount,
          payout: 0,
          multiplier: 0,
          view: { kind: "mines", boom: true, multiplier: 0, revealed: res.revealed, mines: res.mines },
        });
        toast.error("Mine. Round over.");
        return;
      }
      playSfx("gem");
      const step = speedDelay("step");
      if (step > 0) await sleep(step);
    }
    const cashed = await cashOutMines({ data: { roundId: id } });
    applyBalances(cashed.balances);
    setMines(cashed.mines);
    setMultiplier(cashed.multiplier);
    setRoundId(null);
    playSfx("cash");
    reportRound({
      win: true,
      label: `Cashout ${cashed.multiplier.toFixed(2)}×`,
      stake: amount,
      payout: cashed.payout,
      multiplier: cashed.multiplier,
      view: { kind: "mines", boom: false, multiplier: cashed.multiplier, revealed: [...picked], mines: cashed.mines },
    });
    toast.success(`Cashed ${formatMoney(cashed.payout, currency)} ${currency}`);
  }

  async function reveal(index: number) {
    if (!roundId || mines || mode === "auto") return;
    try {
      const res = await revealMine({ data: { roundId, index } });
      setRevealed(res.revealed);
      setMultiplier(res.multiplier);
      if (res.boom) {
        setMines(res.mines);
        if (res.balances) applyBalances(res.balances);
        setRoundId(null);
        playSfx("boom");
        reportRound({
          win: false,
          label: "Mine",
          stake: amount,
          payout: 0,
          multiplier: 0,
          view: { kind: "mines", boom: true, multiplier: 0, revealed: res.revealed, mines: res.mines },
          replay: () => {
            setRevealed(res.revealed);
            setMines(res.mines);
          },
        });
        toast.error("Mine. Round over.");
      } else {
        playSfx("gem");
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Reveal failed");
    }
  }

  async function cash() {
    if (!roundId) return;
    try {
      const res = await cashOutMines({ data: { roundId } });
      applyBalances(res.balances);
      setMines(res.mines);
      setRoundId(null);
      playSfx("cash");
      reportRound({
        win: true,
        label: `Cashout ${res.multiplier.toFixed(2)}×`,
        stake: amount,
        payout: res.payout,
        multiplier: res.multiplier,
        view: { kind: "mines", boom: false, multiplier: res.multiplier, revealed, mines: res.mines },
        replay: () => setMines(res.mines),
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
          <div className="flex gap-1 rounded-md bg-[#202329] p-1.5" role="tablist">
            {(["manual", "auto"] as const).map((tab) => (
              <button
                key={tab}
                type="button"
                role="tab"
                aria-selected={mode === tab}
                disabled={live || busy || autoOn}
                className={cn(
                  "h-9 flex-1 rounded-md text-sm font-medium capitalize",
                  mode === tab ? "bg-[#343843] text-white" : "text-[#bec6d1]",
                )}
                onClick={() => setMode(tab)}
              >
                {tab === "manual" ? "Manual" : "Auto"}
              </button>
            ))}
          </div>
          <StakeField amount={amount} setAmount={setAmount} disabled={live || busy || autoOn} />
          <label className="grid gap-1">
            <span className="text-xs font-medium leading-[18px]">Mines</span>
            <div className="relative">
              <select
                aria-label="Mines"
                value={mineCount}
                disabled={live || busy || autoOn}
                onChange={(e) => setMineCount(Number(e.target.value))}
                className="h-12 w-full appearance-none rounded-md bg-[#202329] px-4 text-sm disabled:cursor-not-allowed disabled:opacity-50"
              >
                {Array.from({ length: 24 }, (_, i) => i + 1).map((n) => (
                  <option key={n} value={n}>
                    {n}
                  </option>
                ))}
              </select>
              <svg viewBox="0 0 16 16" className="pointer-events-none absolute top-1/2 right-4 size-4 -translate-y-1/2" aria-hidden>
                <path d="M3 6.2 8 11l5-4.8" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
              </svg>
            </div>
          </label>
          {mode === "auto" ? (
            <>
            <label className="grid gap-1 text-xs font-medium">
              Gems to pick
              <input
                type="number"
                min={1}
                max={TILES - mineCount}
                value={autoGems}
                disabled={autoOn}
                onChange={(e) => setAutoGems(Math.max(1, Math.min(TILES - mineCount, Number(e.target.value) || 1)))}
                className="h-12 rounded-md bg-[#202329] px-4 text-sm tabular-nums disabled:cursor-not-allowed disabled:opacity-50"
              />
            </label>
            <label className="grid gap-1">
              <span className="text-xs font-medium">Number of bets</span>
              <div className="relative">
                <input
                  type="number"
                  min={0}
                  disabled={autoOn}
                  value={autoN}
                  onChange={(e) => setAutoN(Math.max(0, Math.floor(Number(e.target.value) || 0)))}
                  className="h-12 w-full rounded-md bg-[#202329] pr-14 pl-4 text-sm tabular-nums outline-none disabled:opacity-50"
                />
                <button
                  type="button"
                  disabled={autoOn}
                  onClick={() => setAutoN(0)}
                  className={cn(
                    "absolute top-1/2 right-2 grid size-8 -translate-y-1/2 place-items-center rounded-md bg-[#2a2e38] text-xs",
                    autoN === 0 && "border border-white",
                  )}
                  aria-label="Infinite"
                >
                  ∞
                </button>
              </div>
            </label>
            </>
          ) : null}
          {live && mode === "manual" ? (
            <LimeBet onClick={() => void cash()} disabled={revealed.length === 0}>
              Cash out {formatMultiplier(multiplier)}
            </LimeBet>
          ) : (
            <LimeBet disabled={mode === "auto" ? false : busy || live} onClick={() => void (mode === "auto" ? startAuto() : start())}>
              {mode === "auto" ? (autoOn ? "Stop Autobet" : "Start Autobet") : busy ? "Playing" : "Bet"}
            </LimeBet>
          )}
        </>
      }
      play={
        <div className="mx-auto flex w-full max-w-lg flex-col gap-3">
          <div className="flex items-center justify-between text-[11px] font-semibold tracking-[0.14em] text-muted-foreground uppercase">
            <span>{mineCount} mines</span>
            <span className="text-lime tabular-nums">
              {mode === "auto" && !live
                ? queue.length
                  ? `${Math.min(queue.length, autoGems)} selected`
                  : `Auto picks ${Math.max(1, Math.min(autoGems, TILES - mineCount))}`
                : live
                  ? `Next ${formatMultiplier(next)}`
                  : "Pick a tile"}
            </span>
          </div>
          <div className="grid grid-cols-5 gap-2">
            {Array.from({ length: TILES }).map((_, i) => {
              const isMine = mines?.includes(i) ?? false;
              const picked = revealed.includes(i);
              const over = Boolean(mines);
              const gem = picked || (over && !isMine);
              const bomb = over && isMine;
              const queued = mode === "auto" && !live && queue.includes(i);
              return (
                <button
                  key={i}
                  type="button"
                  disabled={mode === "auto" && !live ? autoOn : !live || busy || picked || over}
                  onClick={() => {
                    if (mode === "auto" && !live) {
                      setQueue((cur) => {
                        if (cur.includes(i)) return cur.filter((n) => n !== i);
                        if (cur.length >= Math.min(autoGems, TILES - mineCount)) return cur;
                        return [...cur, i];
                      });
                      playSfx("click");
                      return;
                    }
                    void reveal(i);
                  }}
                  className={cn(
                    "grid aspect-square place-items-center rounded-lg bg-[#2a2e38] transition hover:brightness-125 disabled:hover:brightness-100",
                    queued && "ring-2 ring-lime",
                    picked && "bg-[#10261c] ring-1 ring-[#14f1d9]/70",
                    bomb && picked && "bg-[#3a1420] ring-1 ring-[#ff5b73]",
                    bomb && !picked && "bg-[#241018]",
                  )}
                  aria-label={`Tile ${i + 1}`}
                >
                  {queued ? <span className="text-xs font-bold text-lime">{queue.indexOf(i) + 1}</span> : null}
                  {bomb ? <Bomb dim={!picked} /> : gem ? <Gem dim={!picked} /> : null}
                </button>
              );
            })}
          </div>
        </div>
      }
    />
  );
}

function Gem({ dim }: { dim?: boolean }) {
  return (
    <svg viewBox="0 0 64 64" className={cn("size-1/2", dim && "opacity-35")} aria-hidden>
      <path d="M32 4 10 24l22 36 22-36L32 4z" fill="#14f1d9" />
      <path d="M32 10 16 24l16 26 16-26L32 10z" fill="#c6ff4a" />
      <path d="M32 10 24 24h16L32 10z" fill="#fff" opacity="0.7" />
    </svg>
  );
}

function Bomb({ dim }: { dim?: boolean }) {
  return (
    <svg viewBox="0 0 64 64" className={cn("size-1/2", dim && "opacity-45")} aria-hidden>
      <circle cx="30" cy="38" r="16" fill="#ff5b73" />
      <circle cx="24" cy="32" r="4" fill="#fff" opacity="0.35" />
      <path d="M40 24c6-6 10-8 14-8" stroke="#ffb4a8" strokeWidth="3" fill="none" strokeLinecap="round" />
      <circle cx="54" cy="14" r="3" fill="#c6ff4a" />
    </svg>
  );
}
