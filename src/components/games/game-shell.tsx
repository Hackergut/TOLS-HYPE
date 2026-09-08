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
    <div className="overflow-hidden rounded-2xl bg-card shadow-[var(--shadow-glow)]">
      <div className="flex flex-col-reverse lg:grid lg:grid-cols-[280px_minmax(0,1fr)]">
        <aside className="flex flex-col-reverse gap-4 border-t border-lime p-3 lg:flex-col lg:border-t-0 lg:border-r lg:border-lime md:p-4">
          {controls}
        </aside>
        <section
          className={cn(
            "flex min-h-64 w-full flex-col justify-center gap-4 p-3 md:min-h-80 md:p-6",
            flash && "ring-2 ring-lime/60",
          )}
        >
          {table?.gameId ? <BetPills gameId={table.gameId} /> : null}
          {play}
        </section>
      </div>
      <div className="relative z-10 flex items-center justify-between border-t border-lime bg-card px-3 py-2 text-xs text-muted-foreground md:px-4">
        <GameToolbar />
        <TolsWordmark className="h-3.5 w-auto opacity-45" />
        <Link to="/fairness" className="hover:text-primary">
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
}: {
  children: ReactNode;
  disabled?: boolean;
  onClick?: () => void;
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className="h-12 w-full rounded-lg bg-lime text-base font-semibold text-primary shadow-[var(--shadow-fab)] transition-colors hover:bg-lime-400 disabled:opacity-50"
    >
      {children}
    </button>
  );
}
