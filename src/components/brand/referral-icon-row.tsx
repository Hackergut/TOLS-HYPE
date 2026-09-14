"use client";

import { REFERRAL_ICONS } from "@/lib/brand/referral-icons";
import { TolsSvg3DIcon } from "@/components/brand/tols-svg3d-icon";

export function ReferralIconRow() {
  return (
    <ul className="tols-ref-grid">
      {REFERRAL_ICONS.map((spec) => (
        <li key={spec.id} className="tols-ref-card">
          <TolsSvg3DIcon spec={spec} />
          <h3>{spec.title}</h3>
          <p>{spec.copy}</p>
        </li>
      ))}
    </ul>
  );
}
