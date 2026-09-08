import { useEffect, useMemo, useRef, useState, type PointerEvent } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PlayGate } from "@/components/games/play-gate";
import { GameShell } from "@/components/games/game-shell";
import { useGameTable } from "@/components/games/game-table";
import { FieldLabel, StakeField } from "@/components/games/stake-field";
import { playPool } from "@/lib/casino-api";
import { formatMoney } from "@/lib/format";
import { CURRENCY_META } from "@/lib/games-catalog";
import { loadAnimOn, loadHotkeysOn, loadInstantOn } from "@/lib/game-prefs";
import {
  BALL_R,
  PLAY_H,
  PLAY_W,
  POOL_LADDER,
  RAIL,
  TABLE_H,
  TABLE_W,
  cueBall,
  rackBalls,
  simulateBreak,
  toSvg,
  type PoolDiff,
  type PoolFrame,
} from "@/lib/pool-physics";
import { useWallet } from "@/lib/wallet-context";

const DIFFS: PoolDiff[] = ["beginner", "intermediate", "expert", "pro"];

const BALL_FILL: Record<number, string> = {
  0: "#f4f1ea",
  1: "#f5c518",
  2: "#2f6bff",
  3: "#e23b3b",
  4: "#7c3aed",
  5: "#f97316",
  6: "#16a34a",
  7: "#9f1239",
  8: "#111",
  9: "#f5c518",
  10: "#2f6bff",
  11: "#e23b3b",
  12: "#7c3aed",
  13: "#f97316",
  14: "#16a34a",
  15: "#9f1239",
};

export function PoolGame({ gameId }: { gameId: string }) {
  return (
    <PlayGate>
      <PoolTable gameId={gameId} />
    </PlayGate>
  );
}

