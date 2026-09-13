import { createFileRoute } from "@tanstack/react-router";
import { paymentSummary } from "@/lib/governance/platform-desk.server";
import { platformOptions, withPlatformAuth } from "@/lib/governance/platform-http";

export const Route = createFileRoute("/api/platform/payments")({
  server: {
    handlers: {
      OPTIONS: platformOptions,
      GET: async ({ request }) => withPlatformAuth(request, "payments:read", () => paymentSummary()),
    },
  },
});
