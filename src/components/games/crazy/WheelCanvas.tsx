import { memo, useEffect, useRef } from "react";
import { SPOTS, WHEEL, type SpotId } from "@/lib/crazy/constants";
import { sfx } from "@/lib/crazy/audio";
import { TOLS_PATH } from "./Brand";

const SEGMENT = (Math.PI * 2) / WHEEL.length;
const SIZE = 1400;

// Rim-facing segment colors, tuned to the platform's mint / violet / gold palette.
export const WHEEL_COLORS: Record<SpotId, string> = {
  one: "#2f6ae0", two: "#e3b02a", five: "#17a35c", ten: "#7d3ff2",
  coinflip: "#25b0d8", pachinko: "#9b45d6", cashhunt: "#0ea27f", crazytime: "#e6274f",
};
// Hub-side shade for each segment gradient — adds depth instead of flat fills.
const WHEEL_SHADE: Record<SpotId, string> = {
  one: "#183f96", two: "#a97b0f", five: "#0b6a39", ten: "#4d1fb0",
  coinflip: "#106f92", pachinko: "#6a1fa8", cashhunt: "#066b53", crazytime: "#9c1236",
};
// Short, correctly-cased labels for the bonus rounds, drawn along the radius.
const BONUS_LABEL: Partial<Record<SpotId, string>> = {
  coinflip: "COIN FLIP", pachinko: "PACHINKO", cashhunt: "CASH HUNT", crazytime: "CRAZYTOLS",
};

function buildWheel() {
  const canvas = document.createElement("canvas");
  canvas.width = SIZE;
  canvas.height = SIZE;
  const ctx = canvas.getContext("2d")!;
  const center = SIZE / 2;
  const R = center - 4;
  const rInner = R * 0.3; // where segments meet the hub
  const rRim = R * 0.905; // outer edge of the colored segments

  // Outer bezel ring (dark, with a soft metallic sheen).
  const bezel = ctx.createRadialGradient(center, center, rRim, center, center, R);
  bezel.addColorStop(0, "#141821");
  bezel.addColorStop(0.55, "#0c0f16");
  bezel.addColorStop(1, "#05070b");
  ctx.beginPath();
  ctx.arc(center, center, R, 0, Math.PI * 2);
  ctx.fillStyle = bezel;
  ctx.fill();

  WHEEL.forEach((spot, index) => {
    const mid = -Math.PI / 2 + index * SEGMENT;
    const a0 = mid - SEGMENT / 2;
    const a1 = mid + SEGMENT / 2;
    // Segment body: radial gradient from a deep hub shade to the vivid rim color.
    const grad = ctx.createRadialGradient(center, center, rInner, center, center, rRim);
    grad.addColorStop(0, WHEEL_SHADE[spot]);
    grad.addColorStop(1, WHEEL_COLORS[spot]);
    ctx.beginPath();
    ctx.arc(center, center, rRim, a0 - 0.0015, a1 + 0.0015);
    ctx.arc(center, center, rInner, a1 + 0.0015, a0 - 0.0015, true);
    ctx.closePath();
    ctx.fillStyle = grad;
    ctx.fill();
    // Glossy highlight band near the rim.
    ctx.beginPath();
    ctx.arc(center, center, rRim, a0, a1);
    ctx.arc(center, center, rRim * 0.8, a1, a0, true);
    ctx.closePath();
    ctx.fillStyle = "rgba(255,255,255,0.08)";
    ctx.fill();
  });

  // Crisp dividers between every segment.
  ctx.strokeStyle = "rgba(4,6,11,0.55)";
  ctx.lineWidth = SIZE * 0.0022;
  WHEEL.forEach((_, index) => {
    const edge = -Math.PI / 2 + index * SEGMENT - SEGMENT / 2;
    ctx.beginPath();
    ctx.moveTo(center + Math.cos(edge) * rInner, center + Math.sin(edge) * rInner);
    ctx.lineTo(center + Math.cos(edge) * rRim, center + Math.sin(edge) * rRim);
    ctx.stroke();
  });

  // Labels — numbers upright at the top (money-wheel style), bonus names run along the radius.
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  const font = (size: number, weight = 800) => {
    ctx.font = `${weight} ${size}px Inter, "Segoe UI", Arial, sans-serif`;
  };
  WHEEL.forEach((spot, index) => {
    const def = SPOTS[spot];
    const bonus = def.pays === null;
    ctx.save();
    ctx.translate(center, center);
    ctx.rotate(index * SEGMENT);
    if (bonus) {
      // Radial label: length runs along the free radial span, so longer
      // names stay readable inside a 6.67-degree slice.
      const label = BONUS_LABEL[spot] ?? def.short;
      ctx.translate(0, -R * 0.615);
      ctx.rotate(-Math.PI / 2);
      font(label.length > 8 ? R * 0.046 : R * 0.052, 800);
      ctx.fillStyle = "rgba(0,0,0,0.38)";
      ctx.fillText(label, 1.4, 2);
      ctx.fillStyle = "#ffffff";
      ctx.fillText(label, 0, 0);
    } else {
      // Numbers are sized from the tangential arc width available at their
      // radius, so "10" never crowds its segment dividers.
      const radius = R * 0.735;
      const arc = radius * SEGMENT * 0.92;
      const advance = def.wheelText.length * 0.58;
      const size = Math.min(R * 0.118, arc / advance);
      ctx.translate(0, -radius);
      font(size, 800);
      ctx.fillStyle = "rgba(0,0,0,0.34)";
      ctx.fillText(def.wheelText, size * 0.05, size * 0.07);
      ctx.fillStyle = "#ffffff";
      ctx.fillText(def.wheelText, 0, 0);
    }
    ctx.restore();
  });

  // Inner ring where segments meet the hub.
  ctx.beginPath();
  ctx.arc(center, center, rInner, 0, Math.PI * 2);
  ctx.fillStyle = "#0b0e14";
  ctx.fill();
  ctx.lineWidth = SIZE * 0.006;
  ctx.strokeStyle = "rgba(220,185,80,0.5)";
  ctx.stroke();

  // Rim outline + evenly spaced pegs on every segment boundary.
  ctx.beginPath();
  ctx.arc(center, center, rRim, 0, Math.PI * 2);
  ctx.lineWidth = SIZE * 0.008;
  ctx.strokeStyle = "rgba(233,201,110,0.85)";
  ctx.stroke();
  const pegRadius = (rRim + R) / 2;
  for (let i = 0; i < WHEEL.length; i++) {
    const edge = -Math.PI / 2 + i * SEGMENT - SEGMENT / 2;
    const px = center + Math.cos(edge) * pegRadius;
    const py = center + Math.sin(edge) * pegRadius;
    const peg = ctx.createRadialGradient(px - 2, py - 2, 0, px, py, SIZE * 0.011);
    peg.addColorStop(0, "#fff6d8");
    peg.addColorStop(0.5, "#e8c264");
    peg.addColorStop(1, "#8a6414");
    ctx.beginPath();
    ctx.arc(px, py, SIZE * 0.0095, 0, Math.PI * 2);
    ctx.fillStyle = peg;
    ctx.fill();
  }
  return canvas;
}

