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
  const winFromLeft = !over;
  const loseWidth = winFromLeft ? 100 - target : target;
  return (
    <div className="w-full">
      <div className={cn("relative", compact ? "h-8" : "h-16")}>
        {roll != null ? (
          <div className="absolute top-0 -translate-x-1/2" style={{ left: `${clampRail(roll)}%` }}>
            <ResultMark value={roll} win={rollWin} compact={compact} />
          </div>
        ) : null}
      </div>
      <div className={cn("relative", compact ? "h-6" : "h-9")}>
        <div className="absolute inset-x-0 top-1/2 h-2 -translate-y-1/2">
          <div className="absolute inset-0 rounded-full bg-[#00ffbd]" />
          <div
            className="absolute inset-y-0 rounded-full bg-[#f1323e]"
            style={winFromLeft ? { right: 0, width: `${loseWidth}%` } : { left: 0, width: `${loseWidth}%` }}
          />
        </div>
        {onTarget ? (
          <input
            type="range"
            min={2}
            max={98}
            step={0.01}
            value={target}
            onChange={(e) => onTarget(Number(e.target.value))}
            className="dice-range absolute inset-0 w-full cursor-pointer"
            aria-label="Roll target"
          />
        ) : null}
      </div>
      <div className={cn("mt-1 flex justify-between text-[#8b93a1]", compact ? "text-[0.6rem]" : "text-sm")}>
        {TICKS.map((t) => (
          <span key={t}>{t}</span>
        ))}
      </div>
    </div>
  );
}

function ResultMark({ value, win, compact }: { value: number; win: boolean | null; compact: boolean }) {
  const stroke = win == null ? "#00ffbd" : win ? "#00ffbd" : "#f1323e";
  const size = compact ? 36 : 57;
  return (
    <span className="relative grid place-items-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} viewBox="0 0 57 57" aria-hidden className="absolute inset-0">
        <path
          d="M0.12 9.86C0.12 4.48 4.48 0.12 9.86 0.12H46.61C51.99 0.12 56.35 4.48 56.35 9.86V51.54C56.35 54.2 54.2 56.35 51.54 56.35H9.86C4.48 56.35 0.12 51.99 0.12 46.61V9.86Z"
          fill={stroke}
        />
        <rect x="1.23" y="1.23" width="49.32" height="49.32" rx="3.7" fill="#121418" stroke={stroke} strokeWidth="2.47" />
      </svg>
      <span className={cn("relative font-bold tabular-nums text-white", compact ? "text-[0.6rem]" : "text-[13px]")}>
        {value.toFixed(2)}
      </span>
    </span>
  );
}
