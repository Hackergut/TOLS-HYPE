import { createFileRoute } from "@tanstack/react-router";
import { casinoStats } from "@/lib/governance/platform-desk.server";
import { platformOptions, withPlatformAuth } from "@/lib/governance/platform-http";

export const Route = createFileRoute("/api/platform/stats")({
  server: {
    handlers: {
      OPTIONS: platformOptions,
      GET: async ({ request }) => withPlatformAuth(request, null, () => casinoStats()),
    },
  },
});
