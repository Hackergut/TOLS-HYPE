import { createFileRoute } from "@tanstack/react-router";
import { getUser, patchUser } from "@/lib/governance/platform-desk.server";
import { platformOptions, withPlatformAuth } from "@/lib/governance/platform-http";

export const Route = createFileRoute("/api/platform/users/$id")({
  server: {
    handlers: {
      OPTIONS: platformOptions,
      GET: async ({ request, params }) =>
        withPlatformAuth(request, "users:read", () => getUser(params.id)),
      PATCH: async ({ request, params }) =>
        withPlatformAuth(request, "users:write", async () => {
          const body = (await request.json().catch(() => ({}))) as Record<string, unknown>;
          return patchUser(params.id, body);
        }),
    },
  },
});
