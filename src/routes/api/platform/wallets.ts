import { createFileRoute } from "@tanstack/react-router";
import { listWallets } from "@/lib/governance/platform-desk.server";
import { platformOptions, withPlatformAuth } from "@/lib/governance/platform-http";

export const Route = createFileRoute("/api/platform/wallets")({
  server: {
    handlers: {
      OPTIONS: platformOptions,
      GET: async ({ request }) =>
        withPlatformAuth(request, "wallets:read", async () => {
          const url = new URL(request.url);
          return listWallets(Number(url.searchParams.get("limit") || 100));
        }),
    },
  },
});
