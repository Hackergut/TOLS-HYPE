import { createFileRoute } from "@tanstack/react-router";
import { getUser, listUsers } from "@/lib/governance/platform-desk.server";
import { platformOptions, withPlatformAuth } from "@/lib/governance/platform-http";

export const Route = createFileRoute("/api/platform/players")({
  server: {
    handlers: {
      OPTIONS: platformOptions,
      GET: async ({ request }) =>
        withPlatformAuth(request, "users:read", async () => {
          const url = new URL(request.url);
          const userId = url.searchParams.get("userId") || url.searchParams.get("user");
          if (userId) return getUser(userId);
          return listUsers(Number(url.searchParams.get("limit") || 100));
        }),
    },
  },
});
