/**
 * TOLS + Solana accents. Tokens: src/styles.css.
 *
 * purple     #904BF9  Solana violet — CTA / brand
 * mint       #00FFBD  Solana green — win / bet
 * magenta    #EA2FD4  VIP
 * uva        #1c0529  hub
 * black      #0d0d10  canvas
 */
export const TOLS = {
  lime: "var(--color-lime)",
  limeFluo: "var(--color-lime-400)",
  purple: "var(--color-purple)",
  purpleDeep: "var(--color-purple-deep)",
  uva: "var(--color-uva)",
  anthracite: "var(--color-anthracite)",
  orange: "var(--color-orange)",
  wheel: "var(--color-wheel)",
  wheelLine: "var(--color-wheel-line)",
  inkOnLime: "#0d0d10",
} as const;

export const TOLS_HEX = {
  purple: "#904bf9",
  uva: "#1c0529",
  lime: "#00ffbd",
  anthracite: "#504756",
  orange: "#ff8904",
  limeFluo: "#34edcd",
  black: "#0d0d10",
  magenta: "#ea2fd4",
  magentaDark: "#9628a1",
} as const;

export type PocketTone = "red" | "black" | "green";

export function pocketClass(color: PocketTone | string) {
  if (color === "green") return "border-2 border-lime bg-lime text-black";
  if (color === "red") return "bg-lime text-black";
  return "bg-purple text-lime";
}

/** Table mock: dark cell, lime/purple stroke. */
export function pocketStrokeClass(color: PocketTone | string) {
  if (color === "black") return "border-2 border-purple bg-[#2d2d2d] text-lime";
  return "border-2 border-lime bg-[#2d2d2d] text-lime";
}

export function widgetWinClass(win: boolean) {
  return win ? "bg-lime text-black" : "bg-purple text-lime";
}

export function pocketFill(color: PocketTone | string) {
  return color === "black" ? TOLS.purple : TOLS.lime;
}

export function pocketInk(color: PocketTone | string) {
  return color === "black" ? TOLS.lime : TOLS.inkOnLime;
}
