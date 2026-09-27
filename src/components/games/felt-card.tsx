import { TolsT } from "@/components/brand/tols-mark";
import type { PlayingCard } from "@/lib/rng";

const HILO_FACES = ["A", "2", "3", "4", "5", "6", "7", "8", "9", "10", "J", "Q", "K"];

export function FeltCard({
  rank,
  suit,
  hidden,
  size = "md",
  stripe,
  brand,
}: {
  rank?: string | number;
  suit?: string;
  hidden?: boolean;
  size?: "xs" | "sm" | "md" | "lg" | "xl";
  stripe?: boolean;
  brand?: boolean;
}) {
  const dim =
    size === "xl"
      ? "h-[250px] w-[167px]"
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
        className={`relative flex ${dim} items-center justify-center overflow-hidden rounded-md border border-white bg-[linear-gradient(124deg,#904BF9_50%,#680cec_50%)] shadow-[0_2px_3px_rgb(0_0_0/0.25)]`}
      >
        <TolsT className={size === "xs" ? "size-5 text-white" : "size-12 text-white"} />
      </div>
    );
  }
  const face = typeof rank === "number" ? (HILO_FACES[rank - 1] ?? String(rank)) : rank;
  const red = suit === "♥" || suit === "♦";
  const ink = brand ? (red ? "text-purple" : "text-zinc-900") : red ? "text-destructive" : "text-zinc-900";
  const faceSize = size === "xl" ? "text-[86px] leading-none" : size === "xs" ? "text-sm" : "text-2xl";
  return (
    <div
      className={`relative flex ${dim} flex-col items-center justify-center gap-3 overflow-hidden rounded-md bg-white shadow-[0_2px_3px_rgb(0_0_0/0.25)] ${
        size === "xs" ? "p-1" : "p-2.5"
      } ${ink}`}
    >
      <p className={`font-heading font-bold tabular-nums ${faceSize}`}>{face}</p>
      <p className={size === "xl" ? "text-4xl" : size === "xs" ? "text-xs" : "text-lg"}>{suit}</p>
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
