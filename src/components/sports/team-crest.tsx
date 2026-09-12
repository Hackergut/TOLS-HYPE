import { clubCrest } from "@/lib/club-crests";
import { cn } from "cn";

export function TeamCrest({
  name,
  abbr,
  className,
}: {
  name: string;
  abbr: string;
  className?: string;
}) {
  const src = clubCrest(name);
  if (src) {
    return (
      <img
        src={src}
        alt=""
        className={cn("size-7 shrink-0 object-contain sm:size-8", className)}
        loading="lazy"
        decoding="async"
      />
    );
  }
  return (
    <span
      className={cn(
        "grid size-7 shrink-0 place-items-center rounded-md bg-muted font-heading text-[0.6rem] font-semibold tracking-wide text-lime sm:size-8",
        className,
      )}
    >
      {abbr}
    </span>
  );
}
