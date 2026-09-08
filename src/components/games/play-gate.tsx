import { Link } from "@tanstack/react-router";
import { useEffect, useState, type ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { useCurrentUserState } from "@/lib/auth/use-current-user";
import { isSelfExcluded, loadResponsible } from "@/lib/responsible";

export function PlayGate({ children }: { children: ReactNode }) {
  const { user, isPending } = useCurrentUserState();
  const [excludedUntil, setExcludedUntil] = useState<number | null>(null);

  useEffect(() => {
    const s = loadResponsible();
    setExcludedUntil(isSelfExcluded(s) ? s.excludedUntil : null);
  }, []);

  if (isPending) return <div className="h-72 animate-pulse rounded-2xl bg-muted" />;
  if (!user) {
    return (
      <div className="rounded-2xl bg-card p-8 text-center shadow-[var(--shadow-border)]">
        <p className="font-heading text-lg font-semibold">Sign in to take a seat</p>
        <p className="mt-1 text-sm text-muted-foreground">
          Play-money balances mint on first visit.
        </p>
        <Button asChild className="mt-6 h-11">
          <Link to="/login">Sign in</Link>
        </Button>
      </div>
    );
  }
  if (excludedUntil) {
    return (
      <div className="rounded-2xl bg-card p-8 text-center shadow-[var(--shadow-border)]">
        <p className="font-heading text-lg font-semibold">Self-excluded</p>
        <p className="mt-1 text-sm text-muted-foreground">
          Play is blocked until {new Date(excludedUntil).toLocaleString()}.
        </p>
        <Button asChild variant="outline" className="mt-6 h-11">
          <Link to="/responsible">Game Responsibly</Link>
        </Button>
      </div>
    );
  }
  return <>{children}</>;
}
