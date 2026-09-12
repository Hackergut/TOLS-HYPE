import { Link } from "@tanstack/react-router";
import { cn } from "cn";

/** Official TOLS T — same file as the lockup. */
export function TolsT({ className }: { className?: string }) {
  return (
    <img
      src="/brand/tols-t.png"
      alt=""
      className={cn("size-8 object-contain", className)}
    />
  );
}

export function OriginalsIcon({ className }: { className?: string }) {
  return <TolsT className={className} />;
}

/** Official lockup. */
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
