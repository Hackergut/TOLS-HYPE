import { useState } from "react";

export type TrendRoll = { id: string; roll: number; win: boolean; mult: number };

const COLS = 12;
const CELLS = 36;

export function DiceTrends({
  open,
  onClose,
  rolls,
}: {
  open: boolean;
  onClose: () => void;
  rolls: TrendRoll[];
}) {
  const [help, setHelp] = useState(false);
  if (!open) return null;
  const shown = rolls.slice(0, CELLS);
  const points = shown
    .slice()
    .reverse()
    .map((row, i) => {
      const x = shown.length < 2 ? 8 : (i / (shown.length - 1)) * 200;
      const y = 36 - (Math.min(100, Math.max(0, row.roll)) / 100) * 28;
      return `${x},${y}`;
    })
    .join(" ");

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/70 p-4" onClick={onClose}>
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Trends"
        className="relative w-full max-w-[32rem] rounded-lg bg-[#121418] p-8 shadow-[0_2px_20px_10px_rgba(17,17,18,0.25)] sm:p-10"
        onClick={(e) => e.stopPropagation()}
      >
        <button type="button" aria-label="Close modal" onClick={onClose} className="absolute top-2 right-1 grid size-11 place-items-center rounded-full">
          <svg viewBox="0 0 16 16" className="size-4" aria-hidden>
            <path d="M3.5 3.5 12.5 12.5M12.5 3.5 3.5 12.5" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
          </svg>
        </button>
        <div className="mx-auto w-full max-w-[360px]">
          <h3 className="mb-3 text-center text-[22px] font-bold">Trends</h3>
          {shown.length > 1 ? (
            <svg viewBox="0 0 200 40" className="mb-3 h-10 w-full" aria-hidden>
              <polyline fill="none" stroke="#00ffbd" strokeWidth="1.5" points={points} />
            </svg>
          ) : null}
          <div className="grid grid-cols-12 gap-0.5">
            {Array.from({ length: CELLS }, (_, i) => {
              const row = shown[i];
              const hot = row ? row.win && row.mult >= 2 : false;
              const dot = !row ? null : hot ? "bg-[#904bf9]" : row.win ? "bg-lime" : "bg-[#3a3a3a]";
              return (
                <button
                  key={row?.id ?? `empty-${i}`}
                  type="button"
                  title={row ? `${row.roll.toFixed(2)} · ${row.win ? "hit" : "miss"}` : undefined}
                  className="grid aspect-square place-items-center rounded bg-[#2d2d2d]"
                >
                  {dot ? <span className={`block size-[58%] rounded-full ${dot}`} /> : null}
                </button>
              );
            })}
          </div>
          <div className="mt-3 flex justify-center gap-4 text-[11px] text-[#9ba5b4]">
            <span className="inline-flex items-center gap-1.5"><i className="size-2 rounded-full bg-lime" /> Hit</span>
            <span className="inline-flex items-center gap-1.5"><i className="size-2 rounded-full bg-[#3a3a3a]" /> Miss</span>
            <span className="inline-flex items-center gap-1.5"><i className="size-2 rounded-full bg-[#904bf9]" /> 2×+</span>
          </div>
          <button type="button" onClick={() => setHelp((v) => !v)} className="mt-2 flex h-12 w-full items-center justify-center text-sm font-medium underline">
            How to read this
          </button>
          {help ? (
            <p className="text-center text-xs leading-5 text-[#bec6d1]">
              Newest rolls start at the top left. Lime is a hit, dark is a miss, purple is a hit at 2× or more. The line is the roll path from old to new.
            </p>
          ) : null}
        </div>
      </div>
    </div>
  );
}
