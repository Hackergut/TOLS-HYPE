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
import { playSfx } from "@/lib/game-sound";
import { sleep, speedDelay } from "@/lib/game-speed";
import { rouletteColor, rouletteMultiplier } from "@/lib/rng";
import { cn } from "cn";

const OUTSIDE: { id: string; label: string; pay: string }[] = [
  { id: "low", label: "1–18", pay: "2×" },
  { id: "even", label: "Even", pay: "2×" },
  { id: "red", label: "Red", pay: "2×" },
  { id: "black", label: "Black", pay: "2×" },
  { id: "odd", label: "Odd", pay: "2×" },
  { id: "high", label: "19–36", pay: "2×" },
];

const DOZENS: { id: string; label: string }[] = [
  { id: "dozen1", label: "1st 12" },
  { id: "dozen2", label: "2nd 12" },
  { id: "dozen3", label: "3rd 12" },
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
  const [amount, setAmount] = useState(0);
  const [result, setResult] = useState<{ number: number; color: string; payout: number } | null>(null);

  function pick(next: string) {
    if (spinning) return;
    setChoice(next);
    playSfx("click");
  }

  async function play() {
    setSpinning(true);
    playSfx("spin");
    try {
      const res = await playInstant({ data: { gameId, currency, amount, choice } });
      applyBalances(res.balances);
      const next = {
        number: Number(res.detail.number),
        color: String(res.detail.color),
        payout: res.payout,
      };
      await sleep(speedDelay("spin"));
      setResult(next);
      setSpinning(false);
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
      setSpinning(false);
    }
  }

  const preview = rouletteMultiplier(result?.number ?? -1, choice);
  const color = result ? rouletteColor(result.number) : null;

  return (
    <GameShell
      controls={
        <>
          <StakeField amount={amount} setAmount={setAmount} disabled={spinning} />
          <p className="text-xs text-muted-foreground">
            {choiceLabel(choice)} · {choicePay(choice)}
          </p>
          <LimeBet disabled={spinning} onClick={() => void play()}>
            Spin
          </LimeBet>
        </>
      }
      play={
        <div className="tols-felt mx-auto flex w-full max-w-xl flex-col items-stretch gap-5 rounded-md p-4 md:p-5">
          <div className="flex flex-col items-center">
            <RouletteWheel number={result?.number ?? null} spinning={spinning} durationMs={speedDelay("spin") || 200} />
            <p
              className={cn(
                "mt-3 font-heading text-2xl font-semibold tabular-nums",
                color === "black" ? "text-purple" : "text-lime",
              )}
            >
              {result ? result.number : "—"}
            </p>
          </div>

          <div className="grid grid-cols-[2.25rem_repeat(12,minmax(0,1fr))] gap-1">
            <button
              type="button"
              aria-pressed={choice === "green" || choice === "0"}
              onClick={() => pick("green")}
              className="tols-cell tols-cell-lime row-span-3 min-h-[4.5rem] rounded-sm text-sm"
            >
              0
            </button>
            {[3, 2, 1].map((row) =>
              Array.from({ length: 12 }, (_, i) => {
                const n = i * 3 + row;
                const c = rouletteColor(n);
                return (
                  <button
                    key={n}
                    type="button"
                    aria-pressed={choice === String(n) || (result?.number === n && !spinning)}
                    aria-label={`${c} ${n}`}
                    onClick={() => pick(String(n))}
                    className={cn(
                      "tols-cell min-h-8 rounded-sm text-[0.65rem]",
                      c === "black" ? "tols-cell-purple" : "tols-cell-lime",
                    )}
                  >
                    {n}
                  </button>
                );
              }),
            )}
          </div>

          <div className="grid grid-cols-3 gap-1">
            {DOZENS.map((d) => (
              <button
                key={d.id}
                type="button"
                aria-pressed={choice === d.id}
                onClick={() => pick(d.id)}
                className="tols-bar h-8 rounded-sm text-[0.65rem]"
              >
                {d.label}
              </button>
            ))}
          </div>

          <div className="grid grid-cols-6 gap-1">
            {OUTSIDE.map((b) => (
              <button
                key={b.id}
                type="button"
                aria-pressed={choice === b.id}
                onClick={() => pick(b.id)}
                className={cn(
                  "h-8 rounded-sm text-[0.6rem] font-bold",
                  b.id === "red" && "tols-cell tols-cell-lime",
                  b.id === "black" && "tols-cell tols-cell-purple",
                  b.id !== "red" && b.id !== "black" && "tols-bar",
                )}
              >
                {b.label}
              </button>
            ))}
          </div>
          {result && preview > 0 ? (
            <p className="text-center text-[0.65rem] text-lime">This bet would have paid {preview}× on {result.number}</p>
          ) : null}
        </div>
      }
    />
  );
}

function choiceLabel(choice: string) {
  if (choice === "green" || choice === "0") return "Straight 0";
  if (choice === "red") return "Red";
  if (choice === "black") return "Black";
  if (choice === "odd") return "Odd";
  if (choice === "even") return "Even";
  if (choice === "low") return "1–18";
  if (choice === "high") return "19–36";
  if (choice === "dozen1") return "1st 12";
  if (choice === "dozen2") return "2nd 12";
  if (choice === "dozen3") return "3rd 12";
  return `Straight ${choice}`;
}

function choicePay(choice: string) {
  if (choice === "dozen1" || choice === "dozen2" || choice === "dozen3") return "3×";
  if (choice === "green" || choice === "0" || /^\d+$/.test(choice)) return "36×";
  return "2×";
}
