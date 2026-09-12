import { cn } from "cn";

const TICKS = [0, 25, 50, 75, 100];

function clampRail(n: number) {
  return Math.min(98, Math.max(2, n));
}

export function DiceTrack({
  target,
  over,
  roll = null,
  rollWin = null,
  onTarget,
  compact = false,
}: {
  target: number;
  over: boolean;
  roll?: number | null;
  rollWin?: boolean | null;
  onTarget?: (n: number) => void;
  compact?: boolean;
}) {
  const greenLeft = !over;
  return (
    <div>
      <div className={cn("relative", compact ? "mb-1 h-5" : "mb-2 h-7")}>
        {roll != null ? (
          <div
            className={cn(
              "absolute -translate-x-1/2 rounded-md border-2 bg-card font-bold tabular-nums",
              compact ? "px-1.5 py-0 text-[0.65rem]" : "px-2 py-0.5 text-xs",
              rollWin ? "border-lime text-lime" : "border-purple text-purple",
            )}
            style={{ left: `${clampRail(roll)}%` }}
          >
            {roll.toFixed(2)}
          </div>
        ) : null}
      </div>
      <div className={cn("rounded-lg border-2 border-border bg-muted/60", compact ? "px-2 py-1.5" : "px-3 py-3")}>
        <div className={cn("relative", compact ? "h-5" : "h-8")}>
          <div className="absolute inset-x-0 top-1/2 h-2.5 -translate-y-1/2 overflow-hidden rounded-full">
            <div
              className={cn("absolute inset-y-0 left-0", greenLeft ? "bg-lime" : "bg-purple")}
              style={{ width: `${target}%` }}
            />
            <div
              className={cn("absolute inset-y-0 right-0", greenLeft ? "bg-purple" : "bg-lime")}
              style={{ width: `${100 - target}%` }}
            />
          </div>
          {onTarget ? (
            <input
              type="range"
              min={2}
              max={98}
              step={0.5}
              value={target}
              onChange={(e) => onTarget(Number(e.target.value))}
              className="dice-range absolute inset-0 w-full cursor-pointer"
              aria-label="Roll target"
            />
          ) : (
            <span
              className="pointer-events-none absolute top-1/2 size-3 -translate-x-1/2 -translate-y-1/2 rounded-full bg-card ring-2 ring-foreground/80"
              style={{ left: `${clampRail(target)}%` }}
            />
          )}
        </div>
      </div>
      <div className={cn("mt-1 flex justify-between px-1 text-muted-foreground", compact ? "text-[0.6rem]" : "text-xs")}>
        {TICKS.map((t) => (
          <span key={t}>{t}</span>
        ))}
      </div>
    </div>
  );
}
