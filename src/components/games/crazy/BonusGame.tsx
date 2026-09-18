import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { SPOTS, weightedMulti, type SpotId, fmt } from "@/lib/crazy/constants";
import type { CrazyBonusData } from "@/lib/crazy/server-round";
import { fx, elCenter } from "@/lib/crazy/juice";
import { sfx } from "@/lib/crazy/audio";
import { usePausableTimers } from "@/lib/crazy/usePausableTimers";
import Icon from "./Icon";

type Props = {
  kind: SpotId;
  stake: number;
  topMulti: number;
  paused: boolean;
  onDone: (multi: number, cell?: number) => void;
  onPause?: () => void;
  /** Server-generated round payload: the table animates, never invents. */
  server?: CrazyBonusData | null;
};

function Shell({
  kind,
  children,
  hint,
  stake,
  topMulti,
}: {
  kind: SpotId;
  children: React.ReactNode;
  hint: string;
  stake: number;
  topMulti: number;
}) {
  const def = SPOTS[kind];
  const dialogRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const originalFocus = document.activeElement as HTMLElement | null;
    dialogRef.current?.focus({ preventScroll: true });
    const trapFocus = (event: KeyboardEvent) => {
      if (event.key !== "Tab" || document.querySelector("dialog[open]")) return;
      const focusable = Array.from(dialogRef.current?.querySelectorAll<HTMLElement>("button:not([disabled]), [tabindex='0']") ?? []);
      const pauseButton = document.querySelector<HTMLElement>(".bonus-pause-button");
      if (pauseButton) focusable.push(pauseButton);
      if (!focusable.length) { event.preventDefault(); return; }
      const index = focusable.indexOf(document.activeElement as HTMLElement);
      if (index < 0 || (!event.shiftKey && index === focusable.length - 1) || (event.shiftKey && index === 0)) {
        event.preventDefault();
        focusable[event.shiftKey ? focusable.length - 1 : 0].focus();
      }
    };
    window.addEventListener("keydown", trapFocus);
    return () => { window.removeEventListener("keydown", trapFocus); if (originalFocus?.isConnected) originalFocus.focus({ preventScroll: true }); };
  }, []);
  return (
    <div ref={dialogRef} tabIndex={-1} className="bonus-backdrop" role="dialog" aria-modal="true" aria-label={`${def.label} bonus round`}>
      <div
        className="bonus-modal"
        style={{
          borderColor: def.color + "55",
        }}
      >
        <div className="text-center">
          <div className="text-[10px] font-bold uppercase tracking-[0.35em] text-white/45">
            bonus round unlocked
          </div>
          <h2
            className="font-display text-3xl font-black uppercase tracking-tight sm:text-4xl"
            style={{ color: def.color, textShadow: `0 0 26px ${def.color}bb` }}
          >
            {def.id === "crazytime" ? "CRAZYTOLS" : def.label}
          </h2>
          <div className="mt-1 font-mono text-[11px] text-white/60">
            stake {fmt(stake)} {topMulti > 1 && <span className="text-[#FFD84D]">· top slot ×{topMulti}</span>}
          </div>
        </div>
        {children}
        <div className="text-center font-mono text-[11px] text-white/45">{hint}</div>
      </div>
    </div>
  );
}

function Win({ multi, stake }: { multi: number; stake: number }) {
  return (
    <div className="animate-pop text-center">
      <div className="font-display text-5xl font-black text-[#14F195] drop-shadow-[0_0_24px_#14F19599] sm:text-6xl">
        ×{multi}
      </div>
      <div className="font-mono text-lg font-bold text-white">+{fmt(stake * multi)}</div>
    </div>
  );
}

