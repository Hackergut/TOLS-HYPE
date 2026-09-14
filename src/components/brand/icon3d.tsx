"use client";

import { lazy, Suspense, useEffect, useState } from "react";
import { cn } from "cn";
import { DIAMOND_PLUS_SVG } from "@/assets/icon3d/diamond-plus";

/**
 * Chrome diamond-plus brand icon (3dsvg) for the auth art column.
 * House pattern (tols-chat-icon): lazy SVG3D, reduced-motion aware,
 * flat 2D fallback while the chunk loads or if WebGL is unavailable.
 */
const SVG3D = lazy(() => import("3dsvg").then((m) => ({ default: m.SVG3D })));

function Flat({ className }: { className?: string }) {
  return (
    <span
      className={cn("grid size-full place-items-center p-[12%] text-[#ef4444]", className)}
      dangerouslySetInnerHTML={{ __html: DIAMOND_PLUS_SVG }}
    />
  );
}

export function TolsDiamondPlus3D({ className }: { className?: string }) {
  const [mounted, setMounted] = useState(false);
  const [reduce, setReduce] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const sync = () => setReduce(mq.matches);
    sync();
    const t = window.setTimeout(() => setMounted(true), 2600);
    return () => {
      mq.removeEventListener("change", sync);
      window.clearTimeout(t);
    };
  }, []);

  if (!mounted || reduce) {
    return (
      <div className={cn("relative overflow-hidden", className)} aria-hidden>
        <Flat />
      </div>
    );
  }

  return (
    <div className={cn("relative overflow-hidden", className)} aria-hidden>
      <Suspense fallback={<Flat />}>
        <SVG3D
          svg={DIAMOND_PLUS_SVG}
          depth={2.2}
          smoothness={0.6}
          color="#ef4444"
          material="chrome"
          metalness={1}
          roughness={0.42}
          texture="/brand/hype/icon3d-chrome.png"
          animate="float"
          zoom={8}
          lightPosition={[10, 4.5, 10]}
          lightIntensity={4.2}
          ambientIntensity={0.55}
          shadow={false}
          scrollZoom={false}
          draggable={false}
          cursorOrbit={false}
          interactive={false}
          intro="fade"
          introDuration={0.7}
          background="transparent"
          width="100%"
          height="100%"
        />
      </Suspense>
    </div>
  );
}