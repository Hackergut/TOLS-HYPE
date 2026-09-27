import HorseRace from "@/games/horse-race/game/HorseRaceGame";
import "@/games/horse-race/horse.css";

/** Embedded TOLS derby. Play-money room from the horse-race minigame. */
export function HorseRaceGame({ gameId: _gameId }: { gameId: string }) {
  return (
    <div className="h-[min(78dvh,52rem)] min-h-[32rem] overflow-hidden rounded-2xl ring-1 ring-white/10">
      <HorseRace />
    </div>
  );
}
