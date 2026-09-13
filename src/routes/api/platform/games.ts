import { createFileRoute } from "@tanstack/react-router";
import { patchCatalog, platformGames } from "@/lib/governance/platform-desk.server";
import { platformOptions, withPlatformAuth } from "@/lib/governance/platform-http";

export const Route = createFileRoute("/api/platform/games")({
  server: {
    handlers: {
      OPTIONS: platformOptions,
      GET: async ({ request }) => withPlatformAuth(request, null, async () => platformGames()),
      PUT: async ({ request }) =>
        withPlatformAuth(request, "cms:write", async () => {
          const body = (await request.json().catch(() => ({}))) as Record<string, unknown>;
          return patchCatalog("games", body);
        }),
      PATCH: async ({ request }) =>
        withPlatformAuth(request, "cms:write", async () => {
          const body = (await request.json().catch(() => ({}))) as Record<string, unknown>;
          return patchCatalog("games", body);
        }),
    },
  },
});
