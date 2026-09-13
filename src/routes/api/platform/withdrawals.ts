import { createFileRoute } from "@tanstack/react-router";
import { listWithdrawals } from "@/lib/governance/platform-desk.server";
import { platformOptions, withPlatformAuth } from "@/lib/governance/platform-http";

export const Route = createFileRoute("/api/platform/withdrawals")({
  server: {
    handlers: {
      OPTIONS: platformOptions,
      GET: async ({ request }) =>
        withPlatformAuth(request, "withdrawals:read", async () => {
          const url = new URL(request.url);
          return listWithdrawals(url.searchParams.get("status"), Number(url.searchParams.get("limit") || 100));
        }),
    },
  },
});
