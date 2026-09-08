import { Link } from "@tanstack/react-router";
import { cn } from "cn";

/** Hollow lime T from the official mark. */
export function TolsT({ className }: { className?: string }) {
  return (
    <img
      src="/brand/tols-t.png"
      alt=""
      className={cn("size-8 object-contain", className)}
    />
  );
}

/** Lime-outline TOLS wordmark from the official lockup. */
export function TolsWordmark({ className }: { className?: string }) {
  return (
    <img
      src="/brand/tols-wordmark.png"
      alt=""
      className={cn("h-7 w-auto object-contain object-left", className)}
    />
  );
}

export function TolsMark({
  className,
  compact = false,
  large = false,
}: {
  className?: string;
  compact?: boolean;
  large?: boolean;
}) {
  return (
    <Link to="/" className={cn("inline-flex items-center", className)} aria-label="TOLS home">
      {compact ? (
        <TolsT className="size-8" />
      ) : (
        <TolsWordmark className={large ? "h-9 w-auto sm:h-10" : "h-6 w-auto sm:h-7"} />
      )}
    </Link>
  );
}
