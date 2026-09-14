"use client";

import { lazy, Suspense, useEffect, useState } from "react";
import { cn } from "cn";

const SVG3D = lazy(() => import("3dsvg").then((m) => ({ default: m.SVG3D })));

const CHAT_SVG = `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" viewBox="0 0 24 24"><path fill="#8b5cf6" fill-rule="evenodd" d="M12 2c5.5228 0 10 4.4772 10 10s-4.4772 10-10 10S2 17.5228 2 12 6.4772 2 12 2Zm0 4.8486c-.3012 0-.5716.1857-.6797.4668l-.9111 2.3682c-.1016.264-.3101.4726-.5742.5742l-2.3682.9111c-.2812.1082-.4668.3785-.4668.6797 0 .3013.1856.5716.4668.6797l2.3682.9112c.2641.1015.4726.3101.5742.5742l.9111 2.3681c.1081.2812.3785.4668.6797.4668s.5716-.1856.6797-.4668l.9111-2.3681c.1016-.2641.3101-.4727.5742-.5742l2.3682-.9112c.2812-.1081.4668-.3784.4668-.6797s-.1856-.5715-.4668-.6797l-2.3682-.9111c-.2641-.1016-.4726-.3101-.5742-.5742l-.9111-2.3682c-.1081-.2811-.3785-.4668-.6797-.4668Z" clip-rule="evenodd"/></svg>`;

function Flat({ className }: { className?: string }) {
  return (
    <span
      className={cn("grid size-full place-items-center p-[12%] text-[#8b5cf6]", className)}
      dangerouslySetInnerHTML={{ __html: CHAT_SVG }}
    />
  );
}

export function TolsChatIcon({ className }: { className?: string }) {
  const [mounted, setMounted] = useState(false);
  const [reduce, setReduce] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const sync = () => setReduce(mq.matches);
    sync();
    mq.addEventListener("change", sync);
    const t = window.setTimeout(() => setMounted(true), 3200);
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
          svg={CHAT_SVG}
          depth={2}
          smoothness={0.6}
          color="#8b5cf6"
          material="metal"
          metalness={0.9}
          roughness={0.2}
          animate="pulse"
          animateSpeed={0.5}
          animateReverse
          zoom={8.2}
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
          background="#0d0d10"
          width="100%"
          height="100%"
        />
      </Suspense>
    </div>
  );
}
