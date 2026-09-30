import { useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import { useBetHistory } from "@/lib/bet-history";
import { formatMoney } from "@/lib/format";

function weekStart(now = Date.now()) {
  const d = new Date(now);
  const day = d.getUTCDay();
  const mondayOffset = day === 0 ? 6 : day - 1;
  return Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate() - mondayOffset);
}

function nextReset(now = Date.now()) {
  return weekStart(now) + 7 * 24 * 60 * 60 * 1000;
}

function parts(ms: number) {
  const s = Math.max(0, Math.floor(ms / 1000));
  return {
    Days: Math.floor(s / 86400),
    Hours: Math.floor((s % 86400) / 3600),
    Minutes: Math.floor((s % 3600) / 60),
    Seconds: s % 60,
  };
}

const BOARD = Array.from({ length: 100 }, (_, i) => ({
  wagered: Math.max(500, 128400 - i * 1100),
  prize: Math.max(50, Math.round(25000 / (1 + i * 0.35))),
}));

export function WeeklyRaceModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const bets = useBetHistory();
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    if (!open) return;
    const id = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(id);
  }, [open]);

  if (!open) return null;

  const start = weekStart(now);
  const wagered = bets.filter((b) => b.at >= start).reduce((sum, b) => sum + b.stake, 0);
  const rank = wagered <= 0 ? null : BOARD.filter((row) => row.wagered > wagered).length + 1;
  const prize = rank == null || rank > 100 ? 0 : (BOARD[rank - 1]?.prize ?? 0);
  const clock = parts(nextReset(now) - now);

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/70 p-4" onClick={onClose}>
      <div
        role="dialog"
        aria-modal="true"
        aria-label="$100,000 Weekly Race"
        className="relative max-h-[850px] w-full max-w-[540px] overflow-y-auto rounded-lg bg-[#121418] shadow-[0_2px_20px_10px_rgba(17,17,18,0.25)]"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          aria-label="Close modal"
          onClick={onClose}
          className="absolute top-2 right-1 z-10 grid size-11 place-items-center rounded-full"
        >
          <TimesIcon />
        </button>
        <div className="px-6 py-8 sm:px-10 sm:py-10">
          <header className="-mx-6 -mt-8 mb-4 overflow-hidden rounded-t-lg bg-[linear-gradient(124deg,#14f1d9,#0e8f86)] px-8 py-8 text-center text-black sm:-mx-10 sm:-mt-10">
            <RaceMark />
            <h2 className="mt-4 text-[26px] leading-tight font-bold" style={{ textShadow: "1px 1px 4px #000" }}>
              $100,000 Weekly Race
            </h2>
            <div className="mt-4 flex justify-center gap-2.5">
              {Object.entries(clock).map(([label, value]) => (
                <div
                  key={label}
                  className="grid h-16 w-16 place-items-center rounded border border-lime bg-black px-1 text-white"
                >
                  <p className="text-[22px] leading-none font-bold text-lime tabular-nums">{value}</p>
                  <p className="text-[10px] leading-none">{label}</p>
                </div>
              ))}
            </div>
          </header>
          <p className="text-center text-sm leading-[21px]">
            Wager on Originals to climb the board. The top 100 split $100,000 when the week closes.
          </p>
          <div className="mt-4 grid gap-4">
            <Field label="Your position" value={rank == null ? "Unranked" : `#${rank}`} />
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Total wagered" value={`$${formatMoney(wagered, "USDT")}`} mark="$" />
              <Field label="Current prize" value={`$${formatMoney(prize, "USDT")}`} mark="₿" />
            </div>
            <section className="grid gap-2 rounded-md bg-[#202329] p-4">
              <h3 className="text-sm font-medium">Race rules</h3>
              <ol className="grid list-decimal gap-2 pl-4 text-xs leading-5 text-[#bec6d1]">
                <li>The race runs Monday 00:00 UTC to the next Monday 00:00 UTC, then the board resets.</li>
                <li>Only settled paid bets on Originals count. The stake is added when the round closes. Practice bets at 0 do not count.</li>
                <li>Rank is total wagered, highest first. A tie goes to the player who reached that total first.</li>
                <li>The top 100 share the $100,000 pool. The share is larger near the top. Rank 101 and below pays $0.</li>
                <li>Prizes are credited to VIP rewards at the reset. They are not added to the wallet mid-race.</li>
                <li>Your position and prize on this card use the settled bets stored on this device.</li>
              </ol>
            </section>
            <Link
              to="/promotions"
              hash="race"
              onClick={onClose}
              className="flex h-[54px] items-center justify-center rounded-md bg-lime text-sm font-medium text-black"
            >
              Learn more
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

function Field({ label, value, mark }: { label: string; value: string; mark?: string }) {
  return (
    <label className="grid gap-1">
      <span className="text-xs font-medium">{label}</span>
      <span className="relative">
        {mark ? (
          <span className="absolute top-1/2 left-3 grid size-4 -translate-y-1/2 place-items-center rounded-full bg-[#2a2e38] text-[10px] font-bold">
            {mark}
          </span>
        ) : null}
        <input
          readOnly
          disabled
          value={value}
          className="h-12 w-full rounded-md border border-[#2a2e38] bg-transparent pr-3 pl-4 text-sm opacity-70 disabled:pl-9"
          style={{ paddingLeft: mark ? 36 : 16 }}
        />
      </span>
    </label>
  );
}

function TimesIcon() {
  return (
    <svg viewBox="0 0 16 16" className="size-4" aria-hidden>
      <path d="M3.5 3.5 12.5 12.5M12.5 3.5 3.5 12.5" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  );
}

function RaceMark() {
  return (
    <svg viewBox="0 0 80 80" className="mx-auto size-20" aria-hidden>
      <circle cx="40" cy="40" r="36" fill="#250059" />
      <path d="M24 52V22h18l8 8-8 8H32v14H24Z" fill="#fff" />
      <path d="M42 30h14v8H42l-4-4 4-4Z" fill="#00ffbd" />
    </svg>
  );
}