type Props = { spinToken: number; targetIndex: number; duration: number; paused: boolean; winner: number | null; onLand: (index: number) => void };

export default memo(function WheelCanvas({ spinToken, targetIndex, duration, paused, winner, onLand }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const suspenseRef = useRef<HTMLDivElement>(null);
  const cache = useRef<HTMLCanvasElement | null>(null);
  const callback = useRef(onLand);
  callback.current = onLand;
  const state = useRef({ rotation: 0, previousRotation: 0, angularVelocity: 0, from: 0, to: 0, elapsed: 0, duration: 4300, spinning: false, paused, winner, target: 0, token: 0, lastSegment: 0, pointer: 0, pointerVelocity: 0, size: 480, dpr: 1, suspense: false, revealUntil: 0 });
  state.current.paused = paused;
  state.current.winner = winner;

  useEffect(() => {
    let alive = true;
    cache.current = buildWheel();
    void document.fonts.ready.then(() => { if (alive) cache.current = buildWheel(); });
    return () => { alive = false; };
  }, []);

  useEffect(() => {
    const current = state.current;
    if (spinToken === 0 || current.token === spinToken) return;
    current.token = spinToken;
    current.target = targetIndex;
    const desired = -targetIndex * SEGMENT + (Math.random() - 0.5) * SEGMENT * 0.48;
    const base = current.rotation + (duration < 600 ? 2 : 5) * Math.PI * 2;
    const difference = ((desired - base) % (Math.PI * 2) + Math.PI * 2) % (Math.PI * 2);
    current.from = current.rotation;
    current.to = base + difference;
    current.elapsed = 0;
    current.duration = duration;
    current.spinning = true;
    current.suspense = false;
    current.revealUntil = 0;
    current.previousRotation = current.rotation;
    canvasRef.current?.style.setProperty("--camera-zoom", "1");
    canvasRef.current?.style.setProperty("--camera-lift", "0px");
    suspenseRef.current?.classList.remove("active", "landed");
    if (suspenseRef.current) suspenseRef.current.querySelector("strong")!.textContent = "SLOW MOTION";
  }, [spinToken, targetIndex, duration]);

  useEffect(() => {
    const canvas = canvasRef.current!;
    const context = canvas.getContext("2d", { alpha: true });
    if (!context) return;
    const ctx = context;
    const mark = new Path2D(TOLS_PATH);
    let raf = 0;
    let last = performance.now();
    let dirty = true;
    let lastWinner: number | null = null;
    const resize = () => {
      const rect = containerRef.current!.getBoundingClientRect();
      const size = Math.max(1, Math.min(rect.width, rect.height));
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      state.current.size = size;
      state.current.dpr = dpr;
      canvas.width = Math.round(size * dpr);
      canvas.height = Math.round(size * dpr);
      canvas.style.width = `${size}px`;
      canvas.style.height = `${size}px`;
      dirty = true;
    };
    const observer = new ResizeObserver(resize);
    observer.observe(containerRef.current!);
    resize();
    const frame = (now: number) => {
      raf = requestAnimationFrame(frame);
      const dt = Math.min(50, now - last);
      last = now;
      const s = state.current;
      if (document.hidden) return;
      if (s.spinning && !s.paused) {
        s.elapsed += dt;
        const progress = Math.min(1, s.elapsed / s.duration);
        // Exponential angular drag: ω(t)=ω0·e^(-kt), normalized so the
        // server-selected target is reached exactly at t=1.
        const drag = 5.35;
        const motion = (1 - Math.exp(-drag * progress)) / (1 - Math.exp(-drag));
        s.previousRotation = s.rotation;
        s.rotation = s.from + (s.to - s.from) * motion;
        s.angularVelocity = (s.rotation - s.previousRotation) / Math.max(0.001, dt / 1000);
        const suspenseStart = s.duration < 700 ? 0.84 : 0.66;
        const suspenseProgress = Math.max(0, Math.min(1, (progress - suspenseStart) / (1 - suspenseStart)));
        // Camera closes in as the mechanical energy dissipates. Mobile uses a
        // stronger crop; desktop keeps the full wheel with a restrained push.
        const mobile = window.matchMedia("(max-width: 760px)").matches;
        const cameraEase = suspenseProgress * suspenseProgress * (3 - 2 * suspenseProgress);
        const zoom = 1 + cameraEase * (mobile ? 0.22 : 0.075);
        const lift = mobile ? -cameraEase * s.size * 0.025 : 0;
        canvas.style.setProperty("--camera-zoom", zoom.toFixed(4));
        canvas.style.setProperty("--camera-lift", `${lift.toFixed(2)}px`);
        if (suspenseProgress > 0.04 && !s.suspense) {
          s.suspense = true;
          suspenseRef.current?.classList.add("active");
        }
        const segment = Math.round(-s.rotation / SEGMENT);
        if (segment !== s.lastSegment) {
          sfx.tick(1 - progress);
          // Peg impact transfers a bounded fraction of angular momentum to
          // the flapper. Slow impacts produce small, visible final clicks.
          const impact = Math.min(7.5, 0.42 + Math.abs(s.angularVelocity) * 0.014);
          s.pointerVelocity -= impact;
          s.lastSegment = segment;
        }
        if (progress === 1) {
          s.spinning = false;
          s.rotation = s.to;
          s.angularVelocity = 0;
          s.revealUntil = now + 1050;
          suspenseRef.current?.classList.add("landed");
          if (suspenseRef.current) suspenseRef.current.querySelector("strong")!.textContent = SPOTS[WHEEL[s.target]].label;
          const landed = ((Math.round(-s.rotation / SEGMENT) % WHEEL.length) + WHEEL.length) % WHEEL.length;
          callback.current(landed);
        }
        dirty = true;
      }
      if (!s.paused) {
        const seconds = dt / 1000;
        // Damped pendulum. Gravity restores the pointer; aerodynamic damping
        // prevents energy gain and keeps identical behavior at 30/60/120fps.
        const gravity = 72;
        const damping = 10.5;
        s.pointerVelocity += -gravity * Math.sin(s.pointer) * seconds;
        s.pointerVelocity *= Math.exp(-damping * seconds);
        s.pointer += s.pointerVelocity * seconds;
        s.pointer = Math.max(-0.52, Math.min(0.52, s.pointer));
        if (!s.spinning && s.revealUntil && now > s.revealUntil) {
          s.revealUntil = 0;
          s.suspense = false;
          canvas.style.setProperty("--camera-zoom", "1");
          canvas.style.setProperty("--camera-lift", "0px");
          suspenseRef.current?.classList.remove("active", "landed");
        }
      }
      if (s.winner !== lastWinner || s.winner !== null || Math.abs(s.pointer) > 0.002) dirty = true;
      lastWinner = s.winner;
      // The idle table only repaints when resized or when a round changes.
      if (!dirty || !cache.current) return;
      dirty = false;
      const size = s.size;
      const center = size / 2;
      const radius = size * 0.474;
      const hubRadius = radius * 0.36;
      ctx.setTransform(s.dpr, 0, 0, s.dpr, 0, 0);
      ctx.clearRect(0, 0, size, size);
      ctx.save();
      ctx.translate(center, center);
      ctx.rotate(s.rotation);
      ctx.drawImage(cache.current, -radius, -radius, radius * 2, radius * 2);
      ctx.restore();
      if (s.winner !== null && !s.spinning) {
        const angle = -Math.PI / 2 + s.winner * SEGMENT + s.rotation;
        ctx.beginPath();
        ctx.moveTo(center, center);
        ctx.arc(center, center, radius, angle - SEGMENT / 2, angle + SEGMENT / 2);
        ctx.closePath();
        ctx.fillStyle = `rgba(255,255,255,${0.2 + Math.sin(now / 170) * 0.12})`;
        ctx.fill();
      }
      const hubFill = ctx.createRadialGradient(center, center - hubRadius * 0.4, hubRadius * 0.1, center, center, hubRadius);
      hubFill.addColorStop(0, "#1b2130");
      hubFill.addColorStop(0.7, "#0d1016");
      hubFill.addColorStop(1, "#06080c");
      ctx.beginPath();
      ctx.arc(center, center, hubRadius, 0, Math.PI * 2);
      ctx.fillStyle = hubFill;
      ctx.fill();
      ctx.strokeStyle = "rgba(233,201,110,0.9)";
      ctx.lineWidth = size * 0.012;
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(center, center, hubRadius * 0.9, 0, Math.PI * 2);
      ctx.strokeStyle = "rgba(0,237,181,0.35)";
      ctx.lineWidth = size * 0.004;
      ctx.stroke();
      ctx.save();
      const markSize = hubRadius * 0.52;
      ctx.translate(center - markSize / 2, center - markSize * 0.79);
      ctx.scale(markSize / 192, markSize / 192);
      ctx.fillStyle = "#00cfa4";
      ctx.fill(mark, "evenodd");
      ctx.restore();
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.font = `700 ${Math.max(8, hubRadius * 0.17)}px Inter, Arial, sans-serif`;
      ctx.fillStyle = "#e5e9e9";
      ctx.fillText("CRAZYTOLS", center, center + hubRadius * 0.3);
      ctx.font = `500 ${Math.max(6, hubRadius * 0.095)}px Inter, Arial, sans-serif`;
      ctx.fillStyle = "#72777a";
      ctx.fillText("TOLS.FUN", center, center + hubRadius * 0.52);
      ctx.save();
      ctx.translate(center, center - radius * 1.005);
      ctx.rotate(s.pointer * 0.3);
      ctx.beginPath();
      ctx.moveTo(-size * 0.026, -size * 0.02);
      ctx.lineTo(size * 0.026, -size * 0.02);
      ctx.lineTo(0, size * 0.05);
      ctx.closePath();
      const pointerFill = ctx.createLinearGradient(0, -size * 0.02, 0, size * 0.05);
      pointerFill.addColorStop(0, "#fff4d0");
      pointerFill.addColorStop(0.5, "#eac661");
      pointerFill.addColorStop(1, "#a97e1c");
      ctx.fillStyle = pointerFill;
      ctx.shadowColor = "rgba(0,0,0,0.5)";
      ctx.shadowBlur = size * 0.02;
      ctx.shadowOffsetY = size * 0.006;
      ctx.fill();
      ctx.shadowColor = "transparent";
      ctx.strokeStyle = "rgba(60,42,8,0.6)";
      ctx.lineWidth = size * 0.003;
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(0, -size * 0.024, size * 0.012, 0, Math.PI * 2);
      ctx.fillStyle = "#f4e3a8";
      ctx.fill();
      ctx.restore();
    };
    raf = requestAnimationFrame(frame);
    return () => { cancelAnimationFrame(raf); observer.disconnect(); };
  }, []);

  return <div ref={containerRef} className="wheel-canvas"><canvas ref={canvasRef} role="img" aria-label="CRAZYTOLS: 54-segment bonus wheel" /><div ref={suspenseRef} className="wheel-suspense" aria-live="polite"><span>FINAL TICKS</span><strong>SLOW MOTION</strong></div></div>;
});