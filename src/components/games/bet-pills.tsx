import { useRoundViewerOptional } from "@/components/games/round-dialog";
import { useBetHistory } from "@/lib/bet-history";
import { cn } from "cn";

export function BetPills({ gameId }: { gameId: string }) {
  const rounds = useBetHistory(gameId).slice(0, 16);
  const viewer = useRoundViewerOptional();
  if (!rounds.length) return null;
  return (
    <div className="flex min-h-8 flex-wrap justify-center gap-1.5">
      {rounds.map((r, idx) => (
        <button
          key={r.id}
          type="button"
          onClick={() => viewer?.open(r)}
          className={cn(
            "rounded-md px-2 py-1 text-xs font-semibold tabular-nums",
            r.win ? "bg-lime text-black" : "bg-muted text-foreground",
            idx === 0 && "ring-2 ring-primary",
          )}
          title={r.label}
        >
          {pillLabel(r)}
        </button>
      ))}
    </div>
  );
}

function pillLabel(r: { view: { kind: string; roll?: number; number?: number; reels?: string[]; balls?: number; hits?: number } | null; multiplier: number; label: string }) {
  if (r.view?.kind === "dice" && r.view.roll != null) return r.view.roll.toFixed(2);
  if (r.view?.kind === "roulette" && r.view.number != null) return String(r.view.number);
  if (r.view?.kind === "slots" && r.view.reels) return r.view.reels[0] ?? "—";
  if (r.view?.kind === "pool" && r.view.balls != null) return `${r.view.balls}`;
  if (r.view?.kind === "keno" && r.view.hits != null) return `${r.view.hits}`;
  if (r.multiplier) return `${r.multiplier.toFixed(2)}×`;
  return r.label.slice(0, 8);
}
