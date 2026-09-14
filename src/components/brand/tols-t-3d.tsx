"use client";

import { Component, lazy, Suspense, useEffect, useRef, useState, type ReactNode } from "react";
import { cn } from "cn";

const SVG3D = lazy(() => import("3dsvg").then((m) => ({ default: m.SVG3D })));

/** Official TOLS "T" glyph — pixel-T from the logo, extruded glass cyan. */
const TOLS_T_SVG = `<svg xmlns="http://www.w3.org/2000/svg" width="192" height="192" viewBox="0 0 192 192"><path d="M12,12L24,12L36,12L48,12L60,12L72,12L84,12L96,12L108,12L120,12L132,12L144,12L156,12L168,12L180,12L180,24L180,36L180,48L180,60L180,72L180,84L168,84L156,84L144,84L132,84L132,96L132,108L132,120L132,132L132,144L132,156L132,168L132,180L132,192L120,192L120,180L120,168L120,156L120,144L120,132L120,120L120,108L120,96L120,84L120,72L132,72L144,72L156,72L168,72L168,60L168,48L168,36L168,24L156,24L144,24L132,24L120,24L108,24L96,24L84,24L72,24L60,24L48,24L36,24L24,24L24,36L24,48L24,60L24,72L36,72L48,72L60,72L72,72L72,84L72,96L72,108L72,120L72,132L72,144L72,156L72,168L72,180L72,192L60,192L60,180L60,168L60,156L60,144L60,132L60,120L60,108L60,96L60,84L48,84L36,84L24,84L12,84L12,72L12,60L12,48L12,36L12,24L12,12Z" fill="black" fill-rule="evenodd"/></svg>`;

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

/** TOLS "T" (logo glyph) extruded with 3dsvg — glass cyan, spin-float. */
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
              svg={TOLS_T_SVG}
              depth={2.3}
              smoothness={0.6}
              color="#34edcd"
              material="glass"
              metalness={0.1}
              roughness={0.05}
              opacity={0.35}
              animate="spinFloat"
              animateReverse
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
