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
type Shown = { card: Card; caption: string; hit?: boolean; dir?: "higher" | "lower" | "same" };

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
  const [trail, setTrail] = useState<Shown[]>([]);
  const [amount, setAmount] = useState(0);
  const [busy, setBusy] = useState(false);
  const [dir, setDir] = useState<"higher" | "lower">("higher");
  const [pose, setPose] = useState<"shown" | "exit-left" | "exit-right" | "from-right" | "land">("shown");
  const [verdict, setVerdict] = useState<"win" | "lose" | null>(null);
  const [cover, setCover] = useState(true);
  const [snap, setSnap] = useState(true);
  const [live, setLive] = useState(false);
  const [mult, setMult] = useState(1);
  const [stake, setStake] = useState(0);

  async function openHand(next: Card) {
    setVerdict(null);
    setPose("shown");
    setSnap(true);
    setCover(true);
    setCard(next);
    await sleep(40);
    setSnap(false);
    setCover(false);
    playSfx("flip");
    await sleep(520);
  }

  async function slideIn(next: Card | null, side?: "higher" | "lower") {
    if (side) {
      setPose(side === "higher" ? "exit-left" : "exit-right");
      await sleep(280);
    }
    setPose("from-right");
    if (next) setCard(next);
    await sleep(36);
    setPose("land");
    await sleep(Math.max(speedDelay("deal"), 420));
    setPose("shown");
  }

  async function dealFresh() {
    try {
      const res = await startHilo({ data: { gameId } });
      await openHand(res.card);
      setRoundId(res.roundId);
      setTrail([{ card: res.card, caption: "Start" }]);
      setLive(false);
      setMult(1);
      setStake(0);
      setVerdict(null);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not deal");
    }
  }

  function skip() {
    if (busy || live) return;
    setBusy(true);
    void dealFresh().finally(() => setBusy(false));
  }

  useEffect(() => {
    void dealFresh();
  }, [gameId]);

  const pHigher = card ? hiloChance(card.rank, "higher") : 0.5;
  const pLower = card ? hiloChance(card.rank, "lower") : 0.5;
  const hiStep = card ? hiloStep(card.rank, "higher") : 1;
  const loStep = card ? hiloStep(card.rank, "lower") : 1;

  async function pick(next: "higher" | "lower") {
    if (!roundId || !card || busy) return;
    const prev = card;
    setDir(next);
    setBusy(true);
    try {
      const res = await playHilo({ data: { roundId, currency, amount, pick: next } });
      applyBalances(res.balances);
      if (!live) setStake(amount);
      setLive(res.live);
      setMult(res.multiplier);
      setVerdict(res.win ? "win" : "lose");
      await slideIn(res.card, next);
      const moved: Shown["dir"] =
        res.card.rank > prev.rank ? "higher" : res.card.rank < prev.rank ? "lower" : "same";
      const caption = res.win ? `${res.multiplier.toFixed(2)}x` : "0.00x";
      setTrail((list) => [...list, { card: res.card, caption, hit: res.win, dir: moved }]);
      playSfx("flip");
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
        });
        toast.message("Miss");
        await sleep(Math.max(speedDelay("step") * 4, 420));
        await dealFresh();
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
      reportRound({
        win: true,
        label: `Cash ${mult.toFixed(2)}×`,
        stake: amount,
        payout: res.payout,
        multiplier: res.multiplier,
        view: { kind: "hilo", label: "Cash out" },
      });
      toast.success(`${formatMoney(res.payout, currency)} ${currency}`);
      await dealFresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Cash out failed");
    } finally {
      setBusy(false);
    }
  }

  const cashNow = live ? stake * mult : 0;

  const rank = card?.rank ?? 7;
  const leftLabel = rank === 13 ? "Same" : "Higher";
  const rightLabel = rank === 1 ? "Same" : "Lower";
  const leftSame = rank === 13;
  const rightSame = rank === 1;

  return (
    <GameShell
      controls={
        <div className="flex flex-col gap-4">
          <StakeField amount={amount} setAmount={setAmount} disabled={live || busy} />
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
            onClick={skip}
            className="flex h-[54px] w-full items-center justify-center rounded-md border border-white text-sm font-medium hover:border-lime hover:text-lime disabled:cursor-not-allowed disabled:opacity-40"
          >
            Skip card
          </button>
          <button
            type="button"
            disabled={!live || busy}
            onClick={() => void cash()}
            className={cn(
              "flex h-[54px] w-full flex-col items-center justify-center rounded-md text-sm font-medium leading-none",
              live ? "bg-lime text-black hover:bg-lime-400" : "cursor-not-allowed bg-[#9ba5b4] text-[#121418]",
            )}
          >
            <span>Cash out</span>
            <span className="mt-1 text-base font-bold tabular-nums">
              {formatMoney(cashNow, currency)} {currency}
              {live ? <span className="ml-1.5 text-xs font-semibold">{mult.toFixed(2)}×</span> : null}
            </span>
          </button>
        </div>
      }
      play={
        <div className="flex w-full flex-col gap-4">
          <style>{`
            @keyframes hilo-arrive {
              0% { transform: translateX(72px) rotateY(88deg); opacity: 0; }
              100% { transform: translateX(0) rotateY(0deg); opacity: 1; }
            }
            .hilo-arrive { animation: hilo-arrive 460ms ease-out both; transform-style: preserve-3d; }
          `}</style>
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
            <div className="relative aspect-[2/3] w-[clamp(4.75rem,22vw,8.75rem)] [perspective:900px]">
              <span className="absolute top-[8%] left-0 h-full w-full overflow-hidden rounded-lg border border-[#c9fff8] bg-[linear-gradient(128deg,#5dfff3_50%,#1ad4c8_50%)]" />
              <span className="absolute top-[5%] left-0 h-full w-full overflow-hidden rounded-lg border border-[#c9fff8] bg-[linear-gradient(128deg,#5dfff3_50%,#1ad4c8_50%)]" />
              <span className="absolute top-[2%] left-0 h-full w-full overflow-hidden rounded-lg border border-[#c9fff8] bg-[linear-gradient(128deg,#5dfff3_50%,#1ad4c8_50%)]" />
              <div
                className={cn(
                  "relative z-1 h-full w-full",
                  pose === "from-right" && "translate-x-[130%] opacity-0 transition-none",
                  pose === "land" && "translate-x-0 opacity-100 transition-[translate,opacity] duration-500 ease-out",
                  pose === "exit-left" && "-translate-x-[120%] -rotate-6 opacity-0 transition-[translate,rotate,opacity] duration-300 ease-in",
                  pose === "exit-right" && "translate-x-[120%] rotate-6 opacity-0 transition-[translate,rotate,opacity] duration-300 ease-in",
                  pose === "shown" && "translate-x-0 opacity-100",
                )}
              >
                <div
                  className={cn(
                    "relative h-full w-full [transform-style:preserve-3d]",
                    snap ? "transition-none" : "transition-transform duration-500",
                    cover && "[transform:rotateY(180deg)]",
                    verdict === "win" && !cover && "rounded-md outline outline-1 outline-[#00ffbd] outline-offset-2",
                    verdict === "lose" && !cover && "rounded-md outline outline-1 outline-[#ff3355] outline-offset-2",
                  )}
                >
                  <div className="absolute inset-0 [backface-visibility:hidden]">
                    {card ? <FeltCard rank={card.rank} suit={card.suit} size="xl" fluid /> : <FeltCard hidden size="xl" fluid />}
                  </div>
                  <div className="absolute inset-0 [transform:rotateY(180deg)] [backface-visibility:hidden]">
                    <FeltCard hidden size="xl" fluid />
                  </div>
                </div>
              </div>
              <button
                type="button"
                name="skip-card"
                aria-label="Skip card"
                className="absolute -top-2 -right-2 z-2 grid size-8 place-items-center rounded-md bg-[#343843] text-white hover:bg-[#4d5361] disabled:opacity-40 md:size-9"
                onClick={skip}
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
          <div className="grid auto-cols-[clamp(3.25rem,18vw,4.75rem)] grid-flow-col items-start gap-2 overflow-x-auto rounded-md border border-[#2a2e38] bg-[#080808] p-3">
            {trail.map((item, i) => (
              <div key={`${item.card.rank}-${item.card.suit}-${i}`} className={cn("grid min-w-0 gap-1.5", i === trail.length - 1 && i > 0 && "hilo-arrive")}>
                <div className="relative aspect-[2/3] w-full [perspective:600px]">
                  <FeltCard rank={item.card.rank} suit={item.card.suit} fluid />
                  {item.dir ? <DirBadge dir={item.dir} hit={item.hit} /> : null}
                </div>
                <p
                  className={cn(
                    "grid h-5 place-items-center rounded-[3px] px-0.5 text-center text-[10px] leading-none font-bold text-[#080808] md:text-[11px]",
                    item.hit === false ? "bg-[#ff3355] text-white" : "bg-[#00ffbd]",
                  )}
                >
                  {item.caption}
                </p>
              </div>
            ))}
          </div>
        </div>
      }
    />
  );
}

function DirBadge({ dir, hit }: { dir: "higher" | "lower" | "same"; hit?: boolean }) {
  const lost = hit === false;
  return (
    <span
      className={cn(
        "absolute bottom-1 left-1/2 z-1 grid size-4 -translate-x-1/2 place-items-center rounded-full",
        lost ? "bg-[#ff3355] text-white" : "bg-[#00ffbd] text-[#080808]",
      )}
    >
      {dir === "same" ? (
        <svg viewBox="0 0 12 12" className="size-2.5" aria-hidden>
          <path d="M2 4h8M2 8h8" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
        </svg>
      ) : (
        <svg viewBox="0 0 12 12" className={cn("size-2.5", dir === "lower" && "rotate-180")} aria-hidden>
          <path d="M6 2.2 10 7.2H2L6 2.2Z" fill="currentColor" />
        </svg>
      )}
    </span>
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
