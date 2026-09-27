import { useEffect, useState, type ReactNode } from "react";
import { Link } from "@tanstack/react-router";
import { TolsWordmark } from "@/components/brand/tols-mark";
import { GameToolbar, useGameTableOptional } from "@/components/games/game-table";
import { BetPills } from "@/components/games/bet-pills";
import { loadAnimOn } from "@/lib/game-prefs";
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
  const nonce = table?.rewindNonce ?? 0;

  useEffect(() => {
    if (!nonce || !loadAnimOn()) return;
    setFlash(true);
    const t = window.setTimeout(() => setFlash(false), 700);
    return () => window.clearTimeout(t);
  }, [nonce]);

  return (
    <div className="mx-auto w-full max-w-[1280px] overflow-hidden rounded-lg bg-[#080808] shadow-[var(--shadow-glow)]">
      <div className="flex min-h-80 flex-col-reverse lg:grid lg:grid-cols-[330px_minmax(0,1fr)]">
        <aside className="flex flex-col-reverse gap-6 border-t border-[#2a2e38] bg-[#121418] p-6 lg:flex-col lg:border-t-0 lg:border-r">
          {controls}
        </aside>
        <section
          className={cn(
            "flex min-h-80 w-full flex-col justify-center gap-4 bg-[#080808] p-4 md:p-8",
            flash && "ring-2 ring-lime/60",
          )}
        >
          {table?.gameId ? <BetPills gameId={table.gameId} /> : null}
          {play}
        </section>
      </div>
      <div className="relative z-10 flex items-center justify-between border-t border-[#2a2e38] bg-[#121418] px-3 py-2 text-xs text-muted-foreground md:px-4">
        <GameToolbar />
        <TolsWordmark className="h-3.5 w-auto opacity-45" />
        <Link to="/fairness" className="font-bold underline underline-offset-2 hover:text-lime">
          Provably Fair
        </Link>
      </div>
    </div>
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
        "h-12 w-full rounded-md bg-lime text-base font-semibold text-black shadow-[var(--shadow-fab)] transition-colors hover:bg-lime-400 disabled:opacity-50",
        className,
      )}
    >
      {children}
    </button>
  );
}
