import { useState } from "react";
import { toast } from "sonner";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useWallet } from "@/lib/wallet-context";
import { blackjackAction, dealBlackjack } from "@/lib/casino-api";
import { PlayGate } from "@/components/games/play-gate";
import { GameShell, LimeBet } from "@/components/games/game-shell";
import { useGameTable } from "@/components/games/game-table";
import { StakeField } from "@/components/games/stake-field";
import { FeltFromPlaying } from "@/components/games/felt-card";
import { formatMoney } from "@/lib/format";
import { CURRENCY_META } from "@/lib/games-catalog";
import { playSfx } from "@/lib/game-sound";
import { sleep, speedDelay } from "@/lib/game-speed";
import type { PlayingCard } from "@/lib/rng";

type Table = {
  roundId: string;
  player: PlayingCard[];
  dealer: PlayingCard[];
  holeHidden: boolean;
  status: "open" | "settled";
  outcome: string | null;
  payout: number;
  playerTotal: number;
  dealerTotal: number;
};

export function BlackjackGame({ gameId }: { gameId: string }) {
  return (
    <PlayGate>
      <BlackjackTable gameId={gameId} />
    </PlayGate>
  );
}

function BlackjackTable({ gameId }: { gameId: string }) {
  const { currency, applyBalances } = useWallet();
  const { reportRound } = useGameTable();
  const meta = CURRENCY_META[currency];
  const [table, setTable] = useState<Table | null>(null);
  const [busy, setBusy] = useState(false);
  const [amount, setAmount] = useState(0);
  const [mode, setMode] = useState("standard");

  async function deal() {
    setBusy(true);
    try {
      const res = await dealBlackjack({ data: { gameId, currency, amount } });
      applyBalances(res.balances);
      playSfx("deal");
      await sleep(speedDelay("deal"));
      setTable({
        roundId: res.roundId,
        player: res.player,
        dealer: res.dealer,
        holeHidden: res.holeHidden,
        status: res.status,
        outcome: res.outcome,
        payout: res.payout,
        playerTotal: res.playerTotal,
        dealerTotal: res.dealerTotal,
      });
      if (res.status === "settled") {
        toast.message(res.outcome ?? "Settled");
        reportRound({
          win: res.payout > 0,
          label: res.outcome ?? "Settled",
          stake: amount,
          payout: res.payout,
          multiplier: amount ? res.payout / amount : 0,
          view: {
            kind: "blackjack",
            outcome: res.outcome ?? "Settled",
            playerTotal: res.playerTotal,
            dealerTotal: res.dealerTotal,
            player: res.player,
            dealer: res.dealer,
          },
        });
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Deal failed");
    } finally {
      setBusy(false);
    }
  }

  async function act(action: "hit" | "stand" | "double") {
    if (!table) return;
    setBusy(true);
    try {
      const res = await blackjackAction({ data: { roundId: table.roundId, action } });
      applyBalances(res.balances);
      playSfx(action === "hit" ? "deal" : "click");
      await sleep(speedDelay("deal"));
      setTable({
        roundId: table.roundId,
        player: res.player,
        dealer: res.dealer,
        holeHidden: Boolean(res.holeHidden),
        status: res.status,
        outcome: res.outcome,
        payout: res.payout,
        playerTotal: res.playerTotal,
        dealerTotal: res.dealerTotal,
      });
      if (res.status === "settled") {
        if (res.payout > 0) toast.success(`${res.outcome} · ${formatMoney(res.payout, currency)}`);
        else toast.message(res.outcome ?? "Lose");
        reportRound({
          win: res.payout > 0,
          label: res.outcome ?? "Settled",
          stake: action === "double" ? amount * 2 : amount,
          payout: res.payout,
          multiplier: amount ? res.payout / (action === "double" ? amount * 2 : amount) : 0,
          view: {
            kind: "blackjack",
            outcome: res.outcome ?? "Settled",
            playerTotal: res.playerTotal,
            dealerTotal: res.dealerTotal,
            player: res.player,
            dealer: res.dealer,
          },
        });
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Action failed");
    } finally {
      setBusy(false);
    }
  }

  const canDouble = table?.status === "open" && table.player.length === 2;
  const canSplit =
    table?.status === "open" &&
    table.player.length === 2 &&
    table.player[0]?.rank === table.player[1]?.rank;

  return (
    <GameShell
      controls={
        <>
          <Tabs value={mode} onValueChange={setMode}>
            <TabsList className="h-10 w-full rounded-lg bg-muted">
              <TabsTrigger value="standard" className="h-8 flex-1">
                Standard
              </TabsTrigger>
              <TabsTrigger value="side" className="h-8 flex-1">
                Side bet
              </TabsTrigger>
            </TabsList>
          </Tabs>
          {mode === "side" ? (
            <p className="text-xs text-muted-foreground">
              Perfect pair pays 11x if your first two cards share a rank. Side bets settle with the
              deal.
            </p>
          ) : null}
          <StakeField amount={amount} setAmount={setAmount} disabled={table?.status === "open"} />
          {table?.status === "open" ? (
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                disabled={busy || !canSplit}
                className="h-10 rounded-lg bg-muted text-sm font-medium disabled:opacity-40"
                onClick={() => toast.message("Split is available on matching ranks next drop.")}
              >
                Split
              </button>
              <button
                type="button"
                disabled={busy || !canDouble}
                className="h-10 rounded-lg bg-muted text-sm font-medium disabled:opacity-40"
                onClick={() => void act("double")}
              >
                Double
              </button>
              <button
                type="button"
                disabled={busy}
                className="h-11 rounded-lg bg-muted text-sm font-semibold"
                onClick={() => void act("hit")}
              >
                Hit
              </button>
              <button
                type="button"
                disabled={busy}
                className="h-11 rounded-lg bg-muted text-sm font-semibold"
                onClick={() => void act("stand")}
              >
                Stand
              </button>
            </div>
          ) : (
            <LimeBet disabled={busy} onClick={() => void deal()}>
              Bet
            </LimeBet>
          )}
        </>
      }
      play={
        <div className="flex flex-col items-center gap-10 py-4">
          <Hand
            label={table?.dealerTotal}
            cards={table?.dealer ?? []}
            hidden={Boolean(table?.holeHidden)}
          />
          {table?.outcome ? (
            <p className="text-sm font-semibold capitalize text-lime">{table.outcome}</p>
          ) : (
            <div className="h-5" />
          )}
          <Hand label={table?.playerTotal} cards={table?.player ?? []} />
        </div>
      }
    />
  );
}

function Hand({
  label,
  cards,
  hidden,
}: {
  label?: number;
  cards: PlayingCard[];
  hidden?: boolean;
}) {
  return (
    <div className="flex flex-col items-center gap-3">
      <div className="flex items-end gap-2">
        {cards.length === 0 && !hidden ? (
          <div className="h-28 w-20 rounded-xl bg-tile" />
        ) : (
          cards.map((c, i) => <FeltFromPlaying key={`${c.rank}${c.suit}${i}`} card={c} size="md" />)
        )}
        {hidden ? <FeltFromPlaying hidden size="md" stripe /> : null}
      </div>
      {typeof label === "number" ? (
        <span className="rounded-md bg-muted px-2 py-0.5 text-xs font-semibold tabular-nums">
          {label}
        </span>
      ) : null}
    </div>
  );
}
