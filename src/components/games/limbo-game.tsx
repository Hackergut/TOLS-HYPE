import { useState } from "react";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { useWallet } from "@/lib/wallet-context";
import { playInstant } from "@/lib/casino-api";
import { PlayGate } from "@/components/games/play-gate";
import { GameShell, LimeBet } from "@/components/games/game-shell";
import { useGameTable } from "@/components/games/game-table";
import { FieldLabel, StakeField } from "@/components/games/stake-field";
import { formatMoney } from "@/lib/format";
import { playSfx } from "@/lib/game-sound";
import { sleep, speedDelay } from "@/lib/game-speed";
import { payoutFromChance } from "@/lib/originals";

export function LimboGame({ gameId }: { gameId: string }) {
  return (
    <PlayGate>
      <LimboTable gameId={gameId} />
    </PlayGate>
  );
}

function LimboTable({ gameId }: { gameId: string }) {
  const { currency, applyBalances } = useWallet();
  const { reportRound } = useGameTable();
  const [target, setTarget] = useState(2);
  const [amount, setAmount] = useState(0);
  const [busy, setBusy] = useState(false);
  const [last, setLast] = useState<number | null>(null);
  const [hit, setHit] = useState<boolean | null>(null);

  const chance = Math.min(99, Math.max(0.01, (0.99 * 100) / Math.max(1.01, target)));
  const profit = amount * (target - 1);

  async function onBet() {
    setBusy(true);
    try {
      const res = await playInstant({ data: { gameId, currency, amount, target } });
      applyBalances(res.balances);
      const crash = Number(res.detail.roll);
      const step = speedDelay("step");
      if (step > 0) {
        for (let i = 0; i < 6; i += 1) {
          setLast(1 + Math.random() * target * 2);
          setHit(null);
          playSfx("tick");
          await sleep(step);
        }
      }
      const win = crash >= target;
      setLast(crash);
      setHit(win);
      reportRound({
        win,
        label: `${crash.toFixed(2)}× · ${win ? "hit" : "under"}`,
        stake: amount,
        payout: res.payout,
        multiplier: win ? target : 0,
        fair: res.fair,
        view: { kind: "limbo", roll: crash, target },
      });
      if (res.payout > 0) toast.success(`Won ${formatMoney(res.payout, currency)} ${currency}`);
      else toast.message("Under target");
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
          <LimeBet disabled={busy} onClick={() => void onBet()}>
            Bet
          </LimeBet>
          <div className="space-y-3">
            <StakeField amount={amount} setAmount={setAmount} />
            <FieldLabel label="Target">
              <Input
                type="number"
                min={1.01}
                step={0.01}
                value={target}
                onChange={(e) => setTarget(Math.max(1.01, Number(e.target.value) || 1.01))}
                className="h-11 tabular-nums"
              />
            </FieldLabel>
            <p className="text-xs text-muted-foreground">
              Chance {chance.toFixed(2)}% · {payoutFromChance(chance).toFixed(2)}× · profit {formatMoney(profit, currency)}
            </p>
          </div>
        </>
      }
      play={
        <div className="flex flex-col items-center justify-center gap-4 py-10">
          <p className="font-heading text-6xl tabular-nums text-lime md:text-8xl">
            {last == null ? "1.00×" : `${last.toFixed(2)}×`}
          </p>
          <p className={`text-sm ${hit == null ? "text-muted-foreground" : hit ? "text-lime" : "text-destructive"}`}>
            {hit == null ? `Target ${target.toFixed(2)}×` : hit ? "Hit" : "Bust"}
          </p>
        </div>
      }
    />
  );
}
