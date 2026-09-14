import { useMemo, useState } from "react";
import { Link } from "@tanstack/react-router";
import { RiGiftLine, RiDropFill } from "@remixicon/react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { useBetHistory } from "@/lib/bet-history";
import { cn } from "cn";
import { VIP_REWARDS, VIP_TIERS, vipTierIndex } from "@/lib/vip";

export function VipPane() {
  const bets = useBetHistory();
  const wagered = useMemo(() => bets.reduce((s, b) => s + b.stake, 0), [bets]);
  const [code, setCode] = useState("");
  const [openCode, setOpenCode] = useState(false);
  const [claimed, setClaimed] = useState(false);

  const idx = vipTierIndex(wagered);
  const cur = VIP_TIERS[idx]!;
  const next = VIP_TIERS[idx + 1];
  const span = next ? next.points - cur.points : 1;
  const into = next ? Math.min(1, (wagered - cur.points) / span) : 1;
  const pct = Math.round(into * 10000) / 100;

  return (
    <div className="grid gap-4 md:gap-5">
      <div className="overflow-hidden rounded-2xl border border-white/10 bg-[#16171b]">
        <div
          className="relative h-28 md:h-36"
          style={{
            background:
              "radial-gradient(80% 120% at 20% 30%, #00ffbd88, transparent 55%), radial-gradient(70% 100% at 80% 20%, #904bf9cc, transparent 50%), radial-gradient(60% 80% at 50% 90%, #ea2fd466, transparent 50%), #1a1030",
          }}
        >
          <div className="absolute inset-0 grid place-items-center text-5xl md:text-6xl" aria-hidden>
            💎
          </div>
        </div>
        <div className="grid gap-2 p-3 md:p-4">
          <div className="flex items-center justify-between text-[0.7rem] font-semibold text-white/70 md:text-xs">
            <span>Your VIP Progress</span>
            <span className="tabular-nums">{pct.toFixed(2)}%</span>
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
          <Button asChild className="mt-1 h-10 w-full rounded-xl bg-[#904bf9] text-sm font-bold text-white hover:bg-[#7c3aed] md:h-11">
            <Link to="/vip">View VIP Program</Link>
          </Button>
        </div>
      </div>

      <section>
        <h3 className="mb-2 flex items-center gap-2 text-sm font-semibold">
          <RiGiftLine className="size-4 text-lime" />
          Your rewards
        </h3>
        <ul className="grid grid-cols-2 gap-2">
          {VIP_REWARDS.map((r) => (
            <li key={r.id} className="flex flex-col items-center rounded-xl border border-white/10 bg-[#12141a] px-2 py-3 text-center md:py-4">
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

      <div className="rounded-xl border border-white/10">
        <button
          type="button"
          className="flex h-11 w-full items-center justify-between px-3 text-sm font-medium"
          onClick={() => setOpenCode((v) => !v)}
        >
          Redeem Code
          <span className="text-white/40">{openCode ? "▴" : "▾"}</span>
        </button>
        {openCode ? (
          <form
            className="flex gap-2 border-t border-white/10 p-3"
            onSubmit={(e) => {
              e.preventDefault();
              if (!code.trim()) {
                toast.error("Enter a code");
                return;
              }
              toast.success("Code submitted");
              setCode("");
            }}
          >
            <input
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder="Code"
              className="h-10 min-w-0 flex-1 rounded-lg border border-white/10 bg-[#12141a] px-3 text-sm"
            />
            <Button type="submit" className="h-10 rounded-lg bg-[#904bf9] px-4 text-sm font-bold text-white">
              Apply
            </Button>
          </form>
        ) : null}
      </div>

      <Link to="/vip" className="text-center text-xs text-[#c4b5fd] underline">
        Learn more about the TOLS VIP program
      </Link>
    </div>
  );
}
