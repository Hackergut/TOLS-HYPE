import { useState } from "react";
import { toast } from "sonner";
import { useWallet } from "@/lib/wallet-context";
import { playInstant } from "@/lib/casino-api";
import { PlayGate } from "@/components/games/play-gate";
import { GameShell, LimeBet } from "@/components/games/game-shell";
import { RouletteWheel } from "@/components/games/roulette-wheel";
import { useGameTable } from "@/components/games/game-table";
import { StakeField } from "@/components/games/stake-field";
import { HistoryPill } from "@/components/games/bet-pills";
import { formatMoney } from "@/lib/format";
import { CURRENCY_META } from "@/lib/games-catalog";
import { playSfx } from "@/lib/game-sound";
import { sleep, speedDelay } from "@/lib/game-speed";
import { rouletteColor, rouletteMultiplier } from "@/lib/rng";
import { cn } from "cn";

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
  const [undo, setUndo] = useState("red");
  const [spinning, setSpinning] = useState(false);
  const [amount, setAmount] = useState(0);
  const [result, setResult] = useState<{ number: number; color: string; payout: number } | null>(null);
  const [history, setHistory] = useState<number[]>([]);

  function pick(next: string) {
    if (spinning || !next) return;
    setUndo(choice);
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
      setHistory((prev) => [next.number, ...prev].slice(0, 8));
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

  const preview = rouletteMultiplier(result?.number ?? -1, choice || "red");

  return (
    <GameShell
      controls={
        <>
          <StakeField amount={amount} setAmount={setAmount} disabled={spinning} />
          <p className="text-xs text-muted-foreground">
            {choice ? `${choiceLabel(choice)} · ${choicePay(choice)}` : "Pick a spot"}
            {result && preview > 0 ? ` · paid ${preview}×` : ""}
          </p>
          <LimeBet disabled={spinning || !choice} onClick={() => void play()}>
            Spin
          </LimeBet>
        </>
      }
      play={
        <div className="flex w-full flex-col items-center gap-2">
          <div className="flex w-full items-center justify-evenly">
            <div className="grid size-[70px] shrink-0 place-items-center rounded-md bg-[#2a2e38] text-lg font-bold">
              {result && !spinning ? result.number : "–"}
            </div>
            <RouletteWheel
              number={result?.number ?? null}
              spinning={spinning}
              durationMs={speedDelay("spin") || 200}
              className="relative aspect-square w-[min(280px,46vw)]"
            />
            <div className="flex max-w-[200px] flex-col gap-1 overflow-hidden">
              {history.map((n, i) => (
                <HistoryPill key={`${n}-${i}`} label={String(n)} />
              ))}
            </div>
          </div>

          <div className="w-[90%] max-w-[725px]">
            <div className="mb-2 flex items-center justify-between">
              <button
                type="button"
                disabled={spinning}
                onClick={() => {
                  setChoice(undo);
                  playSfx("click");
                }}
                className="flex h-12 items-center gap-1.5 px-4 text-sm font-bold"
              >
                ↩ Undo
              </button>
              <button
                type="button"
                disabled={spinning}
                onClick={() => {
                  setUndo(choice);
                  setChoice("");
                  playSfx("click");
                }}
                className="flex h-12 items-center gap-1.5 px-4 text-sm font-bold"
              >
                ✕ Clear
              </button>
            </div>
            <div
              className="grid gap-1"
              style={{ gridTemplateColumns: "minmax(36px,46px) repeat(12, minmax(0,1fr)) minmax(40px,52px)" }}
            >
              <BoardCell
                label="0"
                selected={choice === "green"}
                tone="green"
                className="row-span-3"
                onClick={() => pick("green")}
              />
              {[3, 2, 1].map((row) =>
                Array.from({ length: 12 }, (_, i) => {
                  const n = i * 3 + row;
                  const tone = rouletteColor(n);
                  return (
                    <BoardCell
                      key={n}
                      label={String(n)}
                      selected={choice === String(n)}
                      tone={tone === "red" ? "red" : "black"}
                      onClick={() => pick(String(n))}
                    />
                  );
                }),
              )}
              <BoardCell label="2:1" selected={choice === "col3"} onClick={() => pick("col3")} />
              <BoardCell label="2:1" selected={choice === "col2"} onClick={() => pick("col2")} />
              <BoardCell label="2:1" selected={choice === "col1"} onClick={() => pick("col1")} />
            </div>
            <div className="mt-1 grid grid-cols-3 gap-1 pl-[calc(36px+0.25rem)] pr-[calc(40px+0.25rem)]">
              {DOZENS.map((d) => (
                <BoardCell key={d.id} label={d.label} selected={choice === d.id} onClick={() => pick(d.id)} />
              ))}
            </div>
            <div className="mt-1 grid grid-cols-6 gap-1 pl-[calc(36px+0.25rem)] pr-[calc(40px+0.25rem)]">
              <BoardCell label="1–18" selected={choice === "low"} onClick={() => pick("low")} />
              <BoardCell label="Even" selected={choice === "even"} onClick={() => pick("even")} />
              <BoardCell label="" selected={choice === "red"} tone="red" onClick={() => pick("red")} />
              <BoardCell label="" selected={choice === "black"} tone="black" onClick={() => pick("black")} />
              <BoardCell label="Odd" selected={choice === "odd"} onClick={() => pick("odd")} />
              <BoardCell label="19–36" selected={choice === "high"} onClick={() => pick("high")} />
            </div>
          </div>
        </div>
      }
    />
  );
}

function BoardCell({
  label,
  selected,
  tone = "plain",
  className,
  onClick,
}: {
  label: string;
  selected: boolean;
  tone?: "plain" | "red" | "black" | "green";
  className?: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      aria-pressed={selected}
      onClick={onClick}
      className={cn(
        "flex h-full min-h-9 items-center justify-center rounded-md border text-sm font-bold",
        tone === "red" && "border-[#f1323e] bg-[#f1323e]",
        tone === "black" && "border-[#2a2e38] bg-[#2a2e38]",
        tone === "green" && "border-[#148f3e] bg-[#148f3e] text-black",
        tone === "plain" && "border-[#343843] bg-[#121418]",
        selected && "ring-2 ring-white",
        className,
      )}
    >
      {label}
    </button>
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
  if (choice === "col1") return "Column 1";
  if (choice === "col2") return "Column 2";
  if (choice === "col3") return "Column 3";
  return `Straight ${choice}`;
}

function choicePay(choice: string) {
  if (choice === "dozen1" || choice === "dozen2" || choice === "dozen3" || choice.startsWith("col")) return "3×";
  if (choice === "green" || choice === "0" || /^\d+$/.test(choice)) return "36×";
  return "2×";
}
