import { createFileRoute } from "@tanstack/react-router";
import { getPromotions, setPromotion } from "@/lib/governance/platform-desk.server";
import { platformOptions, withPlatformAuth } from "@/lib/governance/platform-http";

export const Route = createFileRoute("/api/platform/promotions")({
  server: {
    handlers: {
      OPTIONS: platformOptions,
      GET: async ({ request }) => withPlatformAuth(request, "promotions:read", () => getPromotions()),
      PUT: async ({ request }) =>
        withPlatformAuth(request, "promotions:write", async () => {
          const body = (await request.json().catch(() => ({}))) as Record<string, unknown>;
          return setPromotion(body);
        }),
    },
  },
});
