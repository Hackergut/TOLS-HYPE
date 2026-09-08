import { useState } from "react";
import { toast } from "sonner";
import { useWallet } from "@/lib/wallet-context";
import { playInstant } from "@/lib/casino-api";
import { PlayGate } from "@/components/games/play-gate";
import { GameShell, LimeBet } from "@/components/games/game-shell";
import { RouletteWheel } from "@/components/games/roulette-wheel";
import { useGameTable } from "@/components/games/game-table";
import { StakeField } from "@/components/games/stake-field";
import { formatMoney } from "@/lib/format";
import { CURRENCY_META } from "@/lib/games-catalog";

const CHOICES = [
  { id: "red", label: "Red" },
  { id: "black", label: "Black" },
  { id: "green", label: "Zero" },
];

export function RouletteGame({ gameId }: { gameId: string }) {
  return (
    <PlayGate>
      <RouletteTable gameId={gameId} />
    </PlayGate>
  );
}

function RouletteTable({ gameId }: { gameId: string }) {
  const { currency, applyBalances } = useWallet();
  const { reportRound } = useGameTable();
  const meta = CURRENCY_META[currency];
  const [choice, setChoice] = useState("red");
  const [spinning, setSpinning] = useState(false);
  const [amount, setAmount] = useState(meta.minBet);
  const [result, setResult] = useState<{ number: number; color: string; payout: number } | null>(
    null,
  );

  async function play() {
    setSpinning(true);
    try {
      const res = await playInstant({ data: { gameId, currency, amount, choice } });
      applyBalances(res.balances);
      const next = {
        number: Number(res.detail.number),
        color: String(res.detail.color),
        payout: res.payout,
      };
      setResult(next);
      reportRound({
        win: res.payout > 0,
        label: `${next.color} ${next.number}`,
        stake: amount,
        payout: res.payout,
        multiplier: amount ? res.payout / amount : 0,
        fair: res.fair,
        view: { kind: "roulette", number: next.number, color: next.color },
        replay: () => setResult(next),
      });
      if (res.payout > 0) toast.success(`Won ${formatMoney(res.payout, currency)} ${currency}`);
      else toast.message("No hit");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Spin failed");
    } finally {
      setSpinning(false);
    }
  }

  return (
    <GameShell
      controls={
        <>
          <StakeField amount={amount} setAmount={setAmount} disabled={spinning} />
          <div className="grid grid-cols-3 gap-2">
            {CHOICES.map((c) => (
              <button
                key={c.id}
                type="button"
                onClick={() => setChoice(c.id)}
                className={`h-11 rounded-lg text-sm font-medium ${
                  choice === c.id
                    ? c.id === "green"
                      ? "bg-lime text-primary"
                      : "bg-[#2a2a2c] text-lime ring-1 ring-lime"
                    : "bg-[#151517] text-muted-foreground hover:text-lime"
                }`}
              >
                {c.label}
              </button>
            ))}
          </div>
          <LimeBet disabled={spinning} onClick={() => void play()}>
            Bet
          </LimeBet>
        </>
      }
      play={
        <div className="flex flex-col items-center justify-center py-6">
          <RouletteWheel number={result?.number ?? null} spinning={spinning} />
          <p className="mt-5 font-heading text-3xl font-semibold tabular-nums text-lime">
            {result ? result.number : "—"}
          </p>
          <p className="mt-1 text-sm text-muted-foreground">
            {result ? `${result.color} · European single zero` : "Pick a color, then bet"}
          </p>
        </div>
      }
    />
  );
}
