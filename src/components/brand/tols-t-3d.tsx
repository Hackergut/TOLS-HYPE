"use client";

import { Component, lazy, Suspense, useEffect, useState, type ReactNode } from "react";
import { cn } from "cn";

const SVG3D = lazy(() => import("3dsvg").then((m) => ({ default: m.SVG3D })));

const TOLS_T_SVG = `<svg xmlns="http://www.w3.org/2000/svg" width="192" height="192" viewBox="0 0 192 192"><path d="M12,0L24,0L36,0L48,0L60,0L72,0L84,0L96,0L108,0L120,0L132,0L144,0L156,0L168,0L180,0L180,12L180,24L180,36L180,48L180,60L180,72L168,72L156,72L144,72L132,72L132,84L132,96L132,108L132,120L132,132L132,144L132,156L132,168L132,180L132,192L120,192L108,192L96,192L84,192L72,192L60,192L60,180L60,168L60,156L60,144L60,132L60,120L60,108L60,96L60,84L60,72L48,72L36,72L24,72L12,72L12,60L12,48L12,36L12,24L12,12L12,0Z M24,12L36,12L48,12L60,12L72,12L84,12L96,12L108,12L120,12L132,12L144,12L156,12L168,12L168,24L168,36L168,48L168,60L156,60L144,60L132,60L120,60L120,72L120,84L120,96L120,108L120,120L120,132L120,144L120,156L120,168L120,180L108,180L96,180L84,180L72,180L72,168L72,156L72,144L72,132L72,120L72,108L72,96L72,84L72,72L72,60L60,60L48,60L36,60L24,60L24,48L24,36L24,24L24,12Z" fill="black" fill-rule="evenodd"/></svg>`;

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

/**
 * Pixel T extruded with 3dsvg. One canvas, no OrbitControls:
 * interactive/cursorOrbit/draggable stay off — those called connect(null)
 * after Context Lost.
 */
export function TolsT3D({
  className,
}: {
  className?: string;
  mode?: "hero" | "boot";
}) {
  const [live, setLive] = useState(false);
  useEffect(() => {
    setLive(true);
  }, []);

  if (!live) {
    return <div className={cn("relative overflow-hidden", className)} aria-hidden />;
  }

  return (
    <div className={cn("relative overflow-hidden pointer-events-none", className)} aria-hidden>
      <SceneGuard>
        <Suspense fallback={null}>
          <SVG3D
            svg={TOLS_T_SVG}
            depth={2}
            smoothness={0.6}
            color="#8b5cf6"
            material="metal"
            metalness={0.9}
            roughness={0.2}
            animate="pulse"
            animateSpeed={0.5}
            animateReverse
            zoom={18}
            lightPosition={[10, 4.5, 10]}
            lightIntensity={4.2}
            ambientIntensity={0.55}
            interactive={false}
            cursorOrbit={false}
            draggable={false}
            scrollZoom={false}
            shadow={false}
            background="transparent"
            width="100%"
            height="100%"
          />
        </Suspense>
      </SceneGuard>
    </div>
  );
}