/* ------------------------------------------------------------------ COIN FLIP */
function CoinFlip({ stake, topMulti, onDone, paused, server }: Omit<Props, "kind">) {
  const { schedule, cancel } = usePausableTimers(paused);
  const inputPaused = useRef(paused);
  inputPaused.current = paused;
  const launched = useRef(false);
  const [red] = useState(() => (server?.kind === "coinflip" ? server.red : weightedMulti(2, 40, 2.2)));
  const [blue] = useState(() => (server?.kind === "coinflip" ? server.blue : weightedMulti(2, 40, 2.2)));
  const [phase, setPhase] = useState<"ready" | "flip" | "done">("ready");
  const [side, setSide] = useState<"red" | "blue">("red");
  const ref = useRef<HTMLButtonElement>(null);

  const flip = useCallback(() => {
    if (phase !== "ready" || inputPaused.current || launched.current) return;
    launched.current = true;
    setPhase("flip");
    sfx.whoosh();
    const s = server?.kind === "coinflip" ? server.side : Math.random() < 0.5 ? "red" : "blue";
    setSide(s);
    const c = elCenter(ref.current);
    fx.burst(c.x, c.y, 26, ["#19E8FF", "#ffffff", "#FF3D6E"], { speed: 340, size: 4, life: 0.7 });
    fx.shake(10);
    schedule(() => {
      const m = (s === "red" ? red : blue) * topMulti;
      setPhase("done");
      sfx.jackpot();
      fx.shake(22);
      const cc = elCenter(ref.current);
      fx.burst(cc.x, cc.y, 70, ["#14F195", "#FFD84D", "#19E8FF", "#ffffff"], {
        speed: 520,
        size: 5,
        life: 1.1,
      });
      fx.float(cc.x, cc.y - 60, `×${m}`, "#14F195", 46);
      schedule(() => onDone(m), 1500);
    }, 2300);
  }, [phase, red, blue, topMulti, onDone, schedule]);

  useEffect(() => {
    if (phase !== "ready") return;
    const t = schedule(flip, 2400);
    const k = (e: KeyboardEvent) => {
      if (inputPaused.current) return;
      if (e.code === "Space" || e.code === "Enter") {
        e.preventDefault();
        flip();
      }
    };
    window.addEventListener("keydown", k);
    return () => {
      cancel(t);
      window.removeEventListener("keydown", k);
    };
  }, [flip, phase, schedule, cancel]);

  const result = side === "red" ? red : blue;

  return (
    <Shell kind="coinflip" stake={stake} topMulti={topMulti} hint="SPACE / TAP — flip the coin now">
      <div className="flex w-full items-center justify-center gap-5 sm:gap-8">
        <div className="text-center">
          <div className="font-display text-2xl font-black text-[#FF3D6E] sm:text-3xl">×{red}</div>
          <div className="font-mono text-[10px] uppercase tracking-widest text-white/40">red</div>
        </div>
        <button
          type="button"
          aria-label="Flip the bonus coin"
          ref={ref}
          onClick={flip}
          disabled={paused || phase !== "ready"}
          className="relative h-28 w-28 cursor-pointer select-none sm:h-36 sm:w-36"
          style={{ perspective: "700px" }}
        >
          <div
            className="relative h-full w-full rounded-full"
            style={{
              transformStyle: "preserve-3d",
              transition: phase === "flip" ? "transform 2.3s cubic-bezier(.2,.7,.3,1)" : "none",
              transform:
                phase === "ready"
                  ? "rotateY(0deg)"
                  : `rotateY(${1800 + (side === "blue" ? 180 : 0)}deg)`,
            }}
          >
            <div
              className="absolute inset-0 grid place-items-center rounded-full border-4 border-white/30 font-display text-2xl font-black text-white"
              style={{
                backfaceVisibility: "hidden",
                background: "radial-gradient(circle at 35% 30%, #ff89a8, #FF3D6E 45%, #7d0026)",
                boxShadow: "0 0 40px #FF3D6E88",
              }}
            >
              RED
            </div>
            <div
              className="absolute inset-0 grid place-items-center rounded-full border-4 border-white/30 font-display text-2xl font-black text-white"
              style={{
                backfaceVisibility: "hidden",
                transform: "rotateY(180deg)",
                background: "radial-gradient(circle at 35% 30%, #9ef4ff, #19E8FF 45%, #004a66)",
                boxShadow: "0 0 40px #19E8FF88",
              }}
            >
              BLUE
            </div>
          </div>
        </button>
        <div className="text-center">
          <div className="font-display text-2xl font-black text-[#19E8FF] sm:text-3xl">×{blue}</div>
          <div className="font-mono text-[10px] uppercase tracking-widest text-white/40">blue</div>
        </div>
      </div>
      <div className="h-20">
        {phase === "done" ? (
          <Win multi={result * topMulti} stake={stake} />
        ) : (
          <div className="pt-6 font-mono text-sm text-white/50">
            {phase === "flip" ? "flipping…" : "get ready…"}
          </div>
        )}
      </div>
    </Shell>
  );
}

/* ------------------------------------------------------------------ PACHINKO */
const PACH_W = 360;
const PACH_H = 430;

