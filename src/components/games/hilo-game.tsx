import { useEffect, useState } from "react";
import { toast } from "sonner";
import { PlayGate } from "@/components/games/play-gate";
import { GameShell } from "@/components/games/game-shell";
import { useGameTable } from "@/components/games/game-table";
import { StakeField } from "@/components/games/stake-field";
import { FeltCard } from "@/components/games/felt-card";
import { cashOutHilo, playHilo, startHilo } from "@/lib/casino-api";
import { useWallet } from "@/lib/wallet-context";
import { formatMoney } from "@/lib/format";
import { playSfx } from "@/lib/game-sound";
import { sleep, speedDelay } from "@/lib/game-speed";
import { hiloChance, hiloStep } from "@/lib/originals";
import { cn } from "cn";

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
  const [roundId, setRoundId] = useState<string | null>(null);
  const [card, setCard] = useState<Card | null>(null);
  const [trail, setTrail] = useState<Card[]>([]);
  const [amount, setAmount] = useState(0);
  const [busy, setBusy] = useState(false);
  const [dir, setDir] = useState<"higher" | "lower">("higher");
  const [live, setLive] = useState(false);
  const [mult, setMult] = useState(1);

  async function dealFresh() {
    try {
      const res = await startHilo({ data: { gameId } });
      setRoundId(res.roundId);
      setCard(res.card);
      setTrail([res.card]);
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

  async function pick(next: "higher" | "lower") {
    if (!roundId || busy) return;
    setDir(next);
    setBusy(true);
    try {
      const res = await playHilo({ data: { roundId, currency, amount, pick: next } });
      applyBalances(res.balances);
      playSfx("deal");
      await sleep(speedDelay("deal"));
      setCard(res.card);
      setTrail((list) => [...list, res.card]);
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
            setCard(res.card);
            setTrail((list) => (list.some((c) => c === res.card) ? list : [...list, res.card]));
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

  const rank = card?.rank ?? 7;
  const leftLabel = rank === 13 ? "Same" : "Higher";
  const rightLabel = rank === 1 ? "Same" : "Lower";
  const leftSame = rank === 13;
  const rightSame = rank === 1;

  return (
    <GameShell
      controls={
        <div className="flex flex-col gap-4">
          <StakeField amount={amount} setAmount={setAmount} disabled={live} />
          <CallRow
            label={leftLabel}
            pct={pHigher * 100}
            disabled={busy || !roundId}
            active={dir === "higher"}
            onClick={() => void pick("higher")}
          />
          <CallRow
            label={rightLabel}
            pct={pLower * 100}
            disabled={busy || !roundId}
            active={dir === "lower"}
            onClick={() => void pick("lower")}
          />
          <button
            type="button"
            disabled={live || busy}
            onClick={() => void dealFresh()}
            className="flex h-[54px] w-full items-center justify-center rounded-md border border-white text-sm font-medium hover:border-lime hover:text-lime disabled:cursor-not-allowed disabled:opacity-40"
          >
            Skip card
          </button>
          <button
            type="button"
            disabled={!live || busy}
            onClick={() => void cash()}
            className={cn(
              "flex h-[54px] w-full items-center justify-center rounded-md text-sm font-medium",
              live
                ? "bg-lime text-black hover:bg-lime-400"
                : "cursor-not-allowed bg-[#9ba5b4] text-[#121418]",
            )}
          >
            Cash out {live ? `${formatMoney(amount * mult, currency)} ${currency}` : "0.00"}
          </button>
        </div>
      }
      play={
        <div className="flex w-full flex-col gap-4">
          <div className="grid w-full grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-start justify-items-center gap-2 sm:gap-4 md:gap-6 md:px-6">
            <ChoiceTile
              name="left-card"
              label={leftLabel}
              hint="King is the highest"
              mult={hiStep}
              same={leftSame}
              disabled={busy || !roundId}
              onClick={() => void pick("higher")}
            />
            <div className="relative aspect-[2/3] w-[clamp(4.75rem,22vw,8.75rem)]">
              <span className="absolute top-[8%] left-0 h-full w-full rounded-md border border-white/70 bg-[linear-gradient(124deg,#14f1d9_50%,#0e8f86_50%)]" />
              <span className="absolute top-[5%] left-0 h-full w-full rounded-md border border-white/70 bg-[linear-gradient(124deg,#14f1d9_50%,#0e8f86_50%)]" />
              <span className="absolute top-[2%] left-0 h-full w-full rounded-md border border-white/70 bg-[linear-gradient(124deg,#c6ff4a_50%,#14f1d9_50%)]" />
              <div className="relative z-1 h-full w-full">
                {card ? <FeltCard rank={card.rank} suit={card.suit} size="xl" fluid /> : <FeltCard hidden size="xl" fluid />}
              </div>
              <button
                type="button"
                name="skip-card"
                aria-label="Skip card"
                className="absolute -top-2 -right-2 z-2 grid size-8 place-items-center rounded-md bg-[#343843] text-white hover:bg-[#4d5361] disabled:opacity-40 md:size-9"
                onClick={() => void dealFresh()}
                disabled={live || busy}
              >
                <svg viewBox="0 0 17 15" className="h-3.5 w-4" aria-hidden>
                  <path d="M8 1.4 14 7.4 8 13.4 9.4 14.8 16.1 8.1 9.4 0 8 1.4Z" fill="white" />
                  <path d="M0 1.4 6 7.4 0 13.4 1.4 14.8 8.1 8.1 1.4 0 0 1.4Z" fill="white" />
                </svg>
              </button>
            </div>
            <ChoiceTile
              name="right-card"
              label={rightLabel}
              hint="Ace counts as the lowest"
              mult={loStep}
              same={rightSame}
              disabled={busy || !roundId}
              onClick={() => void pick("lower")}
            />
          </div>
          {live ? (
            <p className="text-center font-heading text-lg font-semibold text-lime tabular-nums">{mult.toFixed(2)}× streak</p>
          ) : null}
          <div className="grid auto-cols-[clamp(3.25rem,18vw,4.75rem)] grid-flow-col items-start gap-2 overflow-x-auto rounded-md border border-[#2a2e38] bg-[#080808] p-3">
            {trail.map((item, i) => (
              <div key={`${item.rank}-${item.suit}-${i}`} className="grid min-w-0 gap-1.5">
                <div className="aspect-[2/3] w-full">
                  <FeltCard rank={item.rank} suit={item.suit} fluid />
                </div>
                {i === 0 ? (
                  <p className="grid min-h-5 place-items-center rounded-sm bg-[#3dd179] px-0.5 text-center text-[9px] leading-tight font-bold text-black md:text-[11px]">
                    Starting card
                  </p>
                ) : null}
              </div>
            ))}
          </div>
        </div>
      }
    />
  );
}

function CallRow({
  label,
  pct,
  disabled,
  active,
  onClick,
}: {
  label: string;
  pct: number;
  disabled?: boolean;
  active?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className={cn(
        "flex h-12 w-full items-center justify-between rounded-md bg-[#202329] px-4 text-sm font-medium",
        active && "ring-1 ring-lime",
        "hover:bg-[#2a2e38] disabled:cursor-not-allowed disabled:opacity-60",
      )}
    >
      <span>{label}</span>
      <span className="flex h-8 min-w-[76px] items-center justify-center gap-1 rounded-md bg-[#2a2e38] px-2 text-xs tabular-nums">
        {pct.toFixed(2)}%
      </span>
    </button>
  );
}

function ChoiceTile({
  name,
  label,
  hint,
  mult,
  same,
  disabled,
  onClick,
}: {
  name: string;
  label: string;
  hint: string;
  mult: number;
  same?: boolean;
  disabled?: boolean;
  onClick: () => void;
}) {
  return (
    <div className="flex w-full min-w-0 max-w-[116px] flex-col items-center justify-self-center">
      <button
        type="button"
        name={name}
        disabled={disabled}
        onClick={onClick}
        className="flex aspect-[1/1.5] w-full flex-col items-center justify-between rounded-md border-[3px] border-[#14f1d9] bg-[#12352f] px-1 py-3 text-white uppercase transition duration-75 hover:bg-[#174840] disabled:cursor-not-allowed disabled:opacity-60 sm:py-4 md:py-[30px]"
      >
        <span className="grid justify-items-center gap-1 text-center font-[Oswald,sans-serif] text-[10px] leading-none font-light tracking-wide sm:text-[11px] md:text-sm">
          {same ? (
            <svg viewBox="0 0 30 30" className="size-6 md:size-7" aria-hidden>
              <rect x="2" y="4" width="26" height="8" rx="2" fill="#fff" />
              <rect x="2" y="16" width="26" height="8" rx="2" fill="#fff" />
            </svg>
          ) : label === "Lower" ? (
            <svg viewBox="0 0 30 30" className="size-6 rotate-180 md:size-7" aria-hidden>
              <path d="M15.9 5.4c-.2-.2-.6-.4-.9-.4s-.7.1-.9.4L1.6 17.9c-.2.2-.4.5-.4.9s.1.6.4.8l3.8 3.8c.2.2.5.3.8.3s.6-.1.9-.3L15 15.5l7.9 7.9c.2.2.5.3.8.3s.7-.1.9-.3l3.7-3.8c.2-.2.4-.5.4-.8s-.2-.7-.4-.9L15.9 5.4Z" fill="#fff" />
            </svg>
          ) : (
            <svg viewBox="0 0 30 30" className="size-6 md:size-7" aria-hidden>
              <path d="M15.9 5.4c-.2-.2-.6-.4-.9-.4s-.7.1-.9.4L1.6 17.9c-.2.2-.4.5-.4.9s.1.6.4.8l3.8 3.8c.2.2.5.3.8.3s.6-.1.9-.3L15 15.5l7.9 7.9c.2.2.5.3.8.3s.7-.1.9-.3l3.7-3.8c.2-.2.4-.5.4-.8s-.2-.7-.4-.9L15.9 5.4Z" fill="#fff" />
            </svg>
          )}
          {label}
        </span>
        <span className="grid h-8 w-[calc(100%-8px)] place-items-center rounded-md border border-[#2a2e38] bg-[#121418] text-[11px] text-white sm:h-9 sm:text-xs md:h-12 md:w-[calc(100%-24px)] md:text-sm">
          x{mult.toFixed(2)}
        </span>
      </button>
      <p className="mt-2.5 text-center text-[10px] leading-[18px] text-[#828998] md:text-xs">{hint}</p>
    </div>
  );
}
