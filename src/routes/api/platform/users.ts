import { createFileRoute } from "@tanstack/react-router";
import { listUsers } from "@/lib/governance/platform-desk.server";
import { platformOptions, withPlatformAuth } from "@/lib/governance/platform-http";

export const Route = createFileRoute("/api/platform/users")({
  server: {
    handlers: {
      OPTIONS: platformOptions,
      GET: async ({ request }) =>
        withPlatformAuth(request, "users:read", async () => {
          const url = new URL(request.url);
          return listUsers(Number(url.searchParams.get("limit") || 100));
        }),
    },
  },
});
