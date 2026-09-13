import { createFileRoute } from "@tanstack/react-router";
import { listBets } from "@/lib/governance/platform-desk.server";
import { platformOptions, withPlatformAuth } from "@/lib/governance/platform-http";

export const Route = createFileRoute("/api/platform/bets")({
  server: {
    handlers: {
      OPTIONS: platformOptions,
      GET: async ({ request }) =>
        withPlatformAuth(request, "bets:read", async () => {
          const url = new URL(request.url);
          return listBets({
            gameId: url.searchParams.get("gameId"),
            userId: url.searchParams.get("userId"),
            result: url.searchParams.get("result"),
            limit: Number(url.searchParams.get("limit") || 100),
          });
        }),
    },
  },
});
