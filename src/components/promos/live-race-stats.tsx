import { useEffect, useState, type PointerEvent as ReactPointerEvent } from "react";
import { useBetHistory } from "@/lib/bet-history";
import { formatMoney } from "@/lib/format";
import { useGameTableOptional } from "@/components/games/game-table";
import { cn } from "cn";

function weekStart(now = Date.now()) {
  const d = new Date(now);
  const day = d.getUTCDay();
  const mondayOffset = day === 0 ? 6 : day - 1;
  return Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate() - mondayOffset);
}

const BOARD = Array.from({ length: 100 }, (_, i) => ({
  wagered: Math.max(500, 128400 - i * 1100),
  prize: Math.max(50, Math.round(25000 / (1 + i * 0.35))),
}));

function remainLabel(ms: number) {
  const s = Math.max(0, Math.floor(ms / 1000));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  return `${h}:${String(m).padStart(2, "0")}:${String(sec).padStart(2, "0")}`;
}

export function LiveRaceStats({ open, onClose }: { open: boolean; onClose: () => void }) {
  const bets = useBetHistory();
  const [now, setNow] = useState(() => Date.now());
  const [since, setSince] = useState<number | null>(null);
  const [expanded, setExpanded] = useState(true);
  const [pos, setPos] = useState({ x: 16, y: 72 });

  useEffect(() => {
    if (!open) return;
    const id = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(id);
  }, [open]);

  if (!open) return null;

  const start = weekStart(now);
  const weekWager = bets.filter((b) => b.at >= start).reduce((sum, b) => sum + b.stake, 0);
  const shownWager = bets.filter((b) => b.at >= (since ?? start)).reduce((sum, b) => sum + b.stake, 0);
  const rank = weekWager <= 0 ? null : BOARD.filter((row) => row.wagered > weekWager).length + 1;
  const prize = rank == null || rank > 100 ? 0 : (BOARD[rank - 1]?.prize ?? 0);
  const remain = start + 7 * 24 * 60 * 60 * 1000 - now;
  const weekMs = 7 * 24 * 60 * 60 * 1000;
  const elapsed = 1 - Math.min(1, Math.max(0, remain / weekMs));
  const place = rank == null ? 0 : Math.max(0.06, 1 - Math.min(rank, 1000) / 1000);

  function drag(e: ReactPointerEvent) {
    const ox = pos.x;
    const oy = pos.y;
    const sx = e.clientX;
    const sy = e.clientY;
    function move(ev: PointerEvent) {
      setPos({ x: ox + ev.clientX - sx, y: oy + ev.clientY - sy });
    }
    function up() {
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", up);
    }
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", up);
  }

  return (
    <div className="fixed z-40 w-[280px]" style={{ left: pos.x, top: pos.y }}>
      <section className="overflow-hidden rounded-lg border border-[#2a2e38] bg-[#121418] shadow-[0_2px_20px_10px_rgba(17,17,18,0.25)]">
        <header className="flex">
          <div className="flex min-w-0 flex-1 cursor-move items-center gap-2 px-3 py-4 select-none" onPointerDown={drag}>
            <StatsIcon />
            <h3 className="truncate text-sm font-bold">Live statistics</h3>
          </div>
          <div className="flex items-center pr-1">
            <button type="button" aria-label="Reset stats" onClick={() => setSince(Date.now())} className="grid size-12 place-items-center">
              <SyncIcon />
            </button>
            <button type="button" aria-label="Close modal" onClick={onClose} className="grid size-11 place-items-center rounded-full">
              <svg viewBox="0 0 16 16" className="size-4" aria-hidden>
                <path d="M3.5 3.5 12.5 12.5M12.5 3.5 3.5 12.5" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
              </svg>
            </button>
          </div>
        </header>
        <div className="px-2 pb-2">
          <div className="overflow-hidden rounded-lg border border-[#2a2e38] bg-[#080808]">
            <button
              type="button"
              aria-expanded={expanded}
              onClick={() => setExpanded((v) => !v)}
              className="flex w-full items-center border-b border-[#2a2e38] px-3.5 py-3.5 text-sm font-bold"
            >
              Statistics
              <span className={cn("ml-auto transition-transform", expanded ? "rotate-180" : "")}>⌃</span>
            </button>
            {expanded ? (
              <div className="bg-[#121418] px-2 py-2">
                <div className="flex rounded-md bg-[#202329]">
                  <Donut id="remain" fraction={elapsed} value={remainLabel(remain)} label="Remaining" from="#00ffbd" to="#14f1d9" />
                  <div className="my-4 w-px bg-[#343843]" />
                  <Donut
                    id="place"
                    fraction={place}
                    value={rank == null ? "—" : `#${rank}`}
                    label="Position"
                    from="#904bf9"
                    to="#ea2fd4"
                  />
                </div>
                <div className="px-4">
                  <div className="flex h-12 items-center justify-between border-b border-[#343843] text-sm">
                    <span className="text-[#9ba5b4]">Prize</span>
                    <span className="font-medium text-lime tabular-nums">${formatMoney(prize, "USDT")}</span>
                  </div>
                  <div className="flex h-12 items-center justify-between text-sm">
                    <span className="text-[#9ba5b4]">Wagered</span>
                    <span className="font-medium tabular-nums">${formatMoney(shownWager, "USDT")}</span>
                  </div>
                </div>
                <RoundBlock />
              </div>
            ) : null}
          </div>
        </div>
      </section>
    </div>
  );
}

