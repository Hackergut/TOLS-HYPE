import { useEffect, useState } from "react";
import { TOP_SLOT_MULTIS, type SpotId } from "@/lib/crazy/constants";
import { spotLabel } from "./BetPanel";

export default function TopSlotPill({ rolling, paused, result, revealed }: { rolling: boolean; paused: boolean; result: { spot: SpotId; multi: number } | null; revealed: boolean }) {
  const [step, setStep] = useState(0);
  const numberSpots: SpotId[] = ["one", "two", "five", "ten"];
  useEffect(() => {
    if (!rolling || paused || revealed) return;
    const timer = window.setInterval(() => setStep((value) => value + 1), 90);
    return () => window.clearInterval(timer);
  }, [rolling, paused, revealed]);
  return <div className={`top-slot-pill ${revealed ? "revealed" : ""}`} id="topslot-box" aria-live="polite"><span>TOP SLOT</span><b className={rolling && !revealed ? "reel-rolling" : ""}>{revealed && result ? `${spotLabel(result.spot)} ${result.multi}x` : rolling ? `${spotLabel(numberSpots[step % numberSpots.length])} ${TOP_SLOT_MULTIS[step % TOP_SLOT_MULTIS.length]}x` : "-"}</b></div>;
}