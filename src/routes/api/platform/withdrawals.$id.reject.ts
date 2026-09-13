import { createFileRoute } from "@tanstack/react-router";
import { rejectWithdrawal } from "@/lib/governance/platform-desk.server";
import { platformOptions, withPlatformAuth } from "@/lib/governance/platform-http";

export const Route = createFileRoute("/api/platform/withdrawals/$id/reject")({
  server: {
    handlers: {
      OPTIONS: platformOptions,
      POST: async ({ request, params }) =>
        withPlatformAuth(request, "withdrawals:approve", async () => {
          const body = (await request.json().catch(() => null)) as { reason?: string } | null;
          return rejectWithdrawal(params.id, body?.reason);
        }),
    },
  },
});
