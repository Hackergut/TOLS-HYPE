import { useState, type ReactNode } from "react";
import { toast } from "sonner";
import { useWallet } from "@/lib/wallet-context";
import { blackjackAction, dealBlackjack } from "@/lib/casino-api";
import { PlayGate } from "@/components/games/play-gate";
import { GameShell } from "@/components/games/game-shell";
import { useGameTable } from "@/components/games/game-table";
import { StakeField } from "@/components/games/stake-field";
import { TolsT } from "@/components/brand/tols-mark";
import { formatMoney } from "@/lib/format";
import { playSfx } from "@/lib/game-sound";
import { sleep, speedDelay } from "@/lib/game-speed";
import type { PlayingCard } from "@/lib/rng";
import { cn } from "cn";

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
  const [table, setTable] = useState<Table | null>(null);
  const [busy, setBusy] = useState(false);
  const [amount, setAmount] = useState(0);
  const [side, setSide] = useState(0);
  const [mode, setMode] = useState<"standard" | "side">("standard");

  async function deal() {
    setBusy(true);
    try {
      const sideStake = mode === "side" ? side : 0;
      const res = await dealBlackjack({ data: { gameId, currency, amount, side: sideStake } });
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
      if (res.sidePayout > 0) toast.success(`Perfect pair · ${formatMoney(res.sidePayout, currency)}`);
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
        <div className="flex flex-col gap-6">
          <div className="flex gap-1 rounded-md bg-[#202329] p-1.5" role="tablist">
            {(
              [
                ["standard", "Standard"],
                ["side", "Side bet"],
              ] as const
            ).map(([id, label]) => (
              <button
                key={id}
                type="button"
                role="tab"
                aria-selected={mode === id}
                disabled={table?.status === "open"}
                onClick={() => setMode(id)}
                className={cn(
                  "h-9 flex-1 rounded-md text-sm font-medium",
                  mode === id ? "bg-[#343843] text-white" : "text-[#bec6d1]",
                )}
              >
                {label}
              </button>
            ))}
          </div>
          <StakeField amount={amount} setAmount={setAmount} disabled={table?.status === "open"} />
          {mode === "side" ? (
            <div className="grid gap-1">
              <StakeField amount={side} setAmount={setSide} disabled={table?.status === "open"} hint="Perfect pair · 11×" />
            </div>
          ) : null}
          <div className="grid grid-cols-2 gap-2">
            <Action label="Hit" disabled={busy || table?.status !== "open"} onClick={() => void act("hit")} icon={<CardIcon />} />
            <Action label="Stand" disabled={busy || table?.status !== "open"} onClick={() => void act("stand")} icon={<StandIcon />} />
            <Action
              label="Split"
              disabled={busy || !canSplit}
              onClick={() => toast.message("Split lands on the next matching pair.")}
              icon={<SplitIcon />}
            />
            <Action label="Double" disabled={busy || !canDouble} onClick={() => void act("double")} icon={<DoubleIcon />} />
          </div>
          <button
            type="button"
            disabled={busy || table?.status === "open"}
            onClick={() => void deal()}
            className="flex h-[54px] w-full items-center justify-center rounded-md bg-lime text-sm font-medium text-black disabled:opacity-60"
          >
            Bet
          </button>
        </div>
      }
      play={
        <div className="relative grid min-h-[520px] w-full content-center justify-items-center gap-16 bg-[#121418] py-5 md:min-h-[600px] md:gap-32">
          <div className="pointer-events-none absolute inset-0 flex items-center justify-center opacity-15">
            <TolsT className="size-44" />
          </div>
          <Hand
            total={table?.dealerTotal}
            cards={table?.dealer ?? []}
            hidden={Boolean(table?.holeHidden)}
            score="above"
          />
          {!table ? (
            <div className="flex h-36 gap-[13px]">
              <BjCard hidden />
              <BjCard hidden />
            </div>
          ) : null}
          {table?.outcome ? (
            <p className="absolute text-sm font-bold capitalize text-white">{table.outcome}</p>
          ) : null}
          <Hand total={table?.playerTotal} cards={table?.player ?? []} score="below" hot={Boolean(table)} />
        </div>
      }
    />
  );
}

function Action({
  label,
  disabled,
  onClick,
  icon,
}: {
  label: string;
  disabled: boolean;
  onClick: () => void;
  icon: ReactNode;
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className="flex h-[54px] items-center justify-between rounded-md bg-[#202329] px-4 text-sm disabled:cursor-not-allowed disabled:opacity-70"
    >
      {label}
      {icon}
    </button>
  );
}

function CardIcon() {
  return (
    <svg viewBox="0 0 16 16" className="size-4" aria-hidden>
      <rect x="3" y="2" width="10" height="12" rx="1.5" fill="none" stroke="currentColor" strokeWidth="1.4" />
      <path d="M8 5.2 9 7h-2l1-1.8zM8 10.8 7 9h2l-1 1.8z" fill="currentColor" />
    </svg>
  );
}

function StandIcon() {
  return (
    <svg viewBox="0 0 16 16" className="size-4" aria-hidden>
      <path d="M3 13V8.5L6 4l2 2.2L10.5 3 13 8.2V13" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round" />
    </svg>
  );
}

