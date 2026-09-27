import { useMemo, useState } from "react";
import { HORSES, type FeedItem, type Player } from "./types";

interface Props {
  players: Player[];
  feed: FeedItem[];
  phase: "betting" | "countdown" | "racing" | "result";
  onClose?: () => void;
}

function Avatar({ hue, name }: { hue: number; name: string }) {
  return (
    <div
      className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[9px] font-black text-slate-900"
      style={{
        background: `linear-gradient(135deg, hsl(${hue} 85% 68%), hsl(${(hue + 40) % 360} 80% 48%))`,
      }}
    >
      {name.replace(/[^A-Za-z0-9]/g, "").slice(0, 2).toUpperCase()}
    </div>
  );
}

export default function LivePanel({ players, feed, phase, onClose }: Props) {
  const [tab, setTab] = useState<"players" | "feed">("players");

  const pot = useMemo(() => players.reduce((s, p) => s + p.bet, 0), [players]);
  const sorted = useMemo(() => {
    const arr = [...players];
    arr.sort((a, b) => (a.isYou ? -1 : b.isYou ? 1 : b.bet - a.bet));
    return arr;
  }, [players]);

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-xl border border-white/5 bg-slate-900/70 backdrop-blur">
      {/* header */}
      <div className="flex items-center justify-between gap-2 border-b border-white/5 px-3 py-2">
        <div className="flex min-w-0 items-center gap-2">
          <span className="relative flex h-2 w-2 shrink-0">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#a665f5] opacity-75" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-[#a665f5]" />
          </span>
          <span className="truncate text-[10px] font-black uppercase tracking-[0.18em] text-slate-200">
            Live Lobby
          </span>
          <span className="shrink-0 rounded bg-white/5 px-1.5 py-0.5 font-mono text-[10px] font-bold text-[#00ffbd]">
            {players.length}
          </span>
        </div>
        <div className="flex shrink-0 items-center gap-1.5">
          <div className="rounded border border-[#00ffbd]/25 bg-[#00ffbd]/10 px-1.5 py-0.5 font-mono text-[10px] font-bold text-[#00ffbd]">
            ₡{pot.toLocaleString()}
          </div>
          {onClose && (
            <button
              onClick={onClose}
              className="rounded border border-white/10 px-1.5 text-[10px] text-slate-400 hover:bg-white/10"
            >
              ✕
            </button>
          )}
        </div>
      </div>

      {/* tabs */}
      <div className="grid grid-cols-2 gap-1 border-b border-white/5 p-1.5">
        {(["players", "feed"] as const).map((k) => (
          <button
            key={k}
            onClick={() => setTab(k)}
            className={`rounded-md py-1 text-[10px] font-bold uppercase tracking-wider transition ${
              tab === k ? "bg-[#00ffbd]/15 text-[#00ffbd]" : "text-slate-400 hover:bg-white/5"
            }`}
          >
            {k === "players" ? `Players` : `Feed`}
          </button>
        ))}
      </div>

      {/* body */}
      <div className="scroll-thin min-h-0 flex-1 overflow-y-auto">
        {tab === "players" ? (
          <div className="divide-y divide-white/5">
            {sorted.map((p) => {
              const h = HORSES[p.horseId];
              return (
                <div
                  key={p.id}
                  className={`flex items-center gap-2 px-2.5 py-1.5 text-[11px] ${
                    p.isYou ? "bg-[#00ffbd]/10" : ""
                  }`}
                >
                  <Avatar hue={p.hue} name={p.name} />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1">
                      <span
                        className={`truncate font-semibold ${
                          p.isYou ? "text-[#00ffbd]" : "text-slate-200"
                        }`}
                      >
                        {p.name}
                      </span>
                      {p.win && <span className="text-[9px]">🏆</span>}
                    </div>
                    <div className="flex items-center gap-1 text-[9px] text-slate-500">
                      <span
                        className="inline-block h-1.5 w-1.5 rounded-full"
                        style={{ background: h.color }}
                      />
                      <span className="truncate">{h.name}</span>
                    </div>
                  </div>
                  <div className="shrink-0 text-right">
                    <div className="font-mono font-bold text-slate-200">₡{p.bet.toLocaleString()}</div>
                    <div className="font-mono text-[9px] text-[#00ffbd]/80">
                      {h.odds.toFixed(1)}x → {p.potential.toLocaleString()}
                    </div>
                  </div>
                </div>
              );
            })}
            {phase === "betting" && (
              <div className="flex items-center gap-2 px-2.5 py-2 text-[10px] text-slate-500">
                <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-[#00ffbd]" />
                players joining…
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-1 p-2">
            {feed.length === 0 && (
              <div className="py-4 text-center text-[10px] text-slate-500">waiting for bets…</div>
            )}
            {feed.map((f) => {
              const h = HORSES[f.horseId];
              return (
                <div
                  key={f.id}
                  className="animate-rise flex items-center gap-2 rounded-lg border border-white/5 bg-slate-950/50 px-2 py-1.5 text-[10px]"
                >
                  <span
                    className="grid h-5 w-5 shrink-0 place-items-center rounded text-[10px]"
                    style={{ background: `${h.color}22`, color: h.color }}
                  >
                    {f.kind === "join" ? "🎟" : f.kind === "bigwin" ? "💥" : "✅"}
                  </span>
                  <span className="min-w-0 flex-1 truncate text-slate-300">{f.text}</span>
                  <span
                    className={`shrink-0 font-mono font-bold ${
                      f.kind === "join" ? "text-slate-400" : f.kind === "bigwin" ? "text-[#d6bfff]" : "text-[#00ffbd]"
                    }`}
                  >
                    {f.kind === "join" ? `₡${f.amount.toLocaleString()}` : `+₡${f.amount.toLocaleString()}`}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
