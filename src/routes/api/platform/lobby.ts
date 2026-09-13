import { createFileRoute } from "@tanstack/react-router";
import { patchCatalog, platformLobby } from "@/lib/governance/platform-desk.server";
import { platformOptions, withPlatformAuth } from "@/lib/governance/platform-http";

export const Route = createFileRoute("/api/platform/lobby")({
  server: {
    handlers: {
      OPTIONS: platformOptions,
      GET: async ({ request }) => withPlatformAuth(request, null, async () => platformLobby()),
      PUT: async ({ request }) =>
        withPlatformAuth(request, "cms:write", async () => {
          const body = (await request.json().catch(() => ({}))) as Record<string, unknown>;
          return patchCatalog("lobby", body);
        }),
    },
  },
});