function SplitIcon() {
  return (
    <svg viewBox="0 0 16 16" className="size-4" aria-hidden>
      <rect x="1.5" y="3" width="6" height="8" rx="1" fill="none" stroke="currentColor" strokeWidth="1.3" />
      <rect x="8.5" y="5" width="6" height="8" rx="1" fill="none" stroke="currentColor" strokeWidth="1.3" />
    </svg>
  );
}

function DoubleIcon() {
  return (
    <svg viewBox="0 0 16 16" className="size-4" aria-hidden>
      <path d="M4 4h5.2M4 8h8M4 12h5.2M11 3.2 13.2 5.4 11 7.6" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
    </svg>
  );
}

function Hand({
  total,
  cards,
  hidden,
  score,
  hot,
}: {
  total?: number;
  cards: PlayingCard[];
  hidden?: boolean;
  score: "above" | "below";
  hot?: boolean;
}) {
  const bust = typeof total === "number" && total > 21;
  const pill = (
    <span
      className={cn(
        "rounded-full px-5 py-1 text-base font-bold leading-6 tabular-nums",
        bust ? "bg-[#f1323e] text-[#080808]" : "bg-[#343843] text-white",
      )}
    >
      {total}
    </span>
  );
  if (cards.length === 0 && !hidden) return null;
  return (
    <div className="relative z-1 flex min-h-40 flex-col items-center gap-4">
      {score === "above" && typeof total === "number" ? pill : <span className="h-8" />}
      <div className="flex h-36 items-stretch gap-[13px]">
        {cards.map((c, i) => (
          <BjCard key={`${c.rank}${c.suit}${i}`} card={c} hot={hot && i === cards.length - 1} />
        ))}
        {hidden ? <BjCard hidden /> : null}
      </div>
      {score === "below" && typeof total === "number" ? pill : <span className="h-8" />}
    </div>
  );
}

function BjCard({ card, hidden, hot }: { card?: PlayingCard; hidden?: boolean; hot?: boolean }) {
  if (hidden || !card) {
    return (
      <div className="grid aspect-[2/3] h-full place-items-center rounded-md border border-white bg-[linear-gradient(124deg,#14f1d9_50%,#0e8f86_50%)] shadow-[0_0_12px_rgb(0_0_0/0.8)]">
        <TolsT className="size-12 text-black" />
      </div>
    );
  }
  const red = card.suit === "♥" || card.suit === "♦";
  return (
    <div
      className={cn(
        "flex aspect-[2/3] h-full flex-col items-center justify-center gap-1 rounded-md bg-white shadow-[0_0_12px_rgb(0_0_0/0.8)]",
        hot ? "border-2 border-[#f1323e]" : "border-2 border-transparent",
        red ? "text-[#b4171e]" : "text-black",
      )}
    >
      <span className="font-heading text-[40px] leading-8 font-bold tabular-nums">{card.rank}</span>
      <SuitIcon suit={card.suit} />
    </div>
  );
}

function SuitIcon({ suit }: { suit: PlayingCard["suit"] }) {
  if (suit === "♥") {
    return (
      <svg viewBox="0 0 44 41" className="h-10 w-11" aria-hidden>
        <path
          fill="currentColor"
          d="M4.03 22.57C1.59 20.15.25 16.93.25 13.51.25 10.1 1.6 6.87 4.03 4.46 6.46 2.03 9.7.71 13.14.71c3.44 0 6.48 1.25 8.9 3.53 2.41-2.28 5.55-3.53 8.89-3.53 3.34 0 6.68 1.34 9.12 3.75 2.43 2.41 3.77 5.64 3.77 9.05 0 3.42-1.34 6.64-3.77 9.06L22.04 40.47 4.03 22.57Z"
        />
      </svg>
    );
  }
  if (suit === "♦") {
    return (
      <svg viewBox="0 0 40 44" className="h-11 w-10" aria-hidden>
        <path fill="currentColor" d="M20 1 39 22 20 43 1 22 20 1Z" />
      </svg>
    );
  }
  if (suit === "♣") {
    return (
      <svg viewBox="0 0 44 44" className="size-11" aria-hidden>
        <path
          fill="currentColor"
          d="M22 2c-4.5 0-8 3.2-8 7.4 0 2.4 1.2 4.5 3.1 5.8C13.2 16 10 19.4 10 23.6 10 28.4 14 32 18.6 32c2.2 0 4.1-.8 5.4-2.1V38h-8v3h16v-3h-8v-8.1c1.3 1.3 3.2 2.1 5.4 2.1C34 32 38 28.4 38 23.6c0-4.2-3.2-7.6-7.1-8.4 1.9-1.3 3.1-3.4 3.1-5.8C34 5.2 30.5 2 22 2Z"
        />
      </svg>
    );
  }
  return (
    <svg viewBox="0 0 59 62" className="h-12 w-11" aria-hidden>
      <path
        fill="currentColor"
        d="M29.5.82 5.28 25.04C-.86 31.18-.86 41.14 5.28 47.28c6.14 6.14 16.1 6.14 22.24 0l1.3-1.3v2.52c0 6.63-5.37 12-12 12v1.39h25.37V60.5c-6.63 0-12-5.37-12-12v-2.53l1.3 1.3c6.14 6.14 16.1 6.14 22.24 0 6.14-6.14 6.14-16.1 0-22.24L29.51.81 29.5.82Z"
      />
    </svg>
  );
}
