import { cn } from "cn";

/** TT Bluescreens display: Tektur stack + stretched O like the TOLS wordmark. */
export function BluescreenTitle({
  text,
  className,
}: {
  text: string;
  className?: string;
}) {
  return (
    <span className={cn("font-bluescreens uppercase tracking-[0.08em]", className)}>
      {Array.from(text).map((ch, i) =>
        ch === "O" || ch === "o" ? (
          <span key={`${ch}-${i}`} className="inline-block origin-center scale-x-[1.42]">
            {ch}
          </span>
        ) : (
          <span key={`${ch}-${i}`}>{ch}</span>
        ),
      )}
    </span>
  );
}
