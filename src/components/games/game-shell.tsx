import { useEffect, useRef, useState, type ReactNode } from "react";
import { Link } from "@tanstack/react-router";
import { TolsWordmark } from "@/components/brand/tols-mark";
import { GameToolbar, useGameTableOptional } from "@/components/games/game-table";
import { BetPills } from "@/components/games/bet-pills";
import { loadAnimOn } from "@/lib/game-prefs";
import { getGame } from "@/lib/games-catalog";
import { saveWinTag, useBetHistory, type BetRound } from "@/lib/bet-history";
import { useRoundViewerOptional } from "@/components/games/round-dialog";
import { useCurrentUser } from "@/lib/auth/use-current-user";
import { useWallet } from "@/lib/wallet-context";
import { formatMoney, formatMultiplier } from "@/lib/format";
import { FairModal } from "@/components/games/fair-modal";
import { cn } from "cn";

export function GameShell({
  controls,
  play,
}: {
  controls: ReactNode;
  play: ReactNode;
}) {
  const table = useGameTableOptional();
  const [flash, setFlash] = useState(false);
  const [fairOpen, setFairOpen] = useState(false);
  const [open, setOpen] = useState(true);
  const nonce = table?.rewindNonce ?? 0;
  const game = table?.gameId ? getGame(table.gameId) : undefined;
  const rounds = useBetHistory(table?.gameId);
  const best = rounds.reduce((max, round) => Math.max(max, round.multiplier), 0);
  const user = useCurrentUser();
  const viewer = useRoundViewerOptional();
  const { currency } = useWallet();
  const last = table?.last ?? null;
  const playNonce = table?.playNonce ?? 0;
  const [win, setWin] = useState<{ mult: number; payout: number; label: string; round: BetRound } | null>(null);
  const winCard = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!last?.win) return;
    const payout = last.payout ?? 0;
    const stake = last.stake ?? 0;
    const mult = last.multiplier && last.multiplier > 0 ? last.multiplier : stake > 0 ? payout / stake : 0;
    if (mult < 2) return;
    setWin({ mult, payout, label: last.label, round: winRound(last, rounds, table?.gameId, game?.title, game?.kind, currency) });
  }, [last]);

  useEffect(() => {
    setWin(null);
  }, [playNonce]);

  useEffect(() => {
    if (!win) return;
    function onPlay(e: PointerEvent) {
      const node = e.target;
      if (node instanceof Node && winCard.current?.contains(node)) return;
      setWin(null);
    }
    window.addEventListener("pointerdown", onPlay, true);
    return () => window.removeEventListener("pointerdown", onPlay, true);
  }, [win]);

  function openWin() {
    if (!win) return;
    const fresh =
      rounds.find((r) => r.id === win.round.id) ??
      rounds.find((r) => r.win && r.label === win.label && r.multiplier === win.mult) ??
      win.round;
    viewer?.open(fresh);
    setWin(null);
  }

  useEffect(() => {
    if (!nonce || !loadAnimOn()) return;
    setFlash(true);
    const t = window.setTimeout(() => setFlash(false), 700);
    return () => window.clearTimeout(t);
  }, [nonce]);

  return (
    <div className="mx-auto w-full max-w-[1280px] overflow-hidden rounded-lg bg-[#121418]">
      <GameBar
        title={game?.title ?? "Game"}
        best={best}
        name={user?.displayName || "Player"}
        open={open}
        onToggle={() => setOpen((v) => !v)}
      />
      {open ? (
        <>
          <div className="flex min-h-80 flex-col-reverse lg:flex-row">
            <aside className="flex w-full shrink-0 flex-col-reverse gap-6 border-t border-[#2a2e38] p-6 lg:w-[330px] lg:flex-col lg:border-t-0 lg:border-r">
              {controls}
            </aside>
            <section
              className={cn(
                "relative flex min-h-80 min-w-0 flex-1 flex-col justify-center gap-4 p-4 md:p-6",
                flash && "ring-2 ring-lime/60",
              )}
            >
              {table?.gameId ? <BetPills gameId={table.gameId} /> : null}
              {play}
              {win ? (
                <div className="pointer-events-none absolute inset-0 z-20 grid place-items-center">
                  <button
                    ref={winCard}
                    type="button"
                    onClick={openWin}
                    className="pointer-events-auto rounded-2xl border border-[#00ffbd] bg-[#0d0d10] px-8 py-5 text-center shadow-[0_12px_40px_rgb(0_0_0/0.45)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#00ffbd]"
                  >
                    <p className="text-[10px] font-semibold tracking-[0.18em] text-[#00ffbd] uppercase">You won</p>
                    <p className="font-bluescreens mt-1 text-4xl leading-none font-bold text-white tabular-nums md:text-5xl">
                      {formatMultiplier(win.mult)}
                    </p>
                    <p className="mt-2 text-sm font-semibold text-white/90 tabular-nums">
                      {formatMoney(win.payout, currency)} {currency}
                    </p>
                    <span className="mt-3 block font-mono text-sm font-semibold text-white">{win.round.title}</span>
                  </button>
                </div>
              ) : null}
            </section>
          </div>
          <div className="relative z-10 flex items-center justify-between border-t border-[#2a2e38] bg-[#121418] px-4 py-2 text-xs text-muted-foreground">
            <GameToolbar />
            <TolsWordmark className="h-3.5 w-auto opacity-45" />
            <button type="button" onClick={() => setFairOpen(true)} className="font-bold underline underline-offset-2 hover:text-lime">
              Provably Fair
            </button>
          </div>
          <FairModal open={fairOpen} onOpenChange={setFairOpen} />
        </>
      ) : null}
    </div>
  );
}