function PoolTable({ gameId }: { gameId: string }) {
  const { currency, applyBalances } = useWallet();
  const { reportRound } = useGameTable();
  const meta = CURRENCY_META[currency];
  const [amount, setAmount] = useState(meta.minBet);
  const [diff, setDiff] = useState<PoolDiff>("expert");
  const [tab, setTab] = useState("manual");
  const [power, setPower] = useState(0.82);
  const [aim, setAim] = useState(0);
  const [busy, setBusy] = useState(false);
  const [last, setLast] = useState<{ balls: number; multiplier: number; scratch: boolean } | null>(null);
  const [frame, setFrame] = useState<PoolFrame>(() => restFrame());
  const [striking, setStriking] = useState(0);
  const svgRef = useRef<SVGSVGElement>(null);
  const raf = useRef(0);

  const cue = useMemo(() => {
    const c = frame[0];
    if (!c || c.p) return toSvg(PLAY_W * 0.25, PLAY_H / 2);
    return toSvg(c.x, c.y);
  }, [frame]);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (!loadHotkeysOn()) return;
      if (e.code !== "Space") return;
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      e.preventDefault();
      if (!busy) void breakShot();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [busy, power, aim, diff, amount]);

  function aimFromEvent(e: PointerEvent<SVGSVGElement>) {
    const el = svgRef.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    const x = ((e.clientX - r.left) / r.width) * TABLE_W;
    const y = ((e.clientY - r.top) / r.height) * TABLE_H;
    setAim((Math.atan2(y - cue.y, x - cue.x) * 180) / Math.PI);
  }

  function playFrames(frames: PoolFrame[], result: { balls: number; multiplier: number; scratch: boolean }) {
    cancelAnimationFrame(raf.current);
    if (!loadAnimOn() || loadInstantOn() || frames.length < 2) {
      setFrame(frames[frames.length - 1] ?? restFrame());
      setStriking(0);
      return;
    }
    let i = 0;
    const t0 = performance.now();
    const msPer = 1000 / 60;
    const tick = (now: number) => {
      i = Math.min(frames.length - 1, Math.floor((now - t0) / msPer));
      setFrame(frames[i]!);
      if (i < frames.length - 1) raf.current = requestAnimationFrame(tick);
      else setStriking(0);
    };
    setStriking(1);
    raf.current = requestAnimationFrame(tick);
    void result;
  }

  async function breakShot() {
    setBusy(true);
    setLast(null);
    try {
      const res = await playPool({
        data: { gameId, currency, amount, difficulty: diff, power, aim },
      });
      applyBalances(res.balances);
      const sim = simulateBreak({
        power,
        aimDeg: aim,
        floats: res.floats,
        difficulty: diff,
      });
      playFrames(sim.frames, { balls: res.balls, multiplier: res.multiplier, scratch: res.scratch });
      setLast({ balls: res.balls, multiplier: res.multiplier, scratch: res.scratch });
      reportRound({
        win: res.multiplier > 0,
        label: res.scratch ? "Scratch" : `${res.balls} balls · ${res.multiplier}×`,
        stake: amount,
        payout: res.payout,
        multiplier: res.multiplier,
        fair: res.fair,
        view: { kind: "pool", balls: res.balls, scratch: res.scratch, pocketed: res.pocketed },
        replay: () => playFrames(sim.frames, res),
      });
      if (res.scratch) toast.message("Scratch · 0×");
      else if (res.multiplier > 0) toast.success(`${res.balls} pocketed · ${res.multiplier}×`);
      else toast.message("Dry break · 0×");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Break failed");
    } finally {
      setBusy(false);
    }
  }

  const rad = (aim * Math.PI) / 180;
  const pull = 70 + power * 50;
  const cueX2 = cue.x - Math.cos(rad) * (pull + striking * 8);
  const cueY2 = cue.y - Math.sin(rad) * (pull + striking * 8);
  const ghostX = cue.x + Math.cos(rad) * 90;
  const ghostY = cue.y + Math.sin(rad) * 90;

  return (
    <GameShell
      controls={
        <>
          <FieldLabel label="Break">
            <div className="grid grid-cols-4 gap-1 rounded-lg bg-muted p-1">
              {DIFFS.map((d) => (
                <Button
                  key={d}
                  type="button"
                  size="sm"
                  variant={diff === d ? "default" : "ghost"}
                  className="h-8 capitalize"
                  onClick={() => setDiff(d)}
                >
                  {d.slice(0, 3)}
                </Button>
              ))}
            </div>
          </FieldLabel>
          <Tabs value={tab} onValueChange={setTab} className="gap-0">
            <TabsList className="h-10 w-full rounded-lg bg-muted">
              <TabsTrigger value="manual" className="flex-1">Manual</TabsTrigger>
              <TabsTrigger value="auto" className="flex-1">Auto</TabsTrigger>
            </TabsList>
          </Tabs>
          <button
            type="button"
            disabled={busy}
            onClick={() => void breakShot()}
            className="h-12 w-full rounded-lg bg-lime text-base font-bold text-black hover:bg-lime/90 disabled:opacity-50"
          >
            Break
          </button>
          <StakeField amount={amount} setAmount={setAmount} disabled={busy} />
          <p className="text-[0.65rem] text-muted-foreground">Space to break · 96% RTP</p>
        </>
      }
      play={
        <div className="flex flex-col gap-3">
          <div className="flex flex-wrap justify-center gap-1">
            {POOL_LADDER.map((m, n) => (
              <span
                key={n}
                className={`rounded-full border px-2 py-0.5 text-[0.65rem] tabular-nums ${
                  last && last.balls === n
                    ? "border-lime bg-lime text-black"
                    : "border-border text-muted-foreground"
                }`}
              >
                {n} · {m}×
              </span>
            ))}
          </div>
          <svg
            ref={svgRef}
            viewBox={`0 0 ${TABLE_W} ${TABLE_H}`}
            className="w-full cursor-crosshair touch-none rounded-xl"
            onPointerDown={aimFromEvent}
            onPointerMove={(e) => {
              if (e.buttons) aimFromEvent(e);
            }}
          >
            <rect width={TABLE_W} height={TABLE_H} rx="22" fill="#3a2412" />
            <rect x="8" y="8" width={TABLE_W - 16} height={TABLE_H - 16} rx="16" fill="#5a3a1c" />
            <rect x={RAIL} y={RAIL} width={PLAY_W} height={PLAY_H} fill="#2a1254" />
            <rect x={RAIL} y={RAIL} width={PLAY_W} height={PLAY_H} fill="#3b1a70" opacity="0.55" />
            {/* Head string */}
            <line
              x1={RAIL + PLAY_W * 0.25}
              y1={RAIL + 8}
              x2={RAIL + PLAY_W * 0.25}
              y2={RAIL + PLAY_H - 8}
              stroke="#c8f04d"
              strokeOpacity="0.18"
              strokeDasharray="4 6"
            />
            {/* Diamonds */}
            {[0.25, 0.5, 0.75].map((t) => (
              <g key={`d-${t}`}>
                <circle cx={RAIL + PLAY_W * t} cy={18} r="3" fill="#e8d5a3" />
                <circle cx={RAIL + PLAY_W * t} cy={TABLE_H - 18} r="3" fill="#e8d5a3" />
              </g>
            ))}
            {[0.5].map((t) => (
              <g key={`s-${t}`}>
                <circle cx={18} cy={RAIL + PLAY_H * t} r="3" fill="#e8d5a3" />
                <circle cx={TABLE_W - 18} cy={RAIL + PLAY_H * t} r="3" fill="#e8d5a3" />
              </g>
            ))}
            {/* Pockets */}
            {[
              [RAIL, RAIL],
              [RAIL + PLAY_W, RAIL],
              [RAIL, RAIL + PLAY_H],
              [RAIL + PLAY_W, RAIL + PLAY_H],
              [RAIL + PLAY_W / 2, RAIL],
              [RAIL + PLAY_W / 2, RAIL + PLAY_H],
            ].map(([x, y], i) => (
              <circle key={i} cx={x} cy={y} r={i < 4 ? 16 : 14} fill="#0b0b10" stroke="#c8f04d" strokeWidth="1.4" />
            ))}
            {/* Aim + cue */}
            {!frame[0]?.p ? (
              <>
                <line
                  x1={cue.x}
                  y1={cue.y}
                  x2={ghostX}
                  y2={ghostY}
                  stroke="#c8f04d"
                  strokeDasharray="4 5"
                  strokeWidth="1.2"
                  opacity="0.55"
                />
                <line
                  x1={cue.x}
                  y1={cue.y}
                  x2={cueX2}
                  y2={cueY2}
                  stroke="#c4a574"
                  strokeWidth="5"
                  strokeLinecap="round"
                />
                <circle cx={cueX2} cy={cueY2} r="3" fill="#111" />
              </>
            ) : null}
            {frame.map((b, i) => {
              if (b.p) return null;
              const p = toSvg(b.x, b.y);
              const id = i === 0 ? 0 : rackIds()[i - 1]!;
              const stripe = id >= 9;
              return (
                <g key={i}>
                  <circle cx={p.x} cy={p.y} r={BALL_R} fill={BALL_FILL[id]} stroke="#111" strokeWidth="0.7" />
                  {stripe ? (
                    <rect x={p.x - BALL_R + 1} y={p.y - 3} width={BALL_R * 2 - 2} height="6" fill="#fff" opacity="0.9" />
                  ) : null}
                  {id > 0 ? (
                    <text
                      x={p.x}
                      y={p.y + 3.2}
                      textAnchor="middle"
                      fontSize="8"
                      fontWeight="700"
                      fill={id === 8 ? "#fff" : "#111"}
                    >
                      {id}
                    </text>
                  ) : null}
                </g>
              );
            })}
          </svg>
          <label className="flex items-center gap-3">
            <span className="text-[0.65rem] font-bold tracking-wider text-lime">PWR</span>
            <input
              type="range"
              min={0.15}
              max={1}
              step={0.01}
              value={power}
              onChange={(e) => setPower(Number(e.target.value))}
              className="h-2 flex-1 cursor-pointer accent-[oklch(0.897_0.196_126.665)]"
              aria-label="Power"
            />
            <span className="w-8 text-right text-xs tabular-nums">{Math.round(power * 100)}</span>
          </label>
          {last ? (
            <p className="text-center text-sm tabular-nums">
              {last.scratch ? "Scratch" : `${last.balls} pocketed`} ·{" "}
              <span className="text-lime">{last.multiplier}×</span>
              {last.multiplier > 0 ? ` · ${formatMoney(amount * last.multiplier, currency)}` : null}
            </p>
          ) : (
            <p className="text-center text-xs text-muted-foreground">Drag to aim the kitchen break · triangle at the foot spot</p>
          )}
        </div>
      }
    />
  );
}

function rackIds() {
  return [1, 2, 3, 9, 8, 10, 6, 11, 7, 14, 13, 4, 12, 5, 15];
}

function restFrame(): PoolFrame {
  const cue = cueBall();
  const rack = rackBalls();
  return [{ x: cue.x, y: cue.y, p: false }, ...rack.map((b) => ({ x: b.x, y: b.y, p: false }))];
}
