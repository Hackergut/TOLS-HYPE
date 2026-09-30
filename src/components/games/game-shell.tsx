import { useEffect, useState, type ReactNode } from "react";
import { Link } from "@tanstack/react-router";
import { TolsWordmark } from "@/components/brand/tols-mark";
import { GameToolbar, useGameTableOptional } from "@/components/games/game-table";
import { BetPills } from "@/components/games/bet-pills";
import { loadAnimOn } from "@/lib/game-prefs";
import { getGame } from "@/lib/games-catalog";
import { useBetHistory } from "@/lib/bet-history";
import { useCurrentUser } from "@/lib/auth/use-current-user";
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
  const [open, setOpen] = useState(true);
  const nonce = table?.rewindNonce ?? 0;
  const game = table?.gameId ? getGame(table.gameId) : undefined;
  const rounds = useBetHistory(table?.gameId);
  const best = rounds.reduce((max, round) => Math.max(max, round.multiplier), 0);
  const user = useCurrentUser();

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
                "flex min-h-80 min-w-0 flex-1 flex-col justify-center gap-4 p-4 md:p-6",
                flash && "ring-2 ring-lime/60",
              )}
            >
              {table?.gameId ? <BetPills gameId={table.gameId} /> : null}
              {play}
            </section>
          </div>
          <div className="relative z-10 flex items-center justify-between border-t border-[#2a2e38] bg-[#121418] px-4 py-2 text-xs text-muted-foreground">
            <GameToolbar />
            <TolsWordmark className="h-3.5 w-auto opacity-45" />
            <Link to="/fairness" className="font-bold underline underline-offset-2 hover:text-lime">
              Provably Fair
            </Link>
          </div>
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