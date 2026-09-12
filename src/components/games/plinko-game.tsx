import { useMemo, useState } from "react";
import { toast } from "sonner";
import { useWallet } from "@/lib/wallet-context";
import { playInstant } from "@/lib/casino-api";
import { PlayGate } from "@/components/games/play-gate";
import { GameShell, LimeBet } from "@/components/games/game-shell";
import { useGameTable } from "@/components/games/game-table";
import { FieldLabel, StakeField } from "@/components/games/stake-field";
import { formatMoney, formatMultiplier } from "@/lib/format";
import { playSfx } from "@/lib/game-sound";
import { sleep, speedDelay } from "@/lib/game-speed";
import { plinkoMultipliers } from "@/lib/originals";
import { cn } from "cn";

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
  const [rows, setRows] = useState<8 | 12 | 16>(8);
  const [risk, setRisk] = useState<"low" | "medium" | "high">("medium");
  const [amount, setAmount] = useState(0);
  const [busy, setBusy] = useState(false);
  const [bucket, setBucket] = useState<number | null>(null);
  const table = useMemo(() => plinkoMultipliers(rows, risk), [rows, risk]);

  async function onDrop() {
    setBusy(true);
    try {
      const res = await playInstant({ data: { gameId, currency, amount, rows, risk } });
      applyBalances(res.balances);
      const b = Number(res.detail.number);
      const step = speedDelay("step");
      if (step > 0) {
        for (let i = 0; i < rows; i += 1) {
          setBucket(Math.floor(Math.random() * table.length));
          playSfx("tick");
          await sleep(step);
        }
      }
      setBucket(b);
      const m = Number(res.detail.roll);
      const win = m >= 1;
      reportRound({
        win,
        label: `Bin ${b} · ${formatMultiplier(m)}`,
        stake: amount,
        payout: res.payout,
        multiplier: m,
        fair: res.fair,
        view: { kind: "plinko", bucket: b, multiplier: m },
      });
      if (res.payout > amount) toast.success(`Won ${formatMoney(res.payout, currency)} ${currency}`);
      else toast.message(`${formatMultiplier(m)}`);
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
            Drop
          </LimeBet>
          <div className="space-y-3">
            <StakeField amount={amount} setAmount={setAmount} />
            <FieldLabel label="Rows">
              <div className="grid grid-cols-3 gap-1">
                {([8, 12, 16] as const).map((n) => (
                  <button
                    key={n}
                    type="button"
                    className={cn("h-10 rounded-lg text-sm", rows === n ? "bg-lime text-black" : "bg-muted")}
                    onClick={() => setRows(n)}
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
                    className={cn("h-10 rounded-lg text-xs capitalize", risk === r ? "bg-lime text-black" : "bg-muted")}
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
        <div className="flex flex-col gap-3 py-4">
          <div className="mx-auto grid max-w-lg" style={{ gridTemplateColumns: `repeat(${table.length}, minmax(0, 1fr))` }}>
            {table.map((_, i) => (
              <div key={i} className="flex flex-col items-center gap-1 py-1">
                {Array.from({ length: rows }).map((_, r) => (
                  <span key={r} className="size-1.5 rounded-full bg-white/25 sm:size-2" />
                ))}
              </div>
            ))}
          </div>
          <div className="mx-auto grid w-full max-w-lg gap-0.5" style={{ gridTemplateColumns: `repeat(${table.length}, minmax(0, 1fr))` }}>
            {table.map((m, i) => (
              <div
                key={i}
                className={cn(
                  "rounded-md py-2 text-center text-[0.6rem] tabular-nums sm:text-xs",
                  bucket === i ? "bg-lime text-black" : m >= 2 ? "bg-violet-600/80" : "bg-muted",
                )}
              >
                {m}×
              </div>
            ))}
          </div>
        </div>
      }
    />
  );
}
