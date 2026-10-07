import type { PlayingCard } from "@/lib/rng";
import { cn } from "cn";

const HILO_FACES = ["A", "2", "3", "4", "5", "6", "7", "8", "9", "10", "J", "Q", "K"];

export function FeltCard({
  rank,
  suit,
  hidden,
  size = "md",
  stripe,
  brand,
  fluid,
}: {
  rank?: string | number;
  suit?: string;
  hidden?: boolean;
  size?: "xs" | "sm" | "md" | "lg" | "xl";
  stripe?: boolean;
  brand?: boolean;
  /** Fill the parent box. Text scales with the card. */
  fluid?: boolean;
}) {
  const dim = fluid
    ? "h-full w-full"
    : size === "xl"
      ? "h-full w-full"
      : size === "lg"
        ? "h-44 w-32 md:h-52 md:w-36"
        : size === "sm"
          ? "h-20 w-14"
          : size === "xs"
            ? "h-12 w-9"
            : "h-28 w-20";
  if (hidden) {
    return (
      <div
        className={cn(
          "relative flex items-center justify-center overflow-hidden rounded-lg border border-[#c9fff8] bg-[linear-gradient(128deg,#5dfff3_50%,#1ad4c8_50%)] shadow-[0_8px_16px_rgb(0_0_0/0.28)]",
          dim,
        )}
      >
        <img src="/brand/tols-t.png" alt="" className="h-[54%] w-auto object-contain" />
      </div>
    );
  }
  const face = typeof rank === "number" ? (HILO_FACES[rank - 1] ?? String(rank)) : rank;
  const red = suit === "♥" || suit === "♦";
  const ink = brand ? (red ? "text-purple" : "text-zinc-900") : red ? "text-destructive" : "text-zinc-900";
  const faceSize =
    fluid || size === "xl"
      ? "text-[clamp(1.35rem,42cqw,5.375rem)] leading-none"
      : size === "xs"
        ? "text-sm"
        : "text-2xl";
  const suitSize = fluid || size === "xl" ? "text-[clamp(0.85rem,22cqw,2.25rem)]" : size === "xs" ? "text-xs" : "text-lg";
  return (
    <div
      className={cn(
        "relative flex flex-col items-center justify-center gap-[8%] overflow-hidden rounded-md bg-white shadow-[0_2px_3px_rgb(0_0_0/0.25)] @container",
        size === "xs" ? "p-1" : "p-[6%]",
        dim,
        ink,
      )}
    >
      <p className={cn("font-heading font-bold tabular-nums", faceSize)}>{face}</p>
      <p className={suitSize}>{suit}</p>
      {stripe ? <span className="absolute inset-x-0 bottom-0 h-1 bg-lime" /> : null}
    </div>
  );
}

export function FeltFromPlaying({
  card,
  hidden,
  size,
  stripe,
}: {
  card?: PlayingCard;
  hidden?: boolean;
  size?: "xs" | "sm" | "md" | "lg" | "xl";
  stripe?: boolean;
}) {
  if (hidden || !card) return <FeltCard hidden size={size} stripe={stripe} />;
  return <FeltCard rank={card.rank} suit={card.suit} size={size} stripe={stripe} />;
}