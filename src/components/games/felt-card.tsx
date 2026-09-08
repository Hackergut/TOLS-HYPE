import { TolsT } from "@/components/brand/tols-mark";
import type { PlayingCard } from "@/lib/rng";

const HILO_FACES = ["A", "2", "3", "4", "5", "6", "7", "8", "9", "10", "J", "Q", "K"];

export function FeltCard({
  rank,
  suit,
  hidden,
  size = "md",
  stripe,
}: {
  rank?: string | number;
  suit?: string;
  hidden?: boolean;
  size?: "sm" | "md" | "lg";
  stripe?: boolean;
}) {
  const dim =
    size === "lg"
      ? "h-44 w-32 md:h-52 md:w-36"
      : size === "sm"
        ? "h-20 w-14"
        : "h-28 w-20";
  if (hidden) {
    return (
      <div
        className={`relative flex ${dim} items-center justify-center overflow-hidden rounded-xl bg-muted ring-1 ring-border`}
      >
        <TolsT className="size-10" />
        <span className="absolute inset-x-0 bottom-0 h-1.5 bg-lime" />
      </div>
    );
  }
  const face = typeof rank === "number" ? (HILO_FACES[rank - 1] ?? String(rank)) : rank;
  const red = suit === "♥" || suit === "♦";
  return (
    <div
      className={`relative flex ${dim} flex-col justify-between overflow-hidden rounded-xl bg-white p-2.5 shadow-lg ${
        red ? "text-destructive" : "text-zinc-900"
      }`}
    >
      <div>
        <p className="font-heading text-2xl leading-none font-bold">{face}</p>
        <p className="text-lg leading-none">{suit}</p>
      </div>
      <p className="self-end text-3xl">{suit}</p>
      {stripe ? <span className="absolute inset-x-0 bottom-0 h-1.5 bg-lime" /> : null}
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
  size?: "sm" | "md" | "lg";
  stripe?: boolean;
}) {
  if (hidden || !card) return <FeltCard hidden size={size} stripe={stripe} />;
  return <FeltCard rank={card.rank} suit={card.suit} size={size} stripe={stripe} />;
}