function Pachinko({ stake, topMulti, onDone, paused, server }: Omit<Props, "kind">) {
  const { schedule, cancel } = usePausableTimers(paused);
  const dropping = useRef(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [slots, setSlots] = useState<(number | "x2")[]>(() => (server?.kind === "pachinko" ? [...server.slots] : [
    weightedMulti(2, 6, 1),
    weightedMulti(6, 14, 1),
    weightedMulti(14, 30, 1),
    weightedMulti(30, 70, 1.4),
    "x2",
    weightedMulti(30, 70, 1.4),
    weightedMulti(14, 30, 1),
    weightedMulti(6, 14, 1),
    weightedMulti(2, 6, 1),
  ]));
  const dropCount = useRef(0);
  const serverSlot = useCallback(() => {
    if (server?.kind !== "pachinko") return null;
    const idx = server.drops[Math.min(dropCount.current, server.drops.length - 1)];
    return typeof idx === "number" ? idx : null;
  }, [server]);
  const [aim, setAim] = useState(4);
  const [phase, setPhase] = useState<"aim" | "drop" | "done">("aim");
  const [result, setResult] = useState(0);
  const [mult, setMult] = useState(1);
  const ball = useRef<{ x: number; y: number; vx: number; vy: number } | null>(null);
  const guidedRef = useRef<number | null>(null);
  const pausedRef = useRef(paused);
  pausedRef.current = paused;
  const slotsRef = useRef(slots);
  slotsRef.current = slots;
  const multRef = useRef(mult);
  multRef.current = mult;

  const pegs = useMemo(() => {
    const out: { x: number; y: number }[] = [];
    const rows = 8;
    for (let r = 0; r < rows; r++) {
      const count = r % 2 === 0 ? 9 : 8;
      const off = r % 2 === 0 ? 0 : 20;
      for (let c = 0; c < count; c++) out.push({ x: 20 + off + c * 40, y: 70 + r * 36 });
    }
    return out;
  }, []);

  const drop = useCallback((tapAim?: number) => {
    if (phase !== "aim" || pausedRef.current || dropping.current) return;
    dropping.current = true;
    const guided = serverSlot();
    guidedRef.current = guided;
    const position = guided ?? tapAim ?? aim;
    if (tapAim !== undefined) setAim(tapAim);
    setPhase("drop");
    sfx.whoosh();
    ball.current = { x: 20 + position * 40 + (Math.random() - 0.5) * 7, y: 24, vx: (Math.random() - 0.5) * 30, vy: 0 };
  }, [phase, aim, serverSlot]);

  const finish = useCallback(
    (slotIdx: number) => {
      const v = slotsRef.current[slotIdx];
      const canvas = canvasRef.current;
      const rect = canvas?.getBoundingClientRect();
      const px = rect ? rect.left + ((20 + slotIdx * 40) / PACH_W) * rect.width : window.innerWidth / 2;
      const py = rect ? rect.top + rect.height * 0.94 : window.innerHeight / 2;
      if (v === "x2") {
        sfx.bonusHit();
        fx.shake(18);
        fx.burst(px, py, 40, ["#9945FF", "#ffffff"], { speed: 380, size: 4 });
        fx.float(px, py - 40, "DOUBLE!", "#9945FF", 34);
        setMult((m) => m * 2);
        setSlots((s) => s.map((x) => (x === "x2" ? x : (x as number) * 2)));
        dropCount.current += 1;
        const nextGuided = serverSlot();
        guidedRef.current = nextGuided;
        schedule(() => {
          const from = nextGuided ?? aim;
          ball.current = { x: 20 + from * 40 + (Math.random() - 0.5) * 7, y: 24, vx: (Math.random() - 0.5) * 40, vy: 0 };
        }, 700);
        return;
      }
      const total = (v as number) * topMulti;
      setResult(total);
      setPhase("done");
      sfx.jackpot();
      fx.shake(22);
      fx.burst(px, py, 60, ["#14F195", "#FFD84D", "#ffffff"], { speed: 460, size: 5, life: 1 });
      fx.float(px, py - 60, `×${total}`, "#14F195", 44);
      schedule(() => onDone(total), 1500);
    },
    [aim, topMulti, onDone, schedule, serverSlot],
  );

  useEffect(() => {
    const k = (e: KeyboardEvent) => {
      if (pausedRef.current || phase !== "aim") return;
      if (["ArrowLeft", "ArrowRight", "Space", "Enter"].includes(e.code)) e.preventDefault();
      if (e.code === "ArrowLeft") setAim((a) => Math.max(0, a - 1)), sfx.click();
      else if (e.code === "ArrowRight") setAim((a) => Math.min(8, a + 1)), sfx.click();
      else if (e.code === "Space" || e.code === "Enter") {
        e.preventDefault();
        drop();
      }
    };
    window.addEventListener("keydown", k);
    return () => window.removeEventListener("keydown", k);
  }, [drop, phase]);

  useEffect(() => {
    if (phase !== "aim") return;
    const t = schedule(drop, 5000);
    return () => cancel(t);
  }, [phase, drop, schedule, cancel]);

  useEffect(() => {
    const canvas = canvasRef.current!;
    const ctx = canvas.getContext("2d")!;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = PACH_W * dpr;
    canvas.height = PACH_H * dpr;
    let raf = 0;
    let last = performance.now();
    let acc = 0;

    const step = () => {
      const b = ball.current;
      if (!b) return;
      b.vy += 1500 * (1 / 120);
      b.x += b.vx * (1 / 120);
      b.y += b.vy * (1 / 120);
      if (b.x < 12) (b.x = 12), (b.vx = Math.abs(b.vx) * 0.6);
      if (b.x > PACH_W - 12) (b.x = PACH_W - 12), (b.vx = -Math.abs(b.vx) * 0.6);
      for (const p of pegs) {
        const dx = b.x - p.x;
        const dy = b.y - p.y;
        const d2 = dx * dx + dy * dy;
        const rr = 15;
        if (d2 < rr * rr && d2 > 0.001) {
          const d = Math.sqrt(d2);
          const nx = dx / d;
          const ny = dy / d;
          b.x = p.x + nx * rr;
          b.y = p.y + ny * rr;
          const dot = b.vx * nx + b.vy * ny;
          b.vx = (b.vx - 2 * dot * nx) * 0.52 + (Math.random() - 0.5) * 60;
          b.vy = (b.vy - 2 * dot * ny) * 0.52;
          sfx.tick(0.4);
          const rect = canvas.getBoundingClientRect();
          fx.burst(
            rect.left + (p.x / PACH_W) * rect.width,
            rect.top + (p.y / PACH_H) * rect.height,
            2,
            ["#19E8FF", "#ffffff"],
            { speed: 90, size: 2, grav: 300, life: 0.35 },
          );
        }
      }
      const guided = guidedRef.current;
      if (guided !== null && b.y > 240) {
        const gx = 20 + guided * 40;
        b.vx += (gx - b.x) * 10 * (1 / 120);
        b.vx *= 0.965;
      }
      if (b.y > 372) {
        const idx = guided !== null ? guided : Math.max(0, Math.min(8, Math.round((b.x - 20) / 40)));
        b.x += (20 + idx * 40 - b.x) * 0.25;
        if (b.y > 404) {
          ball.current = null;
          finish(idx);
        }
      }
    };

    const frame = (now: number) => {
      raf = requestAnimationFrame(frame);
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      if (!pausedRef.current) {
        acc += dt;
        while (acc > 1 / 120) {
          step();
          acc -= 1 / 120;
        }
      }
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, PACH_W, PACH_H);
      // board
      ctx.fillStyle = "rgba(153,69,255,0.07)";
      ctx.fillRect(0, 0, PACH_W, PACH_H);
      for (const p of pegs) {
        const g = ctx.createRadialGradient(p.x - 1, p.y - 1, 0, p.x, p.y, 6);
        g.addColorStop(0, "#ffffff");
        g.addColorStop(1, "#7a53c4");
        ctx.beginPath();
        ctx.arc(p.x, p.y, 5, 0, Math.PI * 2);
        ctx.fillStyle = g;
        ctx.fill();
      }
      // slots
      const sl = slotsRef.current;
      for (let i = 0; i < 9; i++) {
        const x = i * 40;
        const isX2 = sl[i] === "x2";
        ctx.fillStyle = isX2 ? "rgba(153,69,255,0.38)" : "rgba(20,241,149,0.15)";
        ctx.fillRect(x + 1, 376, 38, 50);
        ctx.strokeStyle = "rgba(255,255,255,0.18)";
        ctx.strokeRect(x + 1, 376, 38, 50);
        ctx.fillStyle = isX2 ? "#d8b6ff" : "#c9ffe9";
        ctx.font = `900 ${isX2 ? 13 : 15}px "Space Grotesk", system-ui, sans-serif`;
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(isX2 ? "×2" : String(sl[i]), x + 20, 401);
      }
      // aim marker
      if (!ball.current && phase === "aim") {
        const ax = 20 + aim * 40;
        ctx.save();
        ctx.globalAlpha = 0.6 + 0.4 * Math.sin(now / 120);
        ctx.fillStyle = "#14F195";
        ctx.beginPath();
        ctx.moveTo(ax, 30);
        ctx.lineTo(ax - 9, 12);
        ctx.lineTo(ax + 9, 12);
        ctx.closePath();
        ctx.fill();
        ctx.setLineDash([4, 6]);
        ctx.strokeStyle = "rgba(20,241,149,0.4)";
        ctx.beginPath();
        ctx.moveTo(ax, 32);
        ctx.lineTo(ax, 370);
        ctx.stroke();
        ctx.restore();
      }
      const b = ball.current;
      if (b) {
        const g = ctx.createRadialGradient(b.x - 3, b.y - 3, 1, b.x, b.y, 10);
        g.addColorStop(0, "#ffffff");
        g.addColorStop(0.5, "#14F195");
        g.addColorStop(1, "#067a4e");
        ctx.beginPath();
        ctx.arc(b.x, b.y, 9, 0, Math.PI * 2);
        ctx.fillStyle = g;
        ctx.fill();
      }
    };
    raf = requestAnimationFrame(frame);
    return () => cancelAnimationFrame(raf);
  }, [pegs, aim, phase, finish]);

  return (
    <Shell
      kind="pachinko"
      stake={stake}
      topMulti={topMulti}
      hint="← → aim · SPACE drop · or tap the board"
    >
      <canvas
        ref={canvasRef}
        onPointerDown={(e) => {
          const r = e.currentTarget.getBoundingClientRect();
          const x = ((e.clientX - r.left) / r.width) * PACH_W;
          drop(Math.max(0, Math.min(8, Math.round((x - 20) / 40))));
        }}
        className="w-full max-w-[360px] touch-none rounded-2xl border border-white/10 bg-black/40"
        style={{ aspectRatio: `${PACH_W}/${PACH_H}`, maxWidth: "min(360px, 42svh)" }}
        aria-label="Pachinko board. Tap to choose a drop position."
        tabIndex={0}
      />
      <div className="h-10">
        {phase === "done" ? (
          <div className="font-display text-2xl font-black text-[#14F195]">
            ×{result} → +{fmt(stake * result)}
          </div>
        ) : mult > 1 ? (
          <div className="font-display text-lg font-black text-[#9945FF]">DOUBLED ×{mult}</div>
        ) : null}
      </div>
    </Shell>
  );
}

