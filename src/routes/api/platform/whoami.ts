import { createFileRoute } from "@tanstack/react-router";
import { scopesOf } from "@/lib/governance/platform-jwt";
import { platformOptions, withPlatformAuth } from "@/lib/governance/platform-http";

export const Route = createFileRoute("/api/platform/whoami")({
  server: {
    handlers: {
      OPTIONS: platformOptions,
      GET: async ({ request }) =>
        withPlatformAuth(request, null, async (claims) => ({
          authenticated: true,
          iss: claims.iss,
          aud: claims.aud,
          sub: claims.sub,
          scope: scopesOf(claims),
          service: "tols-casino",
          note: "JWT valid — Tower is authenticated.",
        })),
    },
  },
});
