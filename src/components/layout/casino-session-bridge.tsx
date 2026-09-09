import { useEffect } from "react";
import { useCurrentUserState } from "@/lib/auth/use-current-user";
import { syncCasinoSession } from "@/lib/operator/sso-client";

/** After Better Auth resolves a real user, mint the Next casino session once. */
export function CasinoSessionBridge() {
  const { user, isPending } = useCurrentUserState();

  useEffect(() => {
    if (isPending || !user || user.isDevFallback) return;
    void syncCasinoSession().catch(() => undefined);
  }, [isPending, user?.id, user?.isDevFallback]);

  return null;
}
