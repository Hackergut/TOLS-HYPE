import { createFileRoute } from "@tanstack/react-router";
import { approveWithdrawal } from "@/lib/governance/platform-desk.server";
import { platformOptions, withPlatformAuth } from "@/lib/governance/platform-http";

export const Route = createFileRoute("/api/platform/withdrawals/$id/approve")({
  server: {
    handlers: {
      OPTIONS: platformOptions,
      POST: async ({ request, params }) =>
        withPlatformAuth(request, "withdrawals:approve", async () => {
          const body = (await request.json().catch(() => null)) as { txHash?: string } | null;
          return approveWithdrawal(params.id, body?.txHash);
        }),
    },
  },
});
