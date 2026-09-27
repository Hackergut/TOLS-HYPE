import { cn } from "cn";
import { playerFor, type PlayerTone } from "@/lib/players";

export function PlayerShot({
  handle,
  className,
  tone,
}: {
  handle: string;
  className?: string;
  tone?: PlayerTone;
}) {
  const p = playerFor(handle);
  return (
    <span className={cn("player-shot", className)} data-tone={tone ?? p.tone} aria-hidden>
      {p.initial}
    </span>
  );
}

export function BetPlayerCard({
  user,
  game,
  stake,
  payout,
  mult,
}: {
  user: string;
  game: string;
  stake?: number;
  payout: number;
  mult?: number;
}) {
  const win = payout > 0;
  return (
    <article className="bet-player">
      <PlayerShot handle={user} />
      <div className="flex min-w-0 flex-col justify-center gap-0.5 py-2 pr-3 pl-2">
        <p className="truncate font-medium">{user}</p>
        <p className="truncate text-xs text-muted-foreground">{game}</p>
        {typeof mult === "number" ? (
          <p className={cn("font-heading text-lg tabular-nums", win ? "text-lime" : "text-muted-foreground")}>
            {mult.toFixed(2)}×
          </p>
        ) : null}
        <p className={cn("text-xs tabular-nums", win ? "text-lime" : "text-muted-foreground")}>
          {win ? `+${payout.toLocaleString()}` : stake != null ? `−${stake.toLocaleString()}` : "—"}
        </p>
      </div>
    </article>
  );
}
