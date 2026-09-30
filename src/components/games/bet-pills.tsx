import type { ReactNode } from "react";
import { useRoundViewerOptional } from "@/components/games/round-dialog";
import { useBetHistory } from "@/lib/bet-history";
import { formatMultiplier } from "@/lib/format";

export function HistoryPill({
  label,
  onClick,
  title,
}: {
  label: ReactNode;
  onClick?: () => void;
  title?: string;
}) {
  return (
    <button type="button" onClick={onClick} title={title} className="w-[60px] shrink-0">
      <span className="flex min-h-[30px] w-full items-center justify-center overflow-hidden rounded-md bg-[#bec6d1] px-1 text-sm font-medium text-ellipsis whitespace-nowrap text-black tabular-nums">
        {label}
      </span>
    </button>
  );
}

export function BetPills({ gameId }: { gameId: string }) {
  const rounds = useBetHistory(gameId).slice(0, 16);
  const viewer = useRoundViewerOptional();
  if (!rounds.length) return null;
  return (
    <div className="flex h-[30px] items-center gap-1 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
      {rounds.map((r) => (
        <HistoryPill
          key={r.id}
          label={formatMultiplier(r.multiplier)}
          title={r.label}
          onClick={() => viewer?.open(r)}
        />
      ))}
    </div>
  );
}