/* ------------------------------------------------------------------ CASH HUNT */
function CashHunt({ stake, topMulti, onDone, paused, server }: Omit<Props, "kind">) {
  const { schedule, cancel } = usePausableTimers(paused);
  const inputPaused = useRef(paused);
  inputPaused.current = paused;
  const chosen = useRef(false);
  const [tiles] = useState(() => {
    if (server?.kind === "cashhunt") return [...server.tiles];
    const arr: number[] = [];
    for (let i = 0; i < 18; i++) arr.push(weightedMulti(3, 30, 1.6));
    arr.push(weightedMulti(40, 90, 1.2));
    arr.push(weightedMulti(40, 90, 1.2));
    arr.push(weightedMulti(90, 200, 1.6));
    arr.push(weightedMulti(20, 60, 1.2));
    return arr.sort(() => Math.random() - 0.5);
  });
  const icons = ["◆", "▲", "●", "★", "✦", "■"];
  const [shuffling, setShuffling] = useState(true);
  const [picked, setPicked] = useState<number | null>(null);
  const [cursor, setCursor] = useState(10);
  const [time, setTime] = useState(5);

  const choose = useCallback(
    (i: number) => {
      if (picked !== null || shuffling || inputPaused.current || chosen.current) return;
      chosen.current = true;
      setPicked(i);
      const m = tiles[i] * topMulti;
      sfx.jackpot();
      fx.shake(20);
      const el = document.getElementById("hunt-" + i);
      const c = elCenter(el);
      fx.burst(c.x, c.y, 60, ["#14F195", "#FFD84D", "#ffffff"], { speed: 460, size: 5, life: 1 });
      fx.float(c.x, c.y - 50, `×${m}`, "#14F195", 42);
      schedule(() => onDone(m, i), 1800);
    },
    [picked, shuffling, tiles, topMulti, onDone, schedule],
  );

  useEffect(() => {
    const t = schedule(() => {
      setShuffling(false);
      sfx.beep(true);
    }, 1300);
    return () => cancel(t);
  }, [schedule, cancel]);

  useEffect(() => {
    if (shuffling || picked !== null) return;
    if (time <= 0) {
      const choice = schedule(() => choose((Math.random() * tiles.length) | 0), 0);
      return () => cancel(choice);
    }
    const t = schedule(() => {
      setTime((v) => v - 1);
      sfx.beep(time <= 2);
    }, 1000);
    return () => cancel(t);
  }, [time, shuffling, picked, choose, tiles.length, schedule, cancel]);

  useEffect(() => {
    const k = (e: KeyboardEvent) => {
      if (picked !== null || inputPaused.current) return;
      if (["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown", "Space", "Enter"].includes(e.code)) e.preventDefault();
      if (e.code === "ArrowLeft") setCursor((c) => (c + 21) % 22), sfx.click();
      else if (e.code === "ArrowRight") setCursor((c) => (c + 1) % 22), sfx.click();
      else if (e.code === "ArrowUp") setCursor((c) => (c + 22 - 6) % 22), sfx.click();
      else if (e.code === "ArrowDown") setCursor((c) => (c + 6) % 22), sfx.click();
      else if (e.code === "Space" || e.code === "Enter") {
        e.preventDefault();
        choose(cursor);
      }
    };
    window.addEventListener("keydown", k);
    return () => window.removeEventListener("keydown", k);
  }, [cursor, choose, picked]);

  return (
    <Shell
      kind="cashhunt"
      stake={stake}
      topMulti={topMulti}
      hint="arrows + SPACE · or tap a target before the timer runs out"
    >
      <div className="grid w-full grid-cols-6 gap-1.5 sm:gap-2">
        {tiles.map((v, i) => {
          const revealed = picked !== null;
          const isPick = picked === i;
          return (
            <button
              key={i}
              id={"hunt-" + i}
              onClick={() => choose(i)}
              disabled={paused || shuffling || picked !== null}
              aria-label={revealed ? `Target ${i + 1}, ${v} times multiplier` : `Choose target ${i + 1}`}
              onPointerEnter={() => setCursor(i)}
              className={
                "relative grid aspect-square place-items-center rounded-lg border text-center font-display font-black transition-transform duration-150 " +
                (isPick
                  ? "scale-110 border-[#14F195] bg-[#14F195]/30 text-white shadow-[0_0_24px_#14F19588]"
                  : revealed
                    ? "border-white/10 bg-white/5 text-white/40"
                    : cursor === i
                      ? "scale-105 border-[#14F195] bg-[#14F195]/20 text-[#14F195]"
                      : "border-white/15 bg-white/5 text-white/70 hover:border-[#14F195]/60")
              }
              style={{
                transform: shuffling
                  ? `translate(${(Math.random() - 0.5) * 16}px, ${(Math.random() - 0.5) * 16}px) rotate(${(Math.random() - 0.5) * 24}deg)`
                  : undefined,
                transition: shuffling ? "transform 120ms linear" : undefined,
              }}
            >
              <span className={revealed ? "text-xs sm:text-sm" : "text-base sm:text-lg"}>
                {revealed ? "×" + v : icons[i % icons.length]}
              </span>
            </button>
          );
        })}
      </div>
      <div className="flex min-h-[96px] items-center gap-3">
        {picked !== null ? (
          <Win multi={tiles[picked] * topMulti} stake={stake} />
        ) : shuffling ? (
          <div className="font-mono text-sm text-white/60">shuffling targets…</div>
        ) : (
          <div className="font-display text-2xl font-black text-[#FFD84D]">{time}s — PICK ONE!</div>
        )}
      </div>
    </Shell>
  );
}

