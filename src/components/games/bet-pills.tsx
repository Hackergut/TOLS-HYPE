import { RoundClone } from "@/components/games/round-clone";
import { useRoundViewerOptional } from "@/components/games/round-dialog";
import { shortHash, useBetHistory } from "@/lib/bet-history";
import { cn } from "cn";

export function BetPills({ gameId }: { gameId: string }) {
  const rounds = useBetHistory(gameId).slice(0, 24);
  const viewer = useRoundViewerOptional();
  if (!rounds.length) return null;
  return (
    <div className="-mx-1 flex h-9 items-center gap-1 overflow-x-auto px-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
      {rounds.map((r, idx) => {
        const tag = r.fair ? shortHash(r.fair.serverHash, 6) : "";
        return (
          <button
            key={r.id}
            type="button"
            onClick={() => viewer?.open(r)}
            title={tag ? `${r.label} #${tag}` : r.label}
            className={cn("shrink-0", idx === 0 && "ring-2 ring-lime ring-offset-1 ring-offset-card rounded-md")}
          >
            <RoundClone view={r.view} win={r.win} label={r.label} size="pill" />
          </button>
        );
      })}
    </div>
  );
}
