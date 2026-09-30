import { useState } from "react";
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
  const { reportRound } = useGameTable();
  const [mode, setMode] = useState<"manual" | "auto">("manual");
  const [roundId, setRoundId] = useState<string | null>(null);
  const [revealed, setRevealed] = useState<number[]>([]);
  const [mines, setMines] = useState<number[] | null>(null);
  const [multiplier, setMultiplier] = useState(1);
  const [busy, setBusy] = useState(false);
  const [amount, setAmount] = useState(0);
  const [mineCount, setMineCount] = useState(3);
  const [autoGems, setAutoGems] = useState(3);
  const [queue, setQueue] = useState<number[]>([]);

  const next = minesMultiplier(revealed.length + 1, mineCount, TILES);
  const live = Boolean(roundId);

  async function start() {
    const tiles = mode === "auto" ? queue.slice(0, Math.max(1, autoGems)) : [];
    if (mode === "auto" && tiles.length === 0) {
      toast.message("Select the tiles for autobet");
      return;
    }
    setBusy(true);
    try {
      const res = await startMines({ data: { gameId, currency, amount, mineCount } });
      setRoundId(res.roundId);
      setRevealed([]);
      setMines(null);
      setMultiplier(1);
      if (mode === "auto") await runAuto(res.roundId, tiles);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Bet failed");
    } finally {
      setBusy(false);
    }
  }

  async function runAuto(id: string, tiles: number[]) {
    const picked = new Set<number>();
    for (const index of tiles) {
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
                disabled={live || busy}
                className={cn(
                  "h-9 flex-1 rounded-md text-sm font-medium capitalize",
                  mode === tab ? "bg-[#343843] text-white" : "text-[#bec6d1]",
                )}
                onClick={() => setMode(tab)}
              >
                {tab}
              </button>
            ))}
          </div>
          <StakeField amount={amount} setAmount={setAmount} disabled={live || busy} />
          <div className="grid gap-1">
            <span className="text-xs font-medium">Mines</span>
            <div className="grid grid-cols-6 gap-1">
              {Array.from({ length: 24 }, (_, i) => i + 1).map((n) => (
                <button
                  key={n}
                  type="button"
                  disabled={live || busy}
                  className={cn(
                    "h-8 rounded-md text-xs font-semibold tabular-nums",
                    mineCount === n ? "bg-lime text-black" : "bg-[#202329] text-[#bec6d1]",
                  )}
                  onClick={() => setMineCount(n)}
                >
                  {n}
                </button>
              ))}
            </div>
          </div>
          {mode === "auto" ? (
            <label className="grid gap-1 text-xs font-medium">
              Gems to pick
              <input
                type="number"
                min={1}
                max={TILES - mineCount}
                value={autoGems}
                disabled={live || busy}
                onChange={(e) => setAutoGems(Math.max(1, Math.min(TILES - mineCount, Number(e.target.value) || 1)))}
                className="h-12 rounded-md bg-[#202329] px-3 text-sm tabular-nums"
              />
            </label>
          ) : null}
          {live && mode === "manual" ? (
            <LimeBet onClick={() => void cash()} disabled={revealed.length === 0}>
              Cash out {formatMultiplier(multiplier)}
            </LimeBet>
          ) : (
            <LimeBet disabled={busy || live || (mode === "auto" && queue.length === 0)} onClick={() => void start()}>
              {busy ? "Playing" : mode === "auto" ? "Start Autobet" : "Bet"}
            </LimeBet>
          )}
        </>
      }
      play={
        <div className="mx-auto flex w-full max-w-lg flex-col gap-3">
          <div className="flex items-center justify-between text-[11px] font-semibold tracking-[0.14em] text-muted-foreground uppercase">
            <span>{mineCount} mines</span>
            <span className="text-lime tabular-nums">
              {mode === "auto" && !live ? `${queue.length} selected` : live ? `Next ${formatMultiplier(next)}` : "Pick a tile"}
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
                  disabled={mode === "auto" && !live ? busy : !live || busy || picked || over}
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
