import { createFileRoute } from "@tanstack/react-router";
import { getRtp, setRtp } from "@/lib/governance/platform-desk.server";
import { platformOptions, withPlatformAuth } from "@/lib/governance/platform-http";

export const Route = createFileRoute("/api/platform/rtp")({
  server: {
    handlers: {
      OPTIONS: platformOptions,
      GET: async ({ request }) => withPlatformAuth(request, "rtp:read", () => getRtp()),
      PUT: async ({ request }) =>
        withPlatformAuth(request, "rtp:write", async () => {
          const body = (await request.json().catch(() => ({}))) as Record<string, unknown>;
          return setRtp(body);
        }),
    },
  },
});
