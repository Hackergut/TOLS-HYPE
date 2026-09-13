import { createFileRoute } from "@tanstack/react-router";
import { getBridgeConfig } from "@/lib/governance/bridge";
import { inspectPlatformAuth, PLATFORM_CORS, scopesOf } from "@/lib/governance/platform-jwt";
import { platformOptions } from "@/lib/governance/platform-http";

export const Route = createFileRoute("/api/platform/whoami")({
  server: {
    handlers: {
      OPTIONS: platformOptions,
      GET: async ({ request }) => {
        const cfg = getBridgeConfig();
        const inspected = inspectPlatformAuth(request);
        const payload = {
          authenticated: Boolean(inspected.claims),
          auth: inspected.via ?? "none",
          jwt: { valid: inspected.jwt.valid, error: inspected.jwt.error ?? null },
          hmac: { valid: inspected.hmac, present: inspected.hmacPresent },
          iss: inspected.claims?.iss ?? null,
          aud: inspected.claims?.aud ?? null,
          sub: inspected.claims?.sub ?? null,
          scope: inspected.claims ? scopesOf(inspected.claims) : [],
          origin: cfg.casinoOrigin,
          governance: cfg.towerOrigin,
          service: "tols-casino",
          note: inspected.via
            ? inspected.via === "jwt"
              ? "JWT valid — Tower is authenticated."
              : "HMAC valid — Tower is authenticated (JWT fallback)."
            : "Send RS256 JWT (iss=tols-governance aud=tols-casino) or X-Bridge-Signature + X-Bridge-Timestamp.",
        };
        if (!inspected.claims) {
          return Response.json(
            { success: false, error: inspected.jwt.error || "Unauthorized", data: payload },
            { status: 401, headers: PLATFORM_CORS },
          );
        }
        return Response.json({ success: true, data: payload }, { status: 200, headers: PLATFORM_CORS });
      },
    },
  },
});
