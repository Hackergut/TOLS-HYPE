import { createFileRoute } from "@tanstack/react-router";
import { casinoSnapshot } from "@/lib/governance/platform-desk.server";
import { platformOptions, withPlatformAuth } from "@/lib/governance/platform-http";

export const Route = createFileRoute("/api/platform/overview")({
  server: {
    handlers: {
      OPTIONS: platformOptions,
      GET: async ({ request }) => withPlatformAuth(request, null, () => casinoSnapshot()),
    },
  },
});
