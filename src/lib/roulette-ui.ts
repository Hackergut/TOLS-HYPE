import { rouletteColor } from "@/lib/rng";
import { pocketClass, pocketFill, pocketInk, pocketStrokeClass, TOLS } from "@/lib/palette";

export const ROULETTE_PAINT = TOLS;

export function roulettePocketClass(color: "red" | "black" | "green" | string) {
  return pocketClass(color);
}

export function roulettePocketStroke(color: "red" | "black" | "green" | string) {
  return pocketStrokeClass(color);
}

export function roulettePocketFill(n: number) {
  return pocketFill(rouletteColor(n));
}

export function roulettePocketInk(n: number) {
  return pocketInk(rouletteColor(n));
}