/* ------------------------------------------------------------------ CRAZY TIME */
const CT_N = 24;
function CrazyTimeBonus({ stake, topMulti, onDone, paused, server }: Omit<Props, "kind">) {
  const { schedule, cancel } = usePausableTimers(paused);
  const launched = useRef(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [values, setValues] = useState<(number | "x2")[]>(() => {
    if (server?.kind === "crazytime") return [...server.values];
    const v: (number | "x2")[] = [];
    for (let i = 0; i < CT_N; i++) {
      if (i % 8 === 3) v.push("x2");
      else v.push(weightedMulti(15, i % 6 === 0 ? 500 : 150, 2.2));
    }
    return v;
  });
  const [colorPick, setColorPick] = useState<0 | 1 | 2 | null>(null);
  const [phase, setPhase] = useState<"pick" | "spin" | "done">("pick");
  const [result, setResult] = useState(0);
  const [boost, setBoost] = useState(1);
  const rot = useRef(0);
  const spin = useRef<{ from: number; to: number; t: number; dur: number } | null>(null);
  const pausedRef = useRef(paused);
  pausedRef.current = paused;
  const valuesRef = useRef(values);
  valuesRef.current = values;
  const colors = ["#14F195", "#19E8FF", "#FFD84D"];
  const names = ["GREEN", "BLUE", "YELLOW"];
  const offsets = [-0.55, 0, 0.55];

  const settle = useRef<(() => void) | null>(null);
  const spinCount = useRef(0);
  const serverTarget = () => {
    if (server?.kind !== "crazytime") return null;
    const idx = server.spins[Math.min(spinCount.current, server.spins.length - 1)];
    return typeof idx === "number" ? idx : null;
  };

  const startSpin = useCallback(
    (pick: 0 | 1 | 2) => {
      if (phase !== "pick" || pausedRef.current || launched.current) return;
      launched.current = true;
      setColorPick(pick);
      setPhase("spin");
      sfx.whoosh();
      const target = serverTarget() ?? ((Math.random() * CT_N) | 0);
      const seg = (Math.PI * 2) / CT_N;
      const desired = -target * seg + (Math.random() - 0.5) * seg * 0.5 + offsets[pick];
      const base = rot.current + 6 * Math.PI * 2;
      const mod = (((desired - base) % (Math.PI * 2)) + Math.PI * 2) % (Math.PI * 2);
      spin.current = { from: rot.current, to: base + mod, t: 0, dur: 4200 };
      settle.current = () => {
        const seg2 = (Math.PI * 2) / CT_N;
        const idx =
          ((Math.round((offsets[pick] - rot.current) / seg2) % CT_N) + CT_N) % CT_N;
        const v = valuesRef.current[idx];
        if (v === "x2") {
          sfx.bonusHit();
          fx.shake(20);
          setBoost((b) => b * 2);
          setValues((vs) => vs.map((x) => (x === "x2" ? x : (x as number) * 2)));
          const c = elCenter(canvasRef.current);
          fx.float(c.x, c.y - 100, "DOUBLE + RESPIN!", "#9945FF", 30);
          schedule(() => {
            spinCount.current += 1;
            const t2 = serverTarget() ?? ((Math.random() * CT_N) | 0);
            const d2 = -t2 * seg2 + (Math.random() - 0.5) * seg2 * 0.5 + offsets[pick];
            const b2 = rot.current + 4 * Math.PI * 2;
            const m2 = (((d2 - b2) % (Math.PI * 2)) + Math.PI * 2) % (Math.PI * 2);
            spin.current = { from: rot.current, to: b2 + m2, t: 0, dur: 3200 };
          }, 900);
          return;
        }
        const total = (v as number) * topMulti;
        setResult(total);
        setPhase("done");
        sfx.jackpot();
        fx.shake(28);
        const c = elCenter(canvasRef.current);
        fx.burst(c.x, c.y, 90, ["#14F195", "#FFD84D", "#9945FF", "#ffffff"], {
          speed: 620,
          size: 6,
          life: 1.3,
        });
        fx.confettiRain(window.innerWidth, 70, ["#14F195", "#9945FF", "#19E8FF", "#FFD84D"]);
        fx.float(c.x, c.y - 90, `×${total}`, "#14F195", 54);
        schedule(() => onDone(total), 2000);
      };
    },
    [phase, topMulti, onDone, schedule],
  );

  useEffect(() => {
    const k = (e: KeyboardEvent) => {
      if (phase !== "pick" || pausedRef.current) return;
      if (e.code === "Digit1") startSpin(0);
      if (e.code === "Digit2") startSpin(1);
      if (e.code === "Digit3") startSpin(2);
      if (e.code === "Space") {
        e.preventDefault();
        startSpin(((Math.random() * 3) | 0) as 0 | 1 | 2);
      }
    };
    window.addEventListener("keydown", k);
    return () => window.removeEventListener("keydown", k);
  }, [phase, startSpin]);

  useEffect(() => {
    if (phase !== "pick") return;
    const t = schedule(() => startSpin(((Math.random() * 3) | 0) as 0 | 1 | 2), 6000);
    return () => cancel(t);
  }, [phase, startSpin, schedule, cancel]);

  useEffect(() => {
    const canvas = canvasRef.current!;
    const ctx = canvas.getContext("2d")!;
    const S = 300;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = S * dpr;
    canvas.height = S * dpr;
    let raf = 0;
    let last = performance.now();
    let lastSeg = -1;

    const frame = (now: number) => {
      raf = requestAnimationFrame(frame);
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      if (!pausedRef.current) {
        const sp = spin.current;
        if (sp) {
          sp.t += dt * 1000;
          const k = Math.min(1, sp.t / sp.dur);
          rot.current = sp.from + (sp.to - sp.from) * (1 - Math.pow(1 - k, 4));
          if (k >= 1) {
            spin.current = null;
            settle.current?.();
          }
        } else if (phase === "pick") {
          rot.current += dt * 0.25;
        }
      }
      const seg = (Math.PI * 2) / CT_N;
      const cur = Math.round(-rot.current / seg);
      if (cur !== lastSeg) {
        if (lastSeg !== -1 && spin.current) sfx.tick(0.5);
        lastSeg = cur;
      }

      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, S, S);
      const cx = S / 2;
      const cy = S / 2;
      const R = S / 2 - 16;
      ctx.save();
      ctx.translate(cx, cy);
      ctx.rotate(rot.current);
      const vs = valuesRef.current;
      for (let i = 0; i < CT_N; i++) {
        const mid = -Math.PI / 2 + i * seg;
        const isX2 = vs[i] === "x2";
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.arc(0, 0, R, mid - seg / 2, mid + seg / 2);
        ctx.closePath();
        ctx.fillStyle = isX2
          ? "#9945FF"
          : i % 3 === 0
            ? "#1b1240"
            : i % 3 === 1
              ? "#2a1758"
              : "#141033";
        ctx.fill();
        ctx.strokeStyle = "rgba(255,255,255,0.12)";
        ctx.stroke();
        ctx.save();
        ctx.rotate(mid);
        ctx.fillStyle = isX2 ? "#ffffff" : "#e9dcff";
        ctx.font = `900 13px "Space Grotesk", system-ui, sans-serif`;
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(isX2 ? "×2" : String(vs[i]), R * 0.72, 0);
        ctx.restore();
      }
      ctx.restore();
      // hub
      ctx.beginPath();
      ctx.arc(cx, cy, R * 0.22, 0, Math.PI * 2);
      ctx.fillStyle = "#0a0718";
      ctx.fill();
      ctx.strokeStyle = "#9945FF";
      ctx.lineWidth = 2;
      ctx.stroke();
      // flappers
      for (let f = 0; f < 3; f++) {
        if (colorPick !== null && colorPick !== f) continue;
        const a = -Math.PI / 2 + offsets[f];
        ctx.save();
        ctx.translate(cx + Math.cos(a) * (R + 6), cy + Math.sin(a) * (R + 6));
        ctx.rotate(a + Math.PI / 2);
        ctx.beginPath();
        ctx.moveTo(0, 18);
        ctx.lineTo(-8, -8);
        ctx.lineTo(8, -8);
        ctx.closePath();
        ctx.fillStyle = colors[f];
        ctx.shadowColor = colors[f];
        ctx.shadowBlur = 14;
        ctx.fill();
        ctx.restore();
      }
    };
    raf = requestAnimationFrame(frame);
    return () => cancelAnimationFrame(raf);
  }, [phase, colorPick]);

  return (
    <Shell
      kind="crazytime"
      stake={stake}
      topMulti={topMulti}
      hint="1 / 2 / 3 or tap — choose your flapper"
    >
      <canvas ref={canvasRef} className="h-[240px] w-[240px] touch-none sm:h-[300px] sm:w-[300px]" />
      {phase === "pick" ? (
        <div className="flex gap-2">
          {names.map((n, i) => (
            <button
              key={n}
              onClick={() => startSpin(i as 0 | 1 | 2)}
              disabled={paused}
              className="min-h-11 rounded-xl border-2 px-3 py-2 font-display text-xs font-black uppercase tracking-wide transition-transform active:scale-95"
              style={{
                borderColor: colors[i],
                color: colors[i],
                background: colors[i] + "1f",
                boxShadow: `0 0 20px ${colors[i]}55`,
              }}
            >
              {i + 1} · {n}
            </button>
          ))}
        </div>
      ) : (
        <div className="flex min-h-[96px] items-center">
          {phase === "done" ? (
            <Win multi={result} stake={stake} />
          ) : (
            <div className="font-mono text-sm text-white/60">
              {boost > 1 ? `boosted ×${boost} — respinning…` : "spinning the crazy wheel…"}
            </div>
          )}
        </div>
      )}
    </Shell>
  );
}

export default function BonusGame(props: Props) {
  const { kind, onPause, ...rest } = props;
  return <>
    {kind === "coinflip" ? <CoinFlip {...rest} /> : kind === "pachinko" ? <Pachinko {...rest} /> : kind === "cashhunt" ? <CashHunt {...rest} /> : <CrazyTimeBonus {...rest} />}
    {onPause && <button className="bonus-pause-button" onClick={onPause} aria-label="Pause bonus round" title="Pause bonus"><Icon name="pause" size={19} /></button>}
  </>;
}
