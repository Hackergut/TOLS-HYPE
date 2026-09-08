import { useEffect, useState } from "react";
import { toast } from "sonner";
import { RiArrowDownLine, RiArrowUpLine, RiRefreshLine } from "@remixicon/react";
import { PlayGate } from "@/components/games/play-gate";
import { GameShell, LimeBet } from "@/components/games/game-shell";
import { useGameTable } from "@/components/games/game-table";
import { StakeField } from "@/components/games/stake-field";
import { FeltCard } from "@/components/games/felt-card";
import { playHilo, startHilo } from "@/lib/casino-api";
import { useWallet } from "@/lib/wallet-context";
import { CURRENCY_META } from "@/lib/games-catalog";
import { formatMoney } from "@/lib/format";

type Card = { rank: number; suit: string };

export function HiloGame({ gameId }: { gameId: string }) {
  return (
    <PlayGate>
      <HiloTable gameId={gameId} />
    </PlayGate>
  );
}

function HiloTable({ gameId }: { gameId: string }) {
  const { currency, applyBalances } = useWallet();
  const { reportRound } = useGameTable();
  const meta = CURRENCY_META[currency];
  const [roundId, setRoundId] = useState<string | null>(null);
  const [card, setCard] = useState<Card | null>(null);
  const [prev, setPrev] = useState<Card | null>(null);
  const [amount, setAmount] = useState(meta.minBet);
  const [busy, setBusy] = useState(false);
  const [dir, setDir] = useState<"higher" | "lower">("higher");

  async function dealFresh() {
    const res = await startHilo({ data: { gameId } });
    setRoundId(res.roundId);
    setCard(res.card);
    setPrev(null);
  }

  useEffect(() => {
    void dealFresh();
  }, [gameId]);

  const pHigher = card ? (14 - card.rank) / 13 : 0.5;
  const pLower = card ? card.rank / 13 : 0.5;

  async function pick(next: "higher" | "lower") {
    if (!roundId) return;
    setDir(next);
    setBusy(true);
    try {
      const res = await playHilo({ data: { roundId, currency, amount, pick: next } });
      applyBalances(res.balances);
      setPrev(res.previous);
      setCard(res.card);
      reportRound({
        win: res.win,
        label: res.win ? "Hi-Lo hit" : "Miss",
        stake: amount,
        payout: res.payout,
        multiplier: amount ? res.payout / amount : 0,
        view: { kind: "hilo", label: res.win ? "Hi-Lo hit" : "Miss" },
        replay: () => {
          setPrev(res.previous);
          setCard(res.card);
        },
      });
      if (res.win) toast.success(`${formatMoney(res.payout, currency)} ${currency}`);
      else toast.message("Miss");
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
          <StakeField amount={amount} setAmount={setAmount} />
          <LimeBet disabled={busy || !roundId} onClick={() => void pick(dir)}>
            Bet
          </LimeBet>
        </>
      }
      play={
        <div className="mx-auto grid w-full max-w-lg grid-cols-[1fr_auto] items-center gap-4">
          <div className="flex flex-col items-start gap-3">
            <div className="relative">
              {card ? (
                <FeltCard rank={card.rank} suit={card.suit} size="lg" stripe />
              ) : (
                <FeltCard hidden size="lg" stripe />
              )}
              <button
                type="button"
                aria-label="Skip card"
                className="absolute top-2 right-2 grid size-8 place-items-center rounded-md bg-black/40 text-white hover:bg-black/60"
                onClick={() => void dealFresh()}
              >
                <RiRefreshLine className="size-4" />
              </button>
            </div>
            <div className="relative">
              {prev ? (
                <FeltCard rank={prev.rank} suit={prev.suit} size="sm" />
              ) : card ? (
                <div className="relative">
                  <FeltCard rank={card.rank} suit={card.suit} size="sm" />
                  <span className="absolute inset-x-1 bottom-1 rounded bg-white px-1 text-center text-[0.6rem] font-semibold text-zinc-900">
                    Start
                  </span>
                </div>
              ) : (
                <FeltCard hidden size="sm" />
              )}
            </div>
          </div>
          <div className="flex items-stretch gap-2">
            <div className="flex w-36 flex-col gap-2">
              <button
                type="button"
                disabled={busy}
                onClick={() => void pick("higher")}
                className="flex min-h-16 flex-col items-start justify-center rounded-xl bg-muted px-3 py-2 text-left hover:bg-muted/80"
              >
                <span className="text-xs text-muted-foreground">Higher or Same</span>
                <span className="mt-1 flex items-center gap-1 text-sm font-semibold text-gold">
                  <RiArrowUpLine className="size-4" />
                  {(pHigher * 100).toFixed(2)}%
                </span>
              </button>
              <button
                type="button"
                disabled={busy}
                onClick={() => void pick("lower")}
                className="flex min-h-16 flex-col items-start justify-center rounded-xl bg-muted px-3 py-2 text-left hover:bg-muted/80"
              >
                <span className="text-xs text-muted-foreground">Lower or Same</span>
                <span className="mt-1 flex items-center gap-1 text-sm font-semibold text-primary">
                  <RiArrowDownLine className="size-4" />
                  {(pLower * 100).toFixed(2)}%
                </span>
              </button>
            </div>
            <div className="flex flex-col items-center justify-between py-1 text-[0.65rem] font-semibold text-muted-foreground">
              <span>K</span>
              <span className="w-px flex-1 bg-border" />
              <span>A</span>
            </div>
          </div>
        </div>
      }
    />
  );
}
