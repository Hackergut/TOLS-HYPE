import { useEffect, useState } from "react";
import { toast } from "sonner";
import { RiArrowDownLine, RiArrowUpLine, RiRefreshLine } from "@remixicon/react";
import { Input } from "@/components/ui/input";
import { PlayGate } from "@/components/games/play-gate";
import { GameShell, LimeBet } from "@/components/games/game-shell";
import { useGameTable } from "@/components/games/game-table";
import { FieldLabel, StakeField } from "@/components/games/stake-field";
import { FeltCard } from "@/components/games/felt-card";
import { cashOutHilo, playHilo, startHilo } from "@/lib/casino-api";
import { useWallet } from "@/lib/wallet-context";
import { CURRENCY_META } from "@/lib/games-catalog";
import { formatMoney } from "@/lib/format";
import { playSfx } from "@/lib/game-sound";
import { sleep, speedDelay } from "@/lib/game-speed";
import { hiloChance, hiloStep } from "@/lib/originals";

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
  const [live, setLive] = useState(false);
  const [mult, setMult] = useState(1);

  async function dealFresh() {
    try {
      const res = await startHilo({ data: { gameId } });
      setRoundId(res.roundId);
      setCard(res.card);
      setPrev(null);
      setLive(false);
      setMult(1);
      playSfx("deal");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not deal");
    }
  }

  useEffect(() => {
    void dealFresh();
  }, [gameId]);

  const pHigher = card ? hiloChance(card.rank, "higher") : 0.5;
  const pLower = card ? hiloChance(card.rank, "lower") : 0.5;
  const hiStep = card ? hiloStep(card.rank, "higher") : 1;
  const loStep = card ? hiloStep(card.rank, "lower") : 1;
  const nextMult = (dir === "higher" ? hiStep : loStep) * (live ? mult : 1);
  const profit = amount * (nextMult - 1);

  async function pick(next: "higher" | "lower") {
    if (!roundId || busy) return;
    setDir(next);
    setBusy(true);
    try {
      const res = await playHilo({ data: { roundId, currency, amount, pick: next } });
      applyBalances(res.balances);
      playSfx("deal");
      await sleep(speedDelay("deal"));
      setPrev(res.previous);
      setCard(res.card);
      setLive(res.live);
      setMult(res.multiplier);
      if (!res.win) {
        playSfx("lose");
        reportRound({
          win: false,
          label: "Miss",
          stake: amount,
          payout: 0,
          multiplier: 0,
          view: {
            kind: "hilo",
            label: "Miss",
            pick: next,
            prev: res.previous.rank,
            next: res.card.rank,
            prevSuit: res.previous.suit,
            nextSuit: res.card.suit,
          },
          replay: () => {
            setPrev(res.previous);
            setCard(res.card);
          },
        });
        toast.message("Miss");
      } else {
        playSfx("hit");
        toast.success(`${res.multiplier.toFixed(2)}×`);
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Bet failed");
    } finally {
      setBusy(false);
    }
  }

  async function cash() {
    if (!roundId || !live) return;
    setBusy(true);
    try {
      const res = await cashOutHilo({ data: { roundId } });
      applyBalances(res.balances);
      playSfx("cash");
      setLive(false);
      reportRound({
        win: true,
        label: `Cash ${mult.toFixed(2)}×`,
        stake: amount,
        payout: res.payout,
        multiplier: res.multiplier,
        view: { kind: "hilo", label: "Cash out" },
        replay: () => setCard(res.card),
      });
      toast.success(`${formatMoney(res.payout, currency)} ${currency}`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Cash out failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <GameShell
      controls={
        <>
          {live ? (
            <LimeBet disabled={busy} onClick={() => void cash()}>
              Cash out {mult.toFixed(2)}×
            </LimeBet>
          ) : (
            <LimeBet disabled={busy || !roundId} onClick={() => void pick(dir)}>
              Bet
            </LimeBet>
          )}
          <StakeField amount={amount} setAmount={setAmount} disabled={live} />
          <FieldLabel label="Profit on next" hint={`${formatMoney(Math.max(0, profit), currency)} ${currency}`}>
            <Input readOnly value={Math.max(0, profit).toFixed(4)} className="h-11 tabular-nums" />
          </FieldLabel>
        </>
      }
      play={
        <div className="mx-auto flex w-full max-w-lg flex-col gap-4">
          <div className="grid grid-cols-[auto_1.5rem_minmax(0,1fr)] items-stretch gap-3">
            <div className="relative">
              {card ? (
                <FeltCard rank={card.rank} suit={card.suit} size="lg" stripe brand />
              ) : (
                <FeltCard hidden size="lg" stripe />
              )}
              <button
                type="button"
                aria-label="Skip card"
                className="absolute top-2 right-2 grid size-8 place-items-center rounded-md bg-black/50 text-white hover:bg-black/70 disabled:opacity-40"
                onClick={() => void dealFresh()}
                disabled={live || busy}
              >
                <RiRefreshLine className="size-4" />
              </button>
            </div>
            <div className="flex flex-col items-center py-1 text-[0.65rem] font-semibold text-muted-foreground">
              <span>K</span>
              <span className="relative my-1 w-px flex-1 bg-border">
                {card ? (
                  <span
                    className="absolute left-1/2 size-2 -translate-x-1/2 rounded-full bg-lime"
                    style={{ bottom: `${((card.rank - 1) / 12) * 100}%` }}
                  />
                ) : null}
              </span>
              <span>A</span>
            </div>
            <div className="flex flex-col gap-2">
              <button
                type="button"
                disabled={busy || !roundId}
                onClick={() => void pick("higher")}
                className="flex min-h-20 flex-1 flex-col items-start justify-center rounded-xl border border-border bg-muted/40 px-3 py-2 text-left hover:border-lime hover:bg-lime/10 disabled:opacity-50"
              >
                <span className="text-xs text-muted-foreground">Higher or Same</span>
                <span className="mt-1 flex items-center gap-1 text-sm font-semibold text-lime">
                  <RiArrowUpLine className="size-4" />
                  {(pHigher * 100).toFixed(2)}%
                </span>
                <span className="text-[0.65rem] tabular-nums text-muted-foreground">{hiStep.toFixed(2)}×</span>
              </button>
              <button
                type="button"
                disabled={busy || !roundId}
                onClick={() => void pick("lower")}
                className="flex min-h-20 flex-1 flex-col items-start justify-center rounded-xl border border-border bg-muted/40 px-3 py-2 text-left hover:border-purple hover:bg-purple/15 disabled:opacity-50"
              >
                <span className="text-xs text-muted-foreground">Lower or Same</span>
                <span className="mt-1 flex items-center gap-1 text-sm font-semibold text-purple">
                  <RiArrowDownLine className="size-4" />
                  {(pLower * 100).toFixed(2)}%
                </span>
                <span className="text-[0.65rem] tabular-nums text-muted-foreground">{loStep.toFixed(2)}×</span>
              </button>
            </div>
          </div>
          <div className="relative w-fit">
            {prev ? (
              <FeltCard rank={prev.rank} suit={prev.suit} size="sm" stripe brand />
            ) : card ? (
              <>
                <FeltCard rank={card.rank} suit={card.suit} size="sm" stripe brand />
                <span className="absolute inset-x-1 bottom-1 rounded bg-white px-1 text-center text-[0.6rem] font-semibold text-zinc-900">
                  Start
                </span>
              </>
            ) : (
              <FeltCard hidden size="sm" stripe />
            )}
          </div>
          {live ? (
            <p className="text-center font-heading text-lg font-semibold text-lime tabular-nums">{mult.toFixed(2)}× streak</p>
          ) : null}
        </div>
      }
    />
  );
}
