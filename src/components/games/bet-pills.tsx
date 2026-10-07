import type { ReactNode } from "react";
import { useRoundViewerOptional } from "@/components/games/round-dialog";
import { useBetHistory } from "@/lib/bet-history";
import { formatMultiplier } from "@/lib/format";

function pillWin(label: ReactNode, win?: boolean) {
  if (win != null) return win;
  if (typeof label !== "string") return false;
  const n = Number(label.replace(/x/gi, "").replace(",", "."));
  return Number.isFinite(n) && n >= 2;
}

export function HistoryPill({
  label,
  onClick,
  title,
  win,
}: {
  label: ReactNode;
  onClick?: () => void;
  title?: string;
  win?: boolean;
}) {
  const hit = pillWin(label, win);
  return (
    <button
      type="button"
      onClick={onClick}
      title={title}
      className={
        hit
          ? "grid h-5 shrink-0 items-center justify-items-center rounded-[3px] bg-[#00ffbd] px-2 text-[12px] leading-[18px] font-bold text-[#080808] tabular-nums select-none"
          : "grid h-5 shrink-0 items-center justify-items-center rounded-[3px] bg-[#bec6d1] px-2 text-[12px] leading-[18px] font-bold text-[#080808] tabular-nums select-none"
      }
    >
      {label}
    </button>
  );
}

export function BetPills({ gameId }: { gameId: string }) {
  const rounds = useBetHistory(gameId).slice(0, 16);
  const viewer = useRoundViewerOptional();
  if (!rounds.length) return null;
  return (
    <div className="flex h-5 items-center gap-1 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
      {rounds.map((r) => (
        <HistoryPill
          key={r.id}
          label={formatMultiplier(r.multiplier)}
          title={r.label}
          win={r.win}
          onClick={() => viewer?.open(r)}
        />
      ))}
    </div>
  );
}