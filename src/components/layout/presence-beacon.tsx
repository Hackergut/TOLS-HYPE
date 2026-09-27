import { useEffect } from "react";
import { useRouterState } from "@tanstack/react-router";
import { useCurrentUserState } from "@/lib/auth/use-current-user";
import { pulsePresence } from "@/lib/governance/presence";

function placeFromPath(path: string): { place: "lobby" | "game" | "keep"; gameId?: string } {
  const match = path.match(/^\/(?:games|play)\/([^/?#]+)/);
  if (match?.[1]) return { place: "game", gameId: decodeURIComponent(match[1]) };
  if (path === "/" || path.startsWith("/lobby")) return { place: "lobby" };
  return { place: "keep" };
}

/** While the signed-in player has tols.fun open, refresh presence so governance sees them at once. */
export function PresenceBeacon() {
  const { user, isPending } = useCurrentUserState();
  const path = useRouterState({ select: (state) => state.location.pathname });

  useEffect(() => {
    if (isPending || !user || user.isDevFallback) return;
    const device = window.matchMedia("(max-width: 767px)").matches ? "mobile" : "desktop";
    const send = () => {
      const where = placeFromPath(path);
      void pulsePresence({ data: { place: where.place, gameId: where.gameId, device } }).catch(() => undefined);
    };
    send();
    const timer = window.setInterval(send, 8_000);
    const onVisible = () => {
      if (document.visibilityState === "visible") send();
    };
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      window.clearInterval(timer);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [isPending, path, user]);

  return null;
}
