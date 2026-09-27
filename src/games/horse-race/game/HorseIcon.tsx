import { useEffect, useRef } from "react";
import { drawHorse } from "./horseArt";
import { artOf, type Horse } from "./types";

/**
 * Small canvas thumbnail of a runner using the SAME vector renderer as the
 * track, so bet cards / start screen show exactly the horse you're backing.
 * Idle horses "trot" gently; `running` plays the full gallop.
 */
export default function HorseIcon({
  horse,
  size = 64,
  running = false,
  number,
}: {
  horse: Horse;
  size?: number;
  running?: boolean;
  number?: number;
}) {
  const ref = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const cv = ref.current;
    if (!cv) return;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const w = size * 1.5;
    const h = size;
    cv.width = Math.round(w * dpr);
    cv.height = Math.round(h * dpr);
    const ctx = cv.getContext("2d");
    if (!ctx) return;

    // Local bbox ≈ 96×70 → fit inside w×h.
    const scale = Math.min(w / 100, h / 74);
    const art = artOf(horse);
    let raf = 0;
    const t0 = performance.now();

    const draw = (ts: number) => {
      const t = (ts - t0) / 1000;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, w, h);
      ctx.save();
      ctx.translate(w * 0.5, h * 0.56);
      drawHorse(ctx, {
        horse: art,
        phase: (t * (running ? 1.4 : 0.42)) % 1,
        speed: running ? 0.85 : 0.17,
        scale,
        number: number ?? horse.id + 1,
      });
      ctx.restore();
      raf = requestAnimationFrame(draw);
    };
    raf = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(raf);
  }, [horse, size, running, number]);

  return (
    <canvas
      ref={ref}
      style={{ width: size * 1.5, height: size, display: "block" }}
      aria-label={horse.name}
      role="img"
    />
  );
}