function RoundBlock() {
  const a = useGameTableOptional()?.analysis;
  if (!a || a.plays === 0) return null;
  const money = (n: number) => n.toLocaleString("en-US", { maximumFractionDigits: 2 });
  return (
    <div className="mt-2 rounded-md bg-[#202329] px-3 py-3">
      <div className="mb-2 flex items-center justify-between">
        <p className="text-sm font-bold">Round analysis</p>
        <span className="rounded-full bg-[#121418] px-2 py-0.5 text-[10px] font-semibold uppercase">{a.heat}</span>
      </div>
      <div className="mb-2 flex gap-0.5">
        {a.recent.slice(0, 20).reverse().map((r, i) => (
          <span key={`${r.at}-${i}`} title={r.label} className={cn("h-1.5 flex-1 rounded-sm", r.win ? "bg-lime" : "bg-white/20")} />
        ))}
      </div>
      <dl className="grid grid-cols-2 gap-x-3 gap-y-1 text-xs">
        <Row k="Rounds" v={String(a.plays)} />
        <Row k="Wins" v={`${a.wins} / ${a.losses}L`} />
        <Row k="Win rate" v={`${a.winRate}%`} />
        <Row k="Last 10" v={`${a.last10Rate}%`} />
        <Row k="Streak" v={a.streakKind === "-" ? "—" : `${a.streakKind}${a.streak}`} />
        <Row k="Best run" v={`${a.bestWinStreak}W`} />
        <Row k="Wagered" v={money(a.volume)} />
        <Row k="Returned" v={money(a.returned)} />
        <Row k="Net" v={`${a.net >= 0 ? "+" : ""}${money(a.net)}`} accent={a.net >= 0} />
        <Row k="Best ×" v={a.bestMult ? `${a.bestMult.toFixed(2)}×` : "—"} />
      </dl>
      {a.lastLabel ? <p className="mt-2 truncate text-[11px] text-[#9ba5b4]">Last · {a.lastLabel}</p> : null}
    </div>
  );
}

function Row({ k, v, accent }: { k: string; v: string; accent?: boolean }) {
  return (
    <div className="flex justify-between gap-2">
      <dt className="text-[#9ba5b4]">{k}</dt>
      <dd className={cn("tabular-nums", accent && "text-lime")}>{v}</dd>
    </div>
  );
}

function Donut({
  id,
  fraction,
  value,
  label,
  from,
  to,
}: {
  id: string;
  fraction: number;
  value: string;
  label: string;
  from: string;
  to: string;
}) {
  const r = 42;
  const c = 2 * Math.PI * r;
  const filled = Math.max(0, Math.min(1, fraction)) * c;
  return (
    <div className="grid flex-1 place-items-center py-3">
      <svg width="116" height="116" viewBox="0 0 116 116" aria-hidden>
        <defs>
          <linearGradient id={id} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor={from} />
            <stop offset="100%" stopColor={to} />
          </linearGradient>
        </defs>
        <circle cx="58" cy="58" r={r} fill="none" stroke="#4D5361" strokeWidth="8" />
        <circle
          cx="58"
          cy="58"
          r={r}
          fill="none"
          stroke={`url(#${id})`}
          strokeWidth="8"
          strokeDasharray={`${filled} ${c - filled}`}
          transform="rotate(-90 58 58)"
        />
        <text x="58" y="54" textAnchor="middle" fill="#fff" fontSize="13" fontWeight="700">
          {value}
        </text>
        <text x="58" y="70" textAnchor="middle" fill="#9BA5B4" fontSize="10">
          {label}
        </text>
      </svg>
    </div>
  );
}

function StatsIcon() {
  return (
    <svg viewBox="0 0 16 16" className="size-4 shrink-0" aria-hidden>
      <path d="M2 13V7h3v6H2Zm4.5 0V3h3v10h-3ZM11 13V5h3v8h-3Z" fill="currentColor" />
    </svg>
  );
}

function SyncIcon() {
  return (
    <svg viewBox="0 0 16 16" className="size-4" aria-hidden>
      <path
        d="M13 8a5 5 0 0 1-8.3 3.7L3 13.4V9h4.4L5.8 10.6A3.5 3.5 0 1 0 8 4.5V3a5 5 0 0 1 5 5Z"
        fill="currentColor"
      />
    </svg>
  );
}
