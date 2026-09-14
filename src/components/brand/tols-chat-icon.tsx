"use client";

import { lazy, Suspense, useEffect, useState } from "react";
import { cn } from "cn";

const SVG3D = lazy(() => import("3dsvg").then((m) => ({ default: m.SVG3D })));

const CHAT_SVG = `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"><path fill="#8b5cf6" fill-rule="evenodd" d="M7 4h10a3 3 0 0 1 3 3v10a3 3 0 0 1-3 3H7a3 3 0 0 1-3-3V7a3 3 0 0 1 3-3zm1 2h8a1 1 0 0 1 1 1v8a1 1 0 0 1-1 1H8a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1z"/><circle cx="12" cy="12" r="2" fill="#8b5cf6"/></svg>`;

function Flat({ className }: { className?: string }) {
  return (
    <span
      className={cn("grid size-full place-items-center p-[18%] text-[#8b5cf6]", className)}
      dangerouslySetInnerHTML={{ __html: CHAT_SVG }}
    />
  );
}

export function TolsChatIcon({ className }: { className?: string }) {
  const [mounted, setMounted] = useState(false);
  const [reduce, setReduce] = useState(false);

  useEffect(() => {
    setMounted(true);
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const sync = () => setReduce(mq.matches);
    sync();
    mq.addEventListener("change", sync);
    return () => mq.removeEventListener("change", sync);
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
          svg={CHAT_SVG}
          depth={3}
          smoothness={0.3}
          color="#8b5cf6"
          material="metal"
          metalness={0.55}
          roughness={0.18}
          animate="float"
          zoom={8.2}
          lightPosition={[10, 10, -10]}
          lightIntensity={5}
          ambientIntensity={0.28}
          shadow={false}
          scrollZoom={false}
          draggable={false}
          cursorOrbit={false}
          interactive={false}
          intro="fade"
          introDuration={0.7}
          background="#0d0d10"
          width="100%"
          height="100%"
        />
      </Suspense>
    </div>
  );
}
