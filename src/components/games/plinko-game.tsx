import { useMemo, useState } from "react";
import { toast } from "sonner";
import { useWallet } from "@/lib/wallet-context";
import { playInstant } from "@/lib/casino-api";
import { PlayGate } from "@/components/games/play-gate";
import { GameShell, LimeBet } from "@/components/games/game-shell";
import { useGameTable } from "@/components/games/game-table";
import { FieldLabel, StakeField } from "@/components/games/stake-field";
import { HistoryPill } from "@/components/games/bet-pills";
import { formatMoney, formatMultiplier } from "@/lib/format";
import { playSfx } from "@/lib/game-sound";
import { sleep, speedDelay } from "@/lib/game-speed";
import { plinkoMultipliers } from "@/lib/originals";
import { cn } from "cn";

type Rows = 8 | 12 | 16;
type Risk = "low" | "medium" | "high";

export function PlinkoGame({ gameId }: { gameId: string }) {
  return (
    <PlayGate>
      <PlinkoTable gameId={gameId} />
    </PlayGate>
  );
}

function PlinkoTable({ gameId }: { gameId: string }) {
  const { currency, applyBalances } = useWallet();
  const { reportRound } = useGameTable();
  const [rows, setRows] = useState<Rows>(12);
  const [risk, setRisk] = useState<Risk>("medium");
  const [amount, setAmount] = useState(0);
  const [busy, setBusy] = useState(false);
  const [path, setPath] = useState<number[]>([]);
  const [frame, setFrame] = useState(0);
  const [bucket, setBucket] = useState<number | null>(null);
  const [history, setHistory] = useState<number[]>([]);
  const table = useMemo(() => plinkoMultipliers(rows, risk), [rows, risk]);

  async function onDrop() {
    setBusy(true);
    setBucket(null);
    try {
      const res = await playInstant({ data: { gameId, currency, amount, rows, risk } });
      applyBalances(res.balances);
      const landed = Number(res.detail.number);
      const next = res.detail.path ?? pathForBucket(landed, rows);
      const step = speedDelay("step");
      setPath(next);
      setFrame(0);
      if (step > 0) {
        await sleep(16);
        for (let i = 1; i <= next.length; i += 1) {
          setFrame(i);
          playSfx("tick");
          await sleep(Math.max(42, step));
        }
      } else {
        setFrame(next.length);
      }
      setBucket(landed);
      const m = Number(res.detail.roll);
      setHistory((h) => [m, ...h].slice(0, 14));
      reportRound({
        win: m >= 1,
        label: `Bin ${landed} · ${formatMultiplier(m)}`,
        stake: amount,
        payout: res.payout,
        multiplier: m,
        fair: res.fair,
        view: { kind: "plinko", bucket: landed, multiplier: m },
      });
      if (m >= 1) playSfx("win");
      else playSfx("lose");
      if (res.payout > amount) toast.success(`Won ${formatMoney(res.payout, currency)} ${currency}`);
      else toast.message(formatMultiplier(m));
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Drop failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <GameShell
      controls={
        <>
          <LimeBet disabled={busy} onClick={() => void onDrop()}>
            {busy ? "Dropping" : "Drop"}
          </LimeBet>
          <div className="space-y-3">
            <StakeField amount={amount} setAmount={setAmount} disabled={busy} />
            <FieldLabel label="Rows">
              <div className="grid grid-cols-3 gap-1">
                {([8, 12, 16] as const).map((n) => (
                  <button
                    key={n}
                    type="button"
                    disabled={busy}
                    className={cn("h-10 rounded-lg text-sm font-semibold", rows === n ? "bg-lime text-black" : "bg-muted text-muted-foreground")}
                    onClick={() => {
                      setRows(n);
                      setPath([]);
                      setFrame(0);
                      setBucket(null);
                    }}
                  >
                    {n}
                  </button>
                ))}
              </div>
            </FieldLabel>
            <FieldLabel label="Risk">
              <div className="grid grid-cols-3 gap-1">
                {(["low", "medium", "high"] as const).map((r) => (
                  <button
                    key={r}
                    type="button"
                    disabled={busy}
                    className={cn(
                      "h-10 rounded-lg text-xs font-semibold capitalize",
                      risk === r ? "bg-lime text-black" : "bg-muted text-muted-foreground",
                    )}
                    onClick={() => setRisk(r)}
                  >
                    {r}
                  </button>
                ))}
              </div>
            </FieldLabel>
          </div>
        </>
      }
      play={
        <div className="flex w-full flex-col gap-3">
          <div className="flex items-center gap-2">
            <span className="shrink-0 text-[10px] font-semibold tracking-[0.16em] text-muted-foreground uppercase">Drops</span>
            <div className="flex min-w-0 flex-1 gap-1 overflow-x-auto">
              {history.length === 0 ? (
                <span className="text-[11px] text-muted-foreground">No drops yet</span>
              ) : (
                history.map((n, i) => <HistoryPill key={`${n}-${i}`} label={formatMultiplier(n)} />)
              )}
            </div>
          </div>
          <PlinkoBoard rows={rows} table={table} path={path} frame={frame} bucket={bucket} />
        </div>
      }
    />
  );
}

function pathForBucket(bucket: number, rows: number): number[] {
  const steps = Array<number>(rows).fill(0);
  let placed = 0;
  if (bucket <= 0) return steps;
  for (let i = 0; i < bucket; i += 1) {
    const idx = Math.min(rows - 1, Math.max(0, Math.round(((i + 0.5) * rows) / bucket) - 1));
    if (steps[idx] === 0) {
      steps[idx] = 1;
      placed += 1;
    }
  }
  for (let i = 0; placed < bucket && i < rows; i += 1) {
    if (steps[i] === 0) {
      steps[i] = 1;
      placed += 1;
    }
  }
  return steps;
}

function ballPoint(path: number[], step: number, rows: number) {
  const done = Math.min(step, path.length, rows);
  let rights = 0;
  for (let i = 0; i < done; i += 1) rights += path[i] ?? 0;
  if (done === 0) return { x: 50, y: 4 };
  const span = (done / rows) * 92;
  const left = (100 - span) / 2;
  return {
    x: left + ((rights + 0.5) / (done + 1)) * span,
    y: 8 + (done / rows) * 78,
  };
}

function binTone(m: number, hot: boolean) {
  if (hot) return "bg-lime text-black";
  if (m >= 10) return "bg-[#14f1d9] text-black";
  if (m >= 2) return "bg-lime/85 text-black";
  if (m >= 1) return "bg-[#2c3344] text-white";
  return "bg-[#3a1d28] text-[#ff8b7b]";
}

function PlinkoBoard({
  rows,
  table,
  path,
  frame,
  bucket,
}: {
  rows: number;
  table: number[];
  path: number[];
  frame: number;
  bucket: number | null;
}) {
  const ball = ballPoint(path, frame, rows);
  const landed = frame >= rows && bucket != null;
  return (
    <div className="relative w-full overflow-hidden rounded-xl bg-[#0c0e12] px-3 pt-4 pb-3 ring-1 ring-white/10">
      <div className="relative mx-auto h-[420px] w-full max-w-xl">
        {Array.from({ length: rows }).map((_, r) => {
          const count = r + 3;
          const span = ((r + 1) / rows) * 92;
          const left = (100 - span) / 2;
          const y = 8 + ((r + 0.45) / rows) * 74;
          return Array.from({ length: count }).map((__, i) => {
            const x = count === 1 ? 50 : left + (i / (count - 1)) * span;
            return (
              <span
                key={`${r}-${i}`}
                className="absolute size-1.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-white/35 sm:size-2"
                style={{ left: `${x}%`, top: `${y}%` }}
              />
            );
          });
        })}
        {path.length > 0 ? (
          <span
            className="absolute z-10 size-3.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-lime shadow-[0_0_14px_#c6ff4a]"
            style={{ left: `${ball.x}%`, top: `${ball.y}%`, transition: frame === 0 ? "none" : "left 90ms linear, top 90ms linear" }}
          />
        ) : (
          <span className="absolute top-[4%] left-1/2 size-3.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-lime/80" />
        )}
        <div className="absolute inset-x-[4%] bottom-0 grid gap-0.5" style={{ gridTemplateColumns: `repeat(${table.length}, minmax(0, 1fr))` }}>
          {table.map((m, i) => (
            <div
              key={i}
              className={cn(
                "rounded py-1.5 text-center text-[0.55rem] font-bold tabular-nums sm:text-[0.7rem]",
                binTone(m, landed && bucket === i),
              )}
            >
              {m}x
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
