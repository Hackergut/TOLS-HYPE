import { useEffect, useMemo, useRef, useState, type PointerEvent } from "react";
import { toast } from "sonner";
import { PlayGate } from "@/components/games/play-gate";
import { GameShell } from "@/components/games/game-shell";
import { LiveBetDesk, type DeskBet } from "@/components/games/live-bet-desk";
import { useGameTable } from "@/components/games/game-table";
import { playPool } from "@/lib/casino-api";
import { formatMoney } from "@/lib/format";
import { loadHotkeysOn } from "@/lib/game-prefs";
import { playSfx } from "@/lib/game-sound";
import { poolFrameMs } from "@/lib/game-speed";
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
  type PoolDiff,
  type PoolFrame,
} from "@/lib/pool-physics";
import { TOLS_HEX } from "@/lib/palette";
import { useWallet } from "@/lib/wallet-context";

const DIFFS: PoolDiff[] = ["beginner", "intermediate", "expert", "pro"];
const DIFF_LABEL: Record<PoolDiff, string> = {
  beginner: "Beginner",
  intermediate: "Mid",
  expert: "Expert",
  pro: "Pro",
};

const BALL_FILL: Record<number, string> = {
  0: "#f4f1ea",
  1: "#f5c518",
  2: "#2f6bff",
  3: "#e23b3b",
  4: TOLS_HEX.purple,
  5: "#f97316",
  6: "#16a34a",
  7: "#9f1239",
  8: "#111",
  9: "#f5c518",
  10: "#2f6bff",
  11: "#e23b3b",
  12: TOLS_HEX.purple,
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
  const { currency, balances, applyBalances } = useWallet();
  const { reportRound } = useGameTable();
  const [amount, setAmount] = useState(0);
  const [diff, setDiff] = useState<PoolDiff>("expert");
  const [mode, setMode] = useState<"manual" | "auto">("manual");
  const [power, setPower] = useState(0.82);
  const [aim, setAim] = useState(0);
  const [busy, setBusy] = useState(false);
  const [openBets, setOpenBets] = useState(true);
  const [bets, setBets] = useState<DeskBet[]>([]);
  const [profit, setProfit] = useState(0);
  const [last, setLast] = useState<{ balls: number; multiplier: number; scratch: boolean } | null>(null);
  const [frame, setFrame] = useState<PoolFrame>(() => restFrame());
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const raf = useRef(0);
  const playing = useRef(false);
  const autoRef = useRef(false);
  const stopAuto = useRef(false);
  const aimRef = useRef(aim);
  const powerRef = useRef(power);
  const frameRef = useRef(frame);
  autoRef.current = mode === "auto";
  aimRef.current = aim;
  powerRef.current = power;
  frameRef.current = frame;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ro = new ResizeObserver(() => {
      if (playing.current) return;
      paintPool(canvas, frameRef.current, {
        aim: aimRef.current,
        power: powerRef.current,
        showAim: !busy,
        stick: "ball",
      });
    });
    ro.observe(canvas);
    return () => {
      ro.disconnect();
      cancelAnimationFrame(raf.current);
    };
  }, [busy]);

  const cue = useMemo(() => {
    const c = frame[0];
    if (!c || c.p) return { x: RAIL + PLAY_W * 0.25, y: RAIL + PLAY_H / 2 };
    return { x: c.x + RAIL, y: c.y + RAIL };
  }, [frame]);

  useEffect(() => {
    if (playing.current) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    paintPool(canvas, frame, { aim, power, showAim: !busy, stick: "ball" });
  }, [aim, busy, frame, power]);

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
  }, [busy, power, aim, diff, amount, mode]);

  function aimFromEvent(e: PointerEvent<HTMLCanvasElement>) {
    if (busy) return;
    const el = canvasRef.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    const x = ((e.clientX - r.left) / r.width) * TABLE_W;
    const y = ((e.clientY - r.top) / r.height) * TABLE_H;
    setAim((Math.atan2(y - cue.y, x - cue.x) * 180) / Math.PI);
  }

  function playFrames(frames: PoolFrame[]): Promise<void> {
    cancelAnimationFrame(raf.current);
    const canvas = canvasRef.current;
    const msPer = poolFrameMs();
    const lastFrame = frames[frames.length - 1] ?? restFrame();
    const address = frames[0] ?? restFrame();
    if (!canvas || msPer <= 0 || frames.length < 2) {
      playing.current = false;
      setFrame(lastFrame);
      return Promise.resolve();
    }
    playing.current = true;
    playSfx("hit");
    const ball = address[0];
    const anchor = ball ? { x: ball.x + RAIL, y: ball.y + RAIL } : { x: RAIL + PLAY_W * 0.25, y: RAIL + PLAY_H / 2 };
    const aim = aimRef.current;
    const pulled = BALL_R + 16 + powerRef.current * 62;
    const contact = BALL_R + 1.5;
    const strikeMs = 140;
    return new Promise((resolve) => {
      const t0 = performance.now();
      const tick = (now: number) => {
        const elapsed = now - t0;
        if (elapsed < strikeMs) {
          const t = elapsed / strikeMs;
          const gap = pulled + (contact - pulled) * t;
          paintPool(canvas, address, {
            aim,
            power: powerRef.current,
            showAim: false,
            stick: { ...anchor, aim, gap, alpha: 1 },
          });
          raf.current = requestAnimationFrame(tick);
          return;
        }
        const i = Math.min(frames.length - 1, Math.floor((elapsed - strikeMs) / msPer));
        const away = elapsed - strikeMs;
        const stick =
          away < 280
            ? { ...anchor, aim, gap: contact + away * 0.55, alpha: 1 - away / 280 }
            : null;
        paintPool(canvas, frames[i]!, {
          aim,
          power: powerRef.current,
          showAim: false,
          stick,
        });
        if (i < frames.length - 1) raf.current = requestAnimationFrame(tick);
        else {
          playing.current = false;
          setFrame(lastFrame);
          resolve();
        }
      };
      raf.current = requestAnimationFrame(tick);
    });
  }

  async function breakShot() {
    setBusy(true);
    setLast(null);
    setProfit(0);
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
      await playFrames(sim.frames);
      if (res.balls > 0) playSfx("pocket");
      else playSfx("lose");
      setLast({ balls: res.balls, multiplier: res.multiplier, scratch: res.scratch });
      setProfit(Math.max(0, res.payout - amount));
      window.setTimeout(() => {
        if (!playing.current) setFrame(restFrame());
      }, 900);
      setBets((prev) =>
        [
          {
            name: "You",
            pick: diff,
            amount,
            status: res.multiplier > 0 ? "won" : "lost",
            mine: true,
          },
          ...prev,
        ].slice(0, 24),
      );
      reportRound({
        win: res.multiplier > 0,
        label: res.scratch ? "Scratch" : `${res.balls} balls · ${res.multiplier}×`,
        stake: amount,
        payout: res.payout,
        multiplier: res.multiplier,
        fair: res.fair,
        view: { kind: "pool", balls: res.balls, scratch: res.scratch, pocketed: res.pocketed },
        replay: () => {
          void playFrames(sim.frames);
        },
      });
      if (res.scratch) toast.message("Scratch · 0×");
      else if (res.multiplier > 0) toast.success(`${res.balls} pocketed · ${res.multiplier}×`);
      else toast.message("Dry break · 0×");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Break failed");
    } finally {
      setBusy(false);
      if (autoRef.current && !stopAuto.current) {
        window.setTimeout(() => {
          if (autoRef.current && !stopAuto.current) void breakShot();
        }, 420);
      }
    }
  }

  function onBreak() {
    if (mode === "auto" && busy) {
      stopAuto.current = true;
      return;
    }
    stopAuto.current = false;
    void breakShot();
  }

  return (
    <GameShell
      controls={
        <LiveBetDesk
          mode={mode}
          setMode={(next) => {
            setMode(next);
            if (next !== "auto") stopAuto.current = true;
          }}
          amount={amount}
          setAmount={setAmount}
          busy={mode === "manual" && busy}
          inputsLocked={busy}
          currency={currency}
          balance={balances[currency]}
          profit={profit}
          closed={false}
          onAdd={onBreak}
          buttonLabel={mode === "auto" && busy ? "Stop" : "Break"}
          bets={bets}
          openBets={openBets}
          setOpenBets={setOpenBets}
          formatPick={(bet) => DIFF_LABEL[bet.pick as PoolDiff] ?? bet.pick}
        >
          <div className="grid grid-cols-2 gap-1.5">
            {DIFFS.map((d) => (
              <button
                key={d}
                type="button"
                disabled={busy}
                onClick={() => {
                  setDiff(d);
                  playSfx("click");
                }}
                className={`h-9 rounded-md text-xs font-medium ${
                  diff === d ? "bg-[#343843] text-white" : "bg-[#202329] text-[#bec6d1]"
                } disabled:opacity-60`}
              >
                {DIFF_LABEL[d]}
              </button>
            ))}
          </div>
        </LiveBetDesk>
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
          <div className="flex items-stretch gap-3">
            <canvas
              ref={canvasRef}
              className="aspect-[11/6] min-w-0 flex-1 cursor-crosshair touch-none rounded-xl"
              onPointerDown={aimFromEvent}
              onPointerMove={(e) => {
                if (e.buttons) aimFromEvent(e);
              }}
            />
            <label className="flex w-8 shrink-0 flex-col items-center gap-1 self-stretch py-1">
              <span className="relative w-3 flex-1 overflow-hidden rounded-full bg-[#2d2d2d]">
                <span
                  className="absolute inset-x-0 bottom-0 rounded-full bg-lime"
                  style={{ height: `${Math.round(power * 100)}%` }}
                />
                <input
                  type="range"
                  min={0.15}
                  max={1}
                  step={0.01}
                  value={power}
                  onChange={(e) => setPower(Number(e.target.value))}
                  className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
                  style={{ writingMode: "vertical-lr", direction: "rtl" }}
                  aria-label="Power"
                  disabled={busy}
                />
              </span>
              <span className="text-[0.6rem] font-bold tracking-wider text-lime">PWR</span>
            </label>
          </div>
          {last ? (
            <p className="text-center text-sm tabular-nums">
              {last.scratch ? "Scratch" : `${last.balls} pocketed`} ·{" "}
              <span className="text-lime">{last.multiplier}×</span>
              {last.multiplier > 0 ? ` · ${formatMoney(amount * last.multiplier, currency)}` : null}
            </p>
          ) : (
            <p className="text-center text-xs text-muted-foreground">
              Drag to aim · Space to break · 96% RTP
            </p>
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

function paintPool(
  canvas: HTMLCanvasElement,
  frame: PoolFrame,
  opts: { aim: number; power: number; showAim: boolean; stick: Stick | "ball" | null },
) {
  const dpr = Math.min(2, window.devicePixelRatio || 1);
  const cssW = canvas.clientWidth || TABLE_W;
  const cssH = canvas.clientHeight || cssW * (TABLE_H / TABLE_W);
  const pxW = Math.max(1, Math.floor(cssW * dpr));
  const pxH = Math.max(1, Math.floor(cssH * dpr));
  if (canvas.width !== pxW || canvas.height !== pxH) {
    canvas.width = pxW;
    canvas.height = pxH;
  }
  const ctx = canvas.getContext("2d");
  if (!ctx) return;
  ctx.setTransform(pxW / TABLE_W, 0, 0, pxH / TABLE_H, 0, 0);
  ctx.clearRect(0, 0, TABLE_W, TABLE_H);
  ctx.fillStyle = "#141416";
  roundRect(ctx, 0, 0, TABLE_W, TABLE_H, 28);
  ctx.fill();
  ctx.fillStyle = "#1c1c20";
  roundRect(ctx, 8, 8, TABLE_W - 16, TABLE_H - 16, 22);
  ctx.fill();
  const felt = ctx.createLinearGradient(0, RAIL, 0, RAIL + PLAY_H);
  felt.addColorStop(0, "#5a1cb8");
  felt.addColorStop(0.5, TOLS_HEX.purple);
  felt.addColorStop(1, "#4a1288");
  ctx.fillStyle = felt;
  ctx.fillRect(RAIL, RAIL, PLAY_W, PLAY_H);
  ctx.strokeStyle = TOLS_HEX.lime;
  ctx.lineWidth = 3;
  ctx.strokeRect(RAIL, RAIL, PLAY_W, PLAY_H);
  ctx.globalAlpha = 0.55;
  ctx.lineWidth = 1.2;
  ctx.beginPath();
  ctx.moveTo(RAIL + PLAY_W * 0.25, RAIL + 10);
  ctx.lineTo(RAIL + PLAY_W * 0.25, RAIL + PLAY_H - 10);
  ctx.moveTo(RAIL + 12, RAIL + PLAY_H / 2);
  ctx.lineTo(RAIL + PLAY_W * 0.25, RAIL + PLAY_H / 2);
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(RAIL + PLAY_W * 0.25, RAIL + PLAY_H / 2, 28, 0, Math.PI * 2);
  ctx.stroke();
  ctx.globalAlpha = 0.28;
  ctx.setLineDash([3, 6]);
  ctx.beginPath();
  ctx.moveTo(RAIL + PLAY_W * 0.25, RAIL + PLAY_H / 2);
  ctx.lineTo(RAIL + PLAY_W * 0.75, RAIL + PLAY_H / 2);
  ctx.stroke();
  ctx.setLineDash([]);
  ctx.globalAlpha = 1;
  ctx.fillStyle = TOLS_HEX.lime;
  for (const t of [0.25, 0.5, 0.75]) {
    diamond(ctx, RAIL + PLAY_W * t, 17.5);
    diamond(ctx, RAIL + PLAY_W * t, TABLE_H - 17.5);
    diamond(ctx, 17.5, RAIL + PLAY_H * t);
    diamond(ctx, TABLE_W - 17.5, RAIL + PLAY_H * t);
  }
  const pockets: [number, number, number][] = [
    [RAIL, RAIL, 16],
    [RAIL + PLAY_W, RAIL, 16],
    [RAIL, RAIL + PLAY_H, 16],
    [RAIL + PLAY_W, RAIL + PLAY_H, 16],
    [RAIL + PLAY_W / 2, RAIL, 14],
    [RAIL + PLAY_W / 2, RAIL + PLAY_H, 14],
  ];
  for (const [x, y, r] of pockets) {
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fillStyle = TOLS_HEX.black;
    ctx.fill();
    ctx.lineWidth = 1.6;
    ctx.strokeStyle = TOLS_HEX.lime;
    ctx.stroke();
  }

  const cue = frame[0];
  const stick =
    opts.stick === "ball"
      ? cue && !cue.p
        ? {
            x: cue.x + RAIL,
            y: cue.y + RAIL,
            aim: opts.aim,
            gap: BALL_R + 14 + opts.power * 58,
            alpha: 1,
          }
        : null
      : opts.stick;
  if (opts.showAim && cue && !cue.p) {
    const rad = (opts.aim * Math.PI) / 180;
    ctx.globalAlpha = 0.55;
    ctx.setLineDash([4, 5]);
    ctx.strokeStyle = TOLS_HEX.lime;
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.moveTo(cue.x + RAIL, cue.y + RAIL);
    ctx.lineTo(cue.x + RAIL + Math.cos(rad) * 110, cue.y + RAIL + Math.sin(rad) * 110);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.globalAlpha = 1;
  }
  if (stick && stick.alpha > 0.02) drawStick(ctx, stick);

  const ids = rackIds();
  frame.forEach((b, i) => {
    if (b.p) return;
    const id = i === 0 ? 0 : ids[i - 1] ?? 1;
    const x = b.x + RAIL;
    const y = b.y + RAIL;
    ctx.beginPath();
    ctx.arc(x, y, BALL_R, 0, Math.PI * 2);
    ctx.fillStyle = BALL_FILL[id] ?? "#fff";
    ctx.fill();
    ctx.lineWidth = 0.7;
    ctx.strokeStyle = "#111";
    ctx.stroke();
    if (id >= 9) {
      ctx.fillStyle = "rgba(255,255,255,0.9)";
      ctx.fillRect(x - BALL_R + 1, y - 3, BALL_R * 2 - 2, 6);
    }
    if (id > 0) {
      ctx.fillStyle = id === 8 ? "#fff" : "#111";
      ctx.font = "700 8px sans-serif";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(String(id), x, y + 0.5);
    }
  });
}

type Stick = { x: number; y: number; aim: number; gap: number; alpha: number };

function drawStick(ctx: CanvasRenderingContext2D, stick: Stick) {
  const rad = (stick.aim * Math.PI) / 180;
  const tipX = stick.x - Math.cos(rad) * stick.gap;
  const tipY = stick.y - Math.sin(rad) * stick.gap;
  const len = 156;
  ctx.save();
  ctx.globalAlpha = Math.max(0, Math.min(1, stick.alpha));
  ctx.lineCap = "round";
  ctx.strokeStyle = "#c4a574";
  ctx.lineWidth = 5;
  ctx.beginPath();
  ctx.moveTo(tipX, tipY);
  ctx.lineTo(tipX - Math.cos(rad) * len, tipY - Math.sin(rad) * len);
  ctx.stroke();
  ctx.strokeStyle = "#f4f1ea";
  ctx.lineWidth = 5;
  ctx.beginPath();
  ctx.moveTo(tipX, tipY);
  ctx.lineTo(tipX - Math.cos(rad) * 12, tipY - Math.sin(rad) * 12);
  ctx.stroke();
  ctx.restore();
}

function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function diamond(ctx: CanvasRenderingContext2D, x: number, y: number) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(Math.PI / 4);
  ctx.fillRect(-3.5, -3.5, 7, 7);
  ctx.restore();
}
