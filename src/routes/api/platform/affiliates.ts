import { createFileRoute } from "@tanstack/react-router";
import { listAffiliates } from "@/lib/governance/platform-desk.server";
import { platformOptions, withPlatformAuth } from "@/lib/governance/platform-http";

export const Route = createFileRoute("/api/platform/affiliates")({
  server: {
    handlers: {
      OPTIONS: platformOptions,
      GET: async ({ request }) => withPlatformAuth(request, "affiliates:read", () => listAffiliates()),
    },
  },
});
