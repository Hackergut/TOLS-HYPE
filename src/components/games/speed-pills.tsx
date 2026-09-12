import { useState } from "react";
import { loadGameSpeed, saveGameSpeed, type GameSpeed } from "@/lib/game-prefs";
import { playSfx } from "@/lib/game-sound";
import { cn } from "cn";

const SPEEDS: { id: GameSpeed; label: string }[] = [
  { id: "regular", label: "1×" },
  { id: "fast", label: "2×" },
  { id: "instant", label: "INST" },
];

export function SpeedPills() {
  const [speed, setSpeed] = useState(loadGameSpeed);
  return (
    <div className="flex rounded-md bg-muted p-0.5" role="radiogroup" aria-label="Game speed">
      {SPEEDS.map((s) => (
        <button
          key={s.id}
          type="button"
          role="radio"
          aria-checked={speed === s.id}
          onClick={() => {
            saveGameSpeed(s.id);
            setSpeed(s.id);
            playSfx("click");
          }}
          className={cn(
            "h-6 rounded px-1.5 text-[0.6rem] font-bold tracking-wide",
            speed === s.id ? "bg-lime text-black" : "text-muted-foreground hover:text-foreground",
          )}
        >
          {s.label}
        </button>
      ))}
    </div>
  );
}
