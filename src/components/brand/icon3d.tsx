"use client";

import { cn } from "cn";
import { DIAMOND_PLUS_SVG } from "@/assets/icon3d/diamond-plus";

/** Flat diamond — no second WebGL context on the auth column. */
export function TolsDiamondPlus3D({ className }: { className?: string }) {
  return (
    <div className={cn("relative overflow-hidden pointer-events-none", className)} aria-hidden>
      <span
        className="grid size-full place-items-center p-[12%] text-[#ef4444]"
        dangerouslySetInnerHTML={{ __html: DIAMOND_PLUS_SVG }}
      />
    </div>
  );
}
