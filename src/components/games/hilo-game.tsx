import { useEffect, useState, type ReactNode } from "react";
import { toast } from "sonner";
import { RiArrowDownLine, RiArrowLeftRightLine, RiArrowUpLine } from "@remixicon/react";
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
  const [prev, setPrev] = useState<Card | null>(null);
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
        <div className="flex flex-col gap-4">
          <StakeField amount={amount} setAmount={setAmount} disabled={live} />
          <CallRow
            label="Higher"
            pct={pHigher * 100}
            disabled={busy || !roundId}
            active={dir === "higher"}
            onClick={() => void pick("higher")}
          />
          <CallRow
            label="Lower"
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
        <div className="flex w-full flex-col items-center gap-4">
          <div className="flex w-full items-center justify-center gap-6 px-2 md:px-12">
            <ChoiceTile
              label="Higher"
              hint="King is highest"
              mult={hiStep}
              disabled={busy || !roundId}
              active={dir === "higher"}
              onClick={() => void pick("higher")}
              icon={<RiArrowUpLine className="size-7" />}
            />
            <div className="relative h-[250px] w-[167px] shrink-0">
              <span className="absolute top-[18px] left-0 h-[250px] w-full rounded-md bg-uva/80" />
              <span className="absolute top-[12px] left-0 h-[250px] w-full rounded-md bg-uva" />
              <span className="absolute top-[6px] left-0 h-[250px] w-full rounded-md border border-white/40 bg-linear-to-br from-purple to-uva" />
              <div className="relative z-1 h-[250px] w-full">
                {card ? (
                  <FeltCard rank={card.rank} suit={card.suit} size="lg" stripe brand />
                ) : (
                  <FeltCard hidden size="lg" stripe />
                )}
              </div>
              <button
                type="button"
                name="skip-card"
                aria-label="Skip card"
                className="absolute -top-2.5 -right-2.5 z-2 grid size-9 place-items-center rounded-md bg-[#343843] text-white hover:bg-[#4d5361] disabled:opacity-40"
                onClick={() => void dealFresh()}
                disabled={live || busy}
              >
                <RiArrowLeftRightLine className="size-4" />
              </button>
            </div>
            <ChoiceTile
              label="Lower"
              hint="Ace is lowest"
              mult={loStep}
              disabled={busy || !roundId}
              active={dir === "lower"}
              onClick={() => void pick("lower")}
              icon={<RiArrowDownLine className="size-7" />}
            />
          </div>
          {live ? (
            <p className="font-heading text-lg font-semibold text-lime tabular-nums">{mult.toFixed(2)}× streak</p>
          ) : null}
          {prev ? (
            <div className="opacity-70">
              <FeltCard rank={prev.rank} suit={prev.suit} size="sm" stripe brand />
            </div>
          ) : null}
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
  label,
  hint,
  mult,
  disabled,
  active,
  onClick,
  icon,
}: {
  label: string;
  hint: string;
  mult: number;
  disabled?: boolean;
  active?: boolean;
  onClick: () => void;
  icon: ReactNode;
}) {
  return (
    <div className="flex w-[140px] shrink-0 flex-col items-center">
      <button
        type="button"
        disabled={disabled}
        onClick={onClick}
        className={cn(
          "flex aspect-[1/1.5] w-full flex-col items-center justify-between rounded-md border-2 py-[30px] uppercase transition duration-75",
          active ? "border-lime text-lime" : "border-[#2a2e38] text-[#4d5361]",
          "hover:border-lime hover:text-lime disabled:cursor-not-allowed disabled:opacity-60",
        )}
      >
        <span className="grid justify-items-center gap-1 text-[14px] font-light tracking-wide">
          {icon}
          {label}
        </span>
        <span className="grid h-12 w-[calc(100%-40px)] place-items-center rounded-md border border-[#2a2e38] text-sm text-[#828998]">
          x{mult.toFixed(2)}
        </span>
      </button>
      <p className="mt-2.5 text-center text-xs leading-[18px] text-[#828998]">{hint}</p>
    </div>
  );
}
