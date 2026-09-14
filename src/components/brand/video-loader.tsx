"use client";

import { useEffect, useState } from "react";
import { TolsT3D } from "@/components/brand/tols-t-3d";

const MIN_MS = 1600;
const CAP_MS = 2800;

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
    const t0 = setTimeout(() => setFading(true), 40);
    const t = setTimeout(() => setGone(true), 560);
    return () => {
      clearTimeout(t0);
      clearTimeout(t);
    };
  }, [done]);

  if (gone) return null;

  return (
    <div
      className="tols-boot"
      style={{ opacity: fading ? 0 : 1 }}
      role="img"
      aria-label="Loading TOLS"
    >
      <TolsT3D mode="boot" className="tols-boot-mark" />
    </div>
  );
}
