import { useEffect, useRef } from "react";
import { drawHorse } from "./horseArt";
import { artOf } from "./types";
import type { Runner } from "./types";

interface Particle {
  alive: boolean;
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  max: number;
  size: number;
  color: string;
  kind: 0 | 1 | 2; // 0 dust, 1 confetti, 2 spark
  rot: number;
  vrot: number;
  grav: number;
}

interface Crowd {
  x: number;
  y: number;
  r: number;
  hue: number;
  ph: number;
}

interface TrackProps {
  runners: Runner[];
  running: boolean;
  paused: boolean;
  parade: boolean; // pre-race jiggle
  fx: { shake: number }; // mutable, decayed inside the loop (no re-renders)
  burstToken: number;
  burstColors: string[];
  yourHorseId: number | null;
  onPhotoFinish: () => void;
}

const MAX_P = 460;

export default function Track(props: TrackProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // ---- refs so the RAF loop is mounted exactly once ----
  const R = useRef(props);
  R.current = props;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d", { alpha: false });
    if (!ctx) return;

    let W = 0;
    let H = 0;
    let dpr = 1;
    let dirt: CanvasPattern | null = null;
    let crowd: Crowd[] = [];
    const pool: Particle[] = Array.from({ length: MAX_P }, () => ({
      alive: false, x: 0, y: 0, vx: 0, vy: 0, life: 0, max: 1, size: 3,
      color: "#fff", kind: 0 as 0, rot: 0, vrot: 0, grav: 0,
    }));
    let cursor = 0;
    let lastTs = 0;
    let t = 0;
    let photoDone = false;
    let lastBurst = 0;
    let flashUntil = 0;

    const spawn = (p: Partial<Particle>) => {
      const q = pool[cursor];
      cursor = (cursor + 1) % MAX_P;
      q.alive = true;
      q.life = 0;
      q.rot = 0;
      q.vrot = 0;
      q.grav = 0;
      q.vx = 0;
      q.vy = 0;
      Object.assign(q, p);
    };

    const makeDirt = () => {
      const c = document.createElement("canvas");
      c.width = c.height = 96;
      const g = c.getContext("2d");
      if (!g) return;
      g.fillStyle = "rgba(144,75,249,0.06)";
      for (let i = 0; i < 260; i++) {
        g.fillRect(Math.random() * 96, Math.random() * 96, 1 + Math.random() * 2, 1);
      }
      g.fillStyle = "rgba(0,255,189,0.04)";
      for (let i = 0; i < 160; i++) {
        g.fillRect(Math.random() * 96, Math.random() * 96, 2, 1);
      }
      dirt = ctx.createPattern(c, "repeat");
    };

    const makeCrowd = () => {
      crowd = [];
      const count = Math.min(190, Math.floor(W / 6));
      for (let i = 0; i < count; i++) {
        crowd.push({
          x: Math.random() * W,
          y: 4 + Math.random() * 22,
          r: 1.4 + Math.random() * 1.8,
          hue: [270, 165, 280, 55, 170, 265][Math.floor(Math.random() * 6)] + Math.random() * 20,
          ph: Math.random() * Math.PI * 2,
        });
      }
    };

    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      W = Math.max(320, Math.floor(rect.width));
      H = Math.max(200, Math.floor(rect.height));
      const area = W * H;
      dpr = Math.min(window.devicePixelRatio || 1, area > 700000 ? 1.35 : 2);
      canvas.width = Math.floor(W * dpr);
      canvas.height = Math.floor(H * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.imageSmoothingEnabled = true;
      makeDirt();
      makeCrowd();
    };

    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(canvas);

    // ---- geometry helper ----
    const geo = () => {
      const standsH = Math.max(26, Math.min(40, H * 0.13));
      const railB = 8;
      const trackTop = standsH + 6;
      const trackBottom = H - railB;
      const lanes = R.current.runners.length || 6;
      const laneH = (trackBottom - trackTop) / lanes;
      const startX = Math.max(52, W * 0.09);
      const finishX = W - 26;
      return { standsH, trackTop, trackBottom, lanes, laneH, startX, finishX, trackW: finishX - startX };
    };

    const frame = (ts: number) => {
      const dtms = Math.min(48, ts - lastTs || 16);
      lastTs = ts;
      const st = R.current;
      const live = (st.running || st.parade) && !st.paused;
      if (live) t += dtms;
      const tsec = t / 1000;

      // ---------- burst trigger ----------
      if (st.burstToken !== lastBurst && st.burstToken > 0) {
        lastBurst = st.burstToken;
        const colors = st.burstColors.length ? st.burstColors : ["#facc15", "#10b981", "#38bdf8"];
        for (let i = 0; i < 230; i++) {
          spawn({
            x: Math.random() * W,
            y: -20 - Math.random() * 60,
            vx: (Math.random() - 0.5) * 2.4,
            vy: 1 + Math.random() * 2.2,
            max: 150 + Math.random() * 70,
            size: 4 + Math.random() * 5,
            color: colors[i % colors.length],
            kind: 1,
            rot: Math.random() * 6.28,
            vrot: (Math.random() - 0.5) * 0.34,
            grav: 0.075,
          });
        }
      }

      // ---------- backdrop ----------
      const sky = ctx.createLinearGradient(0, 0, 0, H);
      sky.addColorStop(0, "#1c0529");
      sky.addColorStop(0.4, "#0d0d10");
      sky.addColorStop(1, "#09090c");
      ctx.fillStyle = sky;
      ctx.fillRect(0, 0, W, H);

      // floodlights
      const lightCols = ["144,75,249", "0,255,189", "166,101,245"];
      for (let i = 0; i < 3; i++) {
        const lx = W * (0.2 + i * 0.3);
        const pulse = 0.5 + 0.5 * Math.sin(tsec * 1.6 + i * 2);
        const rg = ctx.createRadialGradient(lx, 0, 2, lx, 0, H * 0.75);
        rg.addColorStop(0, `rgba(${lightCols[i]},${0.10 + pulse * 0.06})`);
        rg.addColorStop(1, `rgba(${lightCols[i]},0)`);
        ctx.fillStyle = rg;
        ctx.fillRect(0, 0, W, H);
      }

      const g = geo();

      ctx.save();
      const sh = st.fx.shake;
      if (sh > 0.001) ctx.translate((Math.random() - 0.5) * 15 * sh, (Math.random() - 0.5) * 15 * sh);
      st.fx.shake *= 0.9;

      // ---------- stands + crowd ----------
      ctx.fillStyle = "#16171b";
      ctx.fillRect(0, 0, W, g.standsH);
      for (const c of crowd) {
        const bob = live ? Math.sin(tsec * 4 + c.ph) * 1.8 : Math.sin(tsec * 0.7 + c.ph) * 0.5;
        ctx.fillStyle = `hsla(${c.hue}, 70%, 58%, 0.55)`;
        ctx.beginPath();
        ctx.arc(c.x, c.y + bob, c.r, 0, 6.283);
        ctx.fill();
      }
      // stand rail
      ctx.fillStyle = "rgba(148,163,184,0.25)";
      ctx.fillRect(0, g.standsH - 1, W, 1.5);
      // big screen
      const bw = Math.min(120, W * 0.2);
      ctx.fillStyle = "rgba(2,6,23,0.85)";
      ctx.fillRect(W / 2 - bw / 2, 3, bw, 14);
      ctx.strokeStyle = "rgba(0,255,189,0.55)";
      ctx.lineWidth = 1;
      ctx.strokeRect(W / 2 - bw / 2, 3, bw, 14);
      ctx.fillStyle = "#00ffbd";
      ctx.font = "bold 9px ui-monospace, monospace";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(st.running ? "◉ LIVE RACE" : st.parade ? "NEXT RACE" : "BETTING OPEN", W / 2, 10.5);

      // ---------- track surface ----------
      const trackGrad = ctx.createLinearGradient(0, g.trackTop, 0, g.trackBottom);
      trackGrad.addColorStop(0, "#1a1622");
      trackGrad.addColorStop(0.5, "#201a2b");
      trackGrad.addColorStop(1, "#121017");
      ctx.fillStyle = trackGrad;
      ctx.fillRect(0, g.trackTop, W, g.trackBottom - g.trackTop);
      if (dirt) {
        ctx.save();
        ctx.globalAlpha = 0.55;
        ctx.fillStyle = dirt;
        ctx.fillRect(0, g.trackTop, W, g.trackBottom - g.trackTop);
        ctx.restore();
      }

      // lanes
      for (let i = 0; i < g.lanes; i++) {
        const y = g.trackTop + i * g.laneH;
        if (i % 2 === 1) {
          ctx.fillStyle = "rgba(0,0,0,0.10)";
          ctx.fillRect(0, y, W, g.laneH);
        }
        ctx.strokeStyle = "rgba(255,255,255,0.07)";
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(W, y);
        ctx.stroke();
      }

      // distance markers
      ctx.font = "bold 8px ui-monospace, monospace";
      ctx.textAlign = "center";
      ctx.textBaseline = "bottom";
      for (let m = 1; m <= 3; m++) {
        const mx = g.startX + (g.trackW * m) / 4;
        ctx.strokeStyle = "rgba(255,255,255,0.09)";
        ctx.setLineDash([3, 7]);
        ctx.beginPath();
        ctx.moveTo(mx, g.trackTop);
        ctx.lineTo(mx, g.trackBottom);
        ctx.stroke();
        ctx.setLineDash([]);
        ctx.fillStyle = "rgba(255,255,255,0.22)";
        ctx.fillText(`${m * 25}%`, mx, g.trackTop + 9);
      }

      // start line
      ctx.fillStyle = "rgba(255,255,255,0.35)";
      ctx.fillRect(g.startX - 1.5, g.trackTop, 2, g.trackBottom - g.trackTop);

      // rails (top & bottom) with posts
      const rail = (ry: number) => {
        ctx.fillStyle = "rgba(0,255,189,0.32)";
        ctx.fillRect(0, ry, W, 2.5);
        ctx.fillStyle = "rgba(144,75,249,0.55)";
        for (let x = 8; x < W; x += 46) ctx.fillRect(x, ry - 1, 2, 5);
      };
      rail(g.trackTop);
      rail(g.trackBottom);

      // ---------- finish line ----------
      const cs = Math.max(5, Math.min(9, g.laneH * 0.18));
      const cols = 2;
      for (let i = 0; i < g.lanes; i++) {
        const y = g.trackTop + i * g.laneH;
        const rows = Math.ceil(g.laneH / cs);
        for (let r = 0; r < rows; r++) {
          for (let c = 0; c < cols; c++) {
            ctx.fillStyle = (r + c) % 2 === 0 ? "#f1f5f9" : "#111827";
            ctx.fillRect(g.finishX + c * cs, y + r * cs, cs, Math.min(cs, y + g.laneH - (y + r * cs)));
          }
        }
      }
      // finish post + flag
      ctx.fillStyle = "#e2e8f0";
      ctx.fillRect(g.finishX + cs * 2 - 1, g.trackTop - 12, 2, 12);
      ctx.fillStyle = "#facc15";
      ctx.beginPath();
      ctx.moveTo(g.finishX + cs * 2 + 1, g.trackTop - 12);
      ctx.lineTo(g.finishX + cs * 2 + 17, g.trackTop - 7);
      ctx.lineTo(g.finishX + cs * 2 + 1, g.trackTop - 2);
      ctx.closePath();
      ctx.fill();

      // ---------- speed lines ----------
      if (st.running && !st.paused) {
        ctx.strokeStyle = "rgba(255,255,255,0.05)";
        ctx.lineWidth = 2;
        for (let i = 0; i < 7; i++) {
          const y = g.trackTop + ((i * 37 + ((t * 0.6) % 40)) % (g.trackBottom - g.trackTop));
          const len = 40 + ((i * 53) % 90);
          const x = W - ((t * (1.4 + i * 0.22) + i * 120) % (W + len));
          ctx.beginPath();
          ctx.moveTo(x, y);
          ctx.lineTo(x + len, y);
          ctx.stroke();
        }
      }

      // ---------- order ----------
      const rs = st.runners;
      const order = rs
        .map((r, i) => ({ i, x: r.x, place: r.place, fin: r.finished }))
        .sort((a, b) => {
          if (a.fin && b.fin) return a.place - b.place;
          if (a.fin) return -1;
          if (b.fin) return 1;
          return b.x - a.x;
        });

      // ---------- dust (behind horses) ----------
      if (st.running && !st.paused) {
        for (let k = 0; k < order.length; k++) {
          const { i } = order[k];
          const r = rs[i];
          if (r.finished) continue;
          const y = g.trackTop + i * g.laneH + g.laneH * 0.86;
          const x = g.startX + r.x * g.trackW;
          const c = k % 2 === 0;
          if (c || Math.random() < 0.5) {
            spawn({
              x: x - 24 + Math.random() * 8,
              y: y - Math.random() * 3,
              vx: -1.1 - Math.random() * 1.4,
              vy: -0.15 - Math.random() * 0.35,
              max: 26 + Math.random() * 18,
              size: 2.5 + Math.random() * 3.5,
              color: "rgba(166,101,245,0.35)",
              kind: 0,
            });
          }
        }
      }

      // ---------- particles pass 1 (dust) ----------
      const drawParticles = (kind: 0 | 1 | 2) => {
        for (let i = 0; i < MAX_P; i++) {
          const p = pool[i];
          if (!p.alive || p.kind !== kind) continue;
          if (live || kind !== 0) {
            p.life += 1;
            p.x += p.vx;
            p.y += p.vy;
            p.vy += p.grav;
            if (kind === 0) p.vx *= 0.965;
            if (kind === 1) {
              p.vx *= 0.994;
              p.rot += p.vrot;
            }
            if (kind === 2) p.vx *= 0.9;
          }
          const tt = p.life / p.max;
          if (tt >= 1) {
            p.alive = false;
            continue;
          }
          ctx.save();
          if (kind === 1) {
            ctx.globalAlpha = Math.max(0, 1 - tt * tt);
            ctx.translate(p.x, p.y);
            ctx.rotate(p.rot);
            ctx.fillStyle = p.color;
            ctx.fillRect(-p.size / 2, -p.size / 4, p.size, p.size / 2);
          } else if (kind === 2) {
            ctx.globalAlpha = Math.max(0, 1 - tt);
            ctx.strokeStyle = p.color;
            ctx.lineWidth = 1.6;
            ctx.beginPath();
            ctx.moveTo(p.x, p.y);
            ctx.lineTo(p.x - p.vx * 2.2, p.y - p.vy * 2.2);
            ctx.stroke();
          } else {
            ctx.globalAlpha = Math.max(0, (1 - tt) * 0.75);
            ctx.fillStyle = p.color;
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.size * (1 + tt * 1.4), 0, 6.283);
            ctx.fill();
          }
          ctx.restore();
        }
      };
      drawParticles(0);

      // ---------- horses (reference vector renderer) ----------
      // Local bbox ≈ 96 × 70 units → fit inside the lane height.
      const scale = Math.max(0.42, Math.min(1.15, (g.laneH * 0.88) / 70));
      for (let k = 0; k < order.length; k++) {
        const { i } = order[k];
        const r = rs[i];
        const laneY = g.trackTop + i * g.laneH + g.laneH * 0.9;
        const x = g.startX + r.x * g.trackW;
        const isRun = st.running && !st.paused && !r.finished;
        const isLead = order[0].i === i && st.running;
        // gallop phase: faster runners cycle faster; idle horses trot slowly at the gate
        const rate = isRun ? 1.15 + r.horse.volatility * 0.55 : 0.42;
        const phase = st.paused ? 0.12 : (tsec * rate + i * 0.19) % 1;
        const spd = isRun ? Math.min(1, 0.55 + r.horse.volatility * 0.5 + Math.abs(r.momentum) * 6) : 0.17;

        // contact shadow
        ctx.save();
        ctx.globalAlpha = 0.38;
        ctx.fillStyle = "#04120b";
        ctx.beginPath();
        ctx.ellipse(x + 3 * scale, laneY - 1, 30 * scale, 4.5 * scale, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();

        // leader lime glow
        if (isLead && r.x > 0.02) {
          ctx.save();
          const gl = ctx.createRadialGradient(x, laneY - 34 * scale, 4, x, laneY - 34 * scale, 60 * scale);
          gl.addColorStop(0, "rgba(0,255,189,0.16)");
          gl.addColorStop(1, "rgba(0,255,189,0)");
          ctx.fillStyle = gl;
          ctx.fillRect(x - 60 * scale, laneY - 94 * scale, 120 * scale, 120 * scale);
          ctx.restore();
        }

        ctx.save();
        ctx.translate(x, laneY - 34 * scale);
        drawHorse(ctx, { horse: artOf(r.horse), phase, speed: spd, scale, number: i + 1 });
        ctx.restore();

        // "YOU" marker
        if (st.yourHorseId === i && (st.running || st.parade)) {
          const bob = Math.round(Math.sin(tsec * 6) * 2);
          const my = Math.round(laneY - 26 * scale + bob);
          ctx.fillStyle = "#00ffbd";
          ctx.fillRect(x - 3, my + 4, 6, 3);
          ctx.fillRect(x - 1.5, my + 7, 3, 2);
          ctx.fillStyle = "rgba(0,255,189,0.18)";
          ctx.fillRect(x - 15, my - 10, 30, 13);
          ctx.strokeStyle = "rgba(0,255,189,0.7)";
          ctx.lineWidth = 1;
          ctx.strokeRect(x - 15 + 0.5, my - 10 + 0.5, 29, 12);
          ctx.fillStyle = "#00ffbd";
          ctx.font = "bold 8px 'Oswald', ui-sans-serif, system-ui, sans-serif";
          ctx.textAlign = "center";
          ctx.textBaseline = "middle";
          ctx.fillText("YOU", x, my - 3.5);
        }
      }

      // ---------- particles pass 2 (confetti / sparks) ----------
      drawParticles(1);
      drawParticles(2);

      // ---------- photo finish ----------
      if (st.running && !photoDone) {
        const leader = rs[order[0].i];
        if (leader && leader.x > 0.985) {
          photoDone = true;
          flashUntil = ts + 420;
          st.onPhotoFinish();
        }
      }
      if (ts < flashUntil) {
        const a = 0.35 * (1 - (flashUntil - ts) / 420);
        ctx.fillStyle = `rgba(255,255,255,${a})`;
        ctx.fillRect(0, 0, W, H);
      }
      if (!st.running) photoDone = false;

      // ---------- standings board ----------
      if (st.running || st.parade) {
        const bw2 = Math.min(126, W * 0.34);
        const bh = Math.min(g.lanes * 12 + 18, 92);
        const bx = W - bw2 - 8;
        const by = g.trackTop + 8;
        ctx.fillStyle = "rgba(2,6,23,0.72)";
        ctx.beginPath();
        ctx.roundRect(bx, by, bw2, bh, 6);
        ctx.fill();
        ctx.strokeStyle = "rgba(148,163,184,0.2)";
        ctx.lineWidth = 1;
        ctx.stroke();
        ctx.font = "bold 7px ui-monospace, monospace";
        ctx.textAlign = "left";
        ctx.textBaseline = "middle";
        ctx.fillStyle = "rgba(148,163,184,0.8)";
        ctx.fillText("ORDER", bx + 7, by + 8);
        for (let k = 0; k < Math.min(g.lanes, 6); k++) {
          const { i } = order[k];
          const r = rs[i];
          const yy = by + 19 + k * 12;
          const medal = k === 0 ? "🥇" : k === 1 ? "🥈" : k === 2 ? "🥉" : `${k + 1}.`;
          ctx.fillStyle = r.horse.color;
          ctx.beginPath();
          ctx.arc(bx + 22, yy, 3, 0, 6.283);
          ctx.fill();
          ctx.fillStyle = st.yourHorseId === i ? "#00ffbd" : "rgba(226,232,240,0.85)";
          ctx.font = "bold 8px ui-sans-serif, system-ui, sans-serif";
          ctx.fillText(`${medal} ${r.horse.name.slice(0, 10)}`, bx + 28, yy);
        }
      }

      ctx.restore();

      // ---------- pause veil ----------
      if (st.paused && st.running) {
        ctx.fillStyle = "rgba(2,6,23,0.62)";
        ctx.fillRect(0, 0, W, H);
        ctx.fillStyle = "#e2e8f0";
        ctx.font = "bold 26px ui-sans-serif, system-ui, sans-serif";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText("PAUSED", W / 2, H / 2 - 10);
        ctx.font = "500 12px ui-sans-serif, system-ui, sans-serif";
        ctx.fillStyle = "#94a3b8";
        ctx.fillText("press P to resume", W / 2, H / 2 + 14);
      }

      requestAnimationFrame(frame);
    };

    requestAnimationFrame(frame);
    return () => ro.disconnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return <canvas ref={canvasRef} className="block h-full w-full" />;
}
