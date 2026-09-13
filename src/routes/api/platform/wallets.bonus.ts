import { createFileRoute } from "@tanstack/react-router";
import { adjustWallet } from "@/lib/governance/platform-desk.server";
import { platformOptions, withPlatformAuth } from "@/lib/governance/platform-http";

export const Route = createFileRoute("/api/platform/wallets/bonus")({
  server: {
    handlers: {
      OPTIONS: platformOptions,
      POST: async ({ request }) =>
        withPlatformAuth(request, "wallets:write", async () => {
          const body = (await request.json().catch(() => ({}))) as Record<string, unknown>;
          return adjustWallet(body, "bonus");
        }),
    },
  },
});
