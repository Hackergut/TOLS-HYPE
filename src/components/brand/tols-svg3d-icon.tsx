"use client";

import { lazy, Suspense, useEffect, useState } from "react";
import { cn } from "cn";
import type { ReferralIconSpec } from "@/lib/brand/referral-icons";

const SVG3D = lazy(() => import("3dsvg").then((m) => ({ default: m.SVG3D })));

function FlatMark({ spec, className }: { spec: ReferralIconSpec; className?: string }) {
  return (
    <span
      className={cn("grid size-full place-items-center p-[22%]", className)}
      style={{ color: spec.color }}
      dangerouslySetInnerHTML={{ __html: spec.svg }}
    />
  );
}

export function TolsSvg3DIcon({
  spec,
  className,
}: {
  spec: ReferralIconSpec;
  className?: string;
}) {
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
      <div className={cn("tols-ref-icon relative overflow-hidden", className)} aria-hidden>
        <FlatMark spec={spec} />
      </div>
    );
  }

  return (
    <div className={cn("tols-ref-icon relative overflow-hidden", className)} aria-hidden>
      <Suspense fallback={<FlatMark spec={spec} />}>
        <SVG3D
          svg={spec.svg}
          depth={2.2}
          smoothness={0.6}
          color={spec.color}
          material={spec.material}
          metalness={spec.metalness}
          roughness={spec.roughness}
          animate="float"
          zoom={8}
          lightPosition={spec.lightPosition}
          lightIntensity={spec.lightIntensity}
          ambientIntensity={spec.ambientIntensity}
          shadow={false}
          scrollZoom={false}
          draggable={false}
          cursorOrbit={false}
          interactive={false}
          intro="fade"
          introDuration={0.8}
          background="#120816"
          width="100%"
          height="100%"
        />
      </Suspense>
    </div>
  );
}