function GameBar({
  title,
  best,
  name,
  open,
  onToggle,
}: {
  title: string;
  best: number;
  name: string;
  open: boolean;
  onToggle: () => void;
}) {
  const score = best.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 3 });
  return (
    <div className={cn("flex h-[77px] items-center bg-[#121418] px-6", open ? "rounded-t-lg" : "rounded-lg")}>
      <div className="flex min-w-0 flex-1 items-center gap-2">
        <h1 className="truncate text-[22px] leading-7 font-bold">{title}</h1>
        <Link
          to="/originals"
          className="hidden h-6 items-center rounded-md bg-[#2a2e38] px-2 text-sm font-medium capitalize sm:inline-flex"
        >
          TOLS Originals
        </Link>
      </div>
      <div className="flex items-center gap-4">
        <div className="hidden h-10 overflow-hidden rounded-lg border border-[#343843] text-sm font-medium sm:flex">
          <span className="flex max-w-[200px] items-center gap-2 border-r border-[#343843] bg-[#202329] px-4">
            <TrophyIcon />
            <span className="truncate tabular-nums">{score}x</span>
          </span>
          <span className="flex max-w-[200px] items-center gap-2 bg-black px-4">
            <span className="grid size-4 place-items-center rounded-full bg-lime text-[9px] font-bold text-black">T</span>
            <span className="truncate">{name}</span>
          </span>
        </div>
        <button type="button" aria-label={open ? "Collapse details" : "Expand details"} onClick={onToggle} className="grid size-8 place-items-center">
          <svg viewBox="0 0 16 16" className={cn("size-4 transition-transform", open && "rotate-180")} aria-hidden>
            <path d="M3 6.2 8 11l5-4.8" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
          </svg>
        </button>
      </div>
    </div>
  );
}

function winRound(
  last: { label: string; stake?: number; payout?: number; multiplier?: number; fair?: BetRound["fair"]; view?: BetRound["view"] },
  rounds: BetRound[],
  gameId: string | undefined,
  title: string | undefined,
  kind: string | undefined,
  currency: string,
) {
  const saved = rounds.find((r) => r.win && r.label === last.label && r.multiplier === (last.multiplier ?? 0));
  const round: BetRound = saved ?? {
    id: `win-${Date.now()}`,
    gameId: gameId ?? "",
    title: title ?? "Game",
    kind: kind ?? "dice",
    win: true,
    label: last.label,
    stake: last.stake ?? 0,
    payout: last.payout ?? 0,
    multiplier: last.multiplier ?? 0,
    currency,
    fair: last.fair ?? null,
    view: last.view ?? null,
    at: Date.now(),
  };
  saveWinTag(round);
  return saved && saved.fair ? saved : { ...round, fair: saved?.fair ?? last.fair ?? null, view: saved?.view ?? last.view ?? null };
}

function TrophyIcon() {
  return (
    <svg viewBox="0 0 16 16" className="size-4 shrink-0 text-lime" aria-hidden>
      <path d="M4 2h8v2.2a4 4 0 0 1-2.2 3.6A4 4 0 0 1 9 11.2V13h2v1H5v-1h2v-1.8a4 4 0 0 1-.8-3.4A4 4 0 0 1 4 4.2V2Z" fill="currentColor" />
      <path d="M4 3.2H2.2v1.4A2.4 2.4 0 0 0 4.6 7" fill="none" stroke="currentColor" strokeWidth="1.2" />
      <path d="M12 3.2h1.8v1.4A2.4 2.4 0 0 1 11.4 7" fill="none" stroke="currentColor" strokeWidth="1.2" />
    </svg>
  );
}

export function LimeBet({
  children,
  disabled,
  onClick,
  className,
}: {
  children: ReactNode;
  disabled?: boolean;
  onClick?: () => void;
  className?: string;
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className={cn(
        "h-12 w-full rounded-md bg-lime text-base font-semibold text-black shadow-[var(--shadow-fab)] transition-colors hover:bg-lime-400 disabled:cursor-not-allowed disabled:opacity-50",
        className,
      )}
    >
      {children}
    </button>
  );
}