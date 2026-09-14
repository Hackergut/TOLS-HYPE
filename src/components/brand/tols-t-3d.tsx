"use client";

import { Component, lazy, Suspense, useEffect, useRef, useState, type ReactNode } from "react";
import { cn } from "cn";

const SVG3D = lazy(() => import("3dsvg").then((m) => ({ default: m.SVG3D })));

class SceneGuard extends Component<{ children: ReactNode }, { fail: boolean }> {
  state = { fail: false };
  static getDerivedStateFromError() {
    return { fail: true };
  }
  componentDidCatch() {
    /* WebGL context loss */
  }
  render() {
    return this.state.fail ? null : this.props.children;
  }
}

/** TOLS wordmark (Oswald) extruded with 3dsvg — glass cyan. */
export function TolsT3D({
  className,
}: {
  className?: string;
  mode?: "hero" | "boot";
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [box, setBox] = useState({ w: 0, h: 0 });

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const measure = () => {
      const r = el.getBoundingClientRect();
      const w = Math.max(1, Math.round(r.width));
      const h = Math.max(1, Math.round(r.height));
      setBox((prev) => (prev.w === w && prev.h === h ? prev : { w, h }));
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  return (
    <div ref={ref} className={cn("relative overflow-hidden", className)} aria-hidden>
      {box.w > 8 && box.h > 8 ? (
        <SceneGuard>
          <Suspense fallback={null}>
            <SVG3D
              text="TOLS"
              font="Oswald"
              depth={2.3}
              smoothness={0.6}
              color="#06b6d4"
              material="glass"
              metalness={0.1}
              roughness={0.05}
              opacity={0.35}
              lightPosition={[-10, 1.5, 10]}
              interactive
              shadow={false}
              background="transparent"
              width={box.w}
              height={box.h}
            />
          </Suspense>
        </SceneGuard>
      ) : null}
    </div>
  );
}
