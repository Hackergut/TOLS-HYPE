"use client";

import { cn } from "cn";

/**
 * Auth/boot T mark. Live SVG3D + OrbitControls was crashing the login page:
 * multiple WebGL contexts → THREE.WebGLRenderer: Context Lost →
 * OrbitControls.connect(null).addEventListener. Raster relief is the stable
 * brand mark; do not remount 3dsvg here.
 */
export function TolsT3D({
  className,
}: {
  className?: string;
  mode?: "hero" | "boot";
}) {
  return (
    <div className={cn("relative overflow-hidden pointer-events-none", className)} aria-hidden>
      <img src="/brand/tols-t-relief.png" alt="" className="size-full object-contain p-[8%]" />
    </div>
  );
}
