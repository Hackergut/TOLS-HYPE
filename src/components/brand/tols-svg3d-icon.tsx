"use client";

import { cn } from "cn";
import type { ReferralIconSpec } from "@/lib/brand/referral-icons";

export function TolsSvg3DIcon({
  spec,
  className,
}: {
  spec: ReferralIconSpec;
  className?: string;
}) {
  return (
    <div className={cn("tols-ref-icon relative overflow-hidden pointer-events-none", className)} aria-hidden>
      <span
        className="grid size-full place-items-center p-[22%]"
        style={{ color: spec.color }}
        dangerouslySetInnerHTML={{ __html: spec.svg }}
      />
    </div>
  );
}
