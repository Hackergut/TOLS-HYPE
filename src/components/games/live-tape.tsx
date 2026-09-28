import type { LiveTapeBet } from "@/lib/live-room";

export function LiveTape({ bets, hash }: { bets: LiveTapeBet[]; hash?: string }) {
  return (
    <div className="w-full max-w-md">
      {hash ? (
        <p className="truncate text-[10px] tracking-wide text-muted-foreground">HASH {hash.slice(0, 16)}</p>
      ) : null}
      {bets.length === 0 ? (
        <p className="mt-1 text-[11px] text-muted-foreground">No bets this round</p>
      ) : (
        <ul className="mt-1 max-h-24 space-y-0.5 overflow-hidden">
          {bets.slice(0, 8).map((bet, i) => (
            <li key={`${bet.name}-${i}`} className="flex items-center justify-between gap-2 text-[11px]">
              <span className={bet.mine ? "font-semibold text-lime" : "text-white/80"}>{bet.name}</span>
              <span className="tabular-nums text-muted-foreground">
                {bet.amount} {bet.currency}
                {bet.pick ? ` · ${bet.pick}` : ""}
                {bet.cashMult != null ? ` · ${bet.cashMult.toFixed(2)}×` : ""}
                {bet.status === "lost" ? " · out" : ""}
                {bet.status === "won" ? " · paid" : ""}
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
