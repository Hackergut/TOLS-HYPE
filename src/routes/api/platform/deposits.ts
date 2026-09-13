import { createFileRoute } from "@tanstack/react-router";
import { listDeposits } from "@/lib/governance/platform-desk.server";
import { platformOptions, withPlatformAuth } from "@/lib/governance/platform-http";

export const Route = createFileRoute("/api/platform/deposits")({
  server: {
    handlers: {
      OPTIONS: platformOptions,
      GET: async ({ request }) =>
        withPlatformAuth(request, "deposits:read", async () => {
          const url = new URL(request.url);
          return listDeposits(url.searchParams.get("status"), Number(url.searchParams.get("limit") || 100));
        }),
    },
  },
});
