"use client";

import { useMemo, useState } from "react";
import { RiDropFill, RiGiftLine } from "@remixicon/react";
import { toast } from "sonner";
import { cn } from "cn";
import { useBetHistory } from "@/lib/bet-history";
import { VIP_REWARDS, VIP_TIERS, vipTierIndex } from "@/lib/vip";

/** Progress hero: current tier, points, points-to-next, progress bar. */
export function VipProgressWidget() {
  const bets = useBetHistory();
  const points = useMemo(() => bets.reduce((s, b) => s + b.stake, 0), [bets]);

  const idx = vipTierIndex(points);
  const cur = VIP_TIERS[idx]!;
  const next = VIP_TIERS[idx + 1];
  const span = next ? next.points - cur.points : 1;
  const into = next ? Math.min(1, (points - cur.points) / span) : 1;
  const pct = Math.round(into * 10000) / 100;
  const toNext = next ? Math.max(0, next.points - points).toLocaleString("en-US") : null;

  return (
    <section className="overflow-hidden rounded-2xl border border-white/10 bg-[#16171b]">
      <div
        className="relative h-28 md:h-36"
        style={{
          background:
            "radial-gradient(80% 120% at 20% 30%, #00ffbd88, transparent 55%), radial-gradient(70% 100% at 80% 20%, #904bf9cc, transparent 50%), radial-gradient(60% 80% at 50% 90%, #ea2fd466, transparent 50%), #1a1030",
        }}
      >
        <div className="absolute inset-0 grid place-items-center text-5xl md:text-6xl" aria-hidden>
          {cur.icon}
        </div>
      </div>
      <div className="grid gap-2 p-3 md:p-4">
        <div className="flex flex-wrap items-center justify-between gap-1 text-[0.7rem] font-semibold text-white/70 md:text-xs">
          <span>
            {cur.name} · {points.toLocaleString("en-US")} pts
          </span>
          <span className="tabular-nums">
            {toNext ? `${toNext} pts to ${next!.name}` : "Max tier reached"}
          </span>
        </div>
        <div className="h-1.5 overflow-hidden rounded-full bg-white/10">
          <div className="h-full rounded-full bg-lime" style={{ width: `${Math.min(100, pct)}%` }} />
        </div>
        <div className="flex items-center justify-between text-[0.7rem] text-white/55 md:text-xs">
          <span className="inline-flex items-center gap-1">
            <RiDropFill className="size-3 text-[#7dd3fc]" />
            {cur.name}
          </span>
          <span className="inline-flex items-center gap-1">
            <RiDropFill className="size-3 text-[#c4b5fd]" />
            {next?.name ?? "Max"}
          </span>
        </div>
      </div>
    </section>
  );
}

/** Reward claim cards — same widgets as the profile VIP pane. */
export function VipRewardsGrid({ compact = false }: { compact?: boolean }) {
  const [claimed, setClaimed] = useState(false);

  return (
    <section>
      <h3 className="mb-2 flex items-center gap-2 text-sm font-semibold">
        <RiGiftLine className="size-4 text-lime" />
        Your rewards
      </h3>
      <ul className={cn("grid grid-cols-2 gap-2", compact && "gap-1.5")}>
        {VIP_REWARDS.map((r) => (
          <li
            key={r.id}
            className="flex flex-col items-center rounded-xl border border-white/10 bg-[#12141a] px-2 py-3 text-center md:py-4"
          >
            <p className="text-[0.65rem] text-white/40">{r.hint}</p>
            <p className="mt-2 text-2xl" aria-hidden>
              {r.icon}
            </p>
            <p className="mt-1 text-[0.78rem] font-semibold">{r.title}</p>
            <button
              type="button"
              disabled={!r.ready || (r.id === "instant" && claimed)}
              onClick={() => {
                if (r.id !== "instant") return;
                setClaimed(true);
                toast.success("Rakeback claimed");
              }}
              className={cn(
                "mt-2 h-8 w-full rounded-lg text-xs font-bold",
                r.ready && !(r.id === "instant" && claimed)
                  ? "bg-white/15 text-white hover:bg-white/25"
                  : "bg-white/8 text-white/45",
              )}
            >
              {r.id === "instant" && claimed ? "Claimed" : r.cta}
            </button>
          </li>
        ))}
      </ul>
    </section>
  );
}