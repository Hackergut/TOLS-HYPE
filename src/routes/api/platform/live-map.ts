import { createFileRoute } from "@tanstack/react-router";
import { liveMap } from "@/lib/governance/platform-desk.server";
import { platformOptions, withPlatformAuth } from "@/lib/governance/platform-http";

export const Route = createFileRoute("/api/platform/live-map")({
  server: {
    handlers: {
      OPTIONS: platformOptions,
      GET: async ({ request }) => withPlatformAuth(request, "users:read", () => liveMap()),
    },
  },
});
