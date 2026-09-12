"use client";

import { useEffect, useState } from "react";
import { TolsReels } from "@/components/brand/tols-loader";

const MIN_MS = 1100;
const CAP_MS = 3500;

export function VideoLoader({ ready }: { ready: boolean }) {
  const [minDone, setMinDone] = useState(false);
  const [capReached, setCapReached] = useState(false);
  const [fading, setFading] = useState(false);
  const [gone, setGone] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setMinDone(true), MIN_MS);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    const t = setTimeout(() => setCapReached(true), CAP_MS);
    return () => clearTimeout(t);
  }, []);

  const done = (ready && minDone) || capReached;
  useEffect(() => {
    if (!done) return;
    const t0 = setTimeout(() => setFading(true), 0);
    const t = setTimeout(() => setGone(true), 500);
    return () => {
      clearTimeout(t0);
      clearTimeout(t);
    };
  }, [done]);

  if (gone) return null;

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 9999,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "var(--canvas, #0d0d10)",
        opacity: fading ? 0 : 1,
        transition: "opacity 0.5s ease-out",
        pointerEvents: fading ? "none" : "auto",
      }}
      role="img"
      aria-label="Loading TOLS"
    >
      <TolsReels size="full" />
    </div>
  );
}
