import { createFileRoute } from "@tanstack/react-router";
import { getBridgeConfig } from "@/lib/governance/bridge";

export const Route = createFileRoute("/api/platform")({
  server: {
    handlers: {
      GET: async () => {
        const cfg = getBridgeConfig();
        return Response.json({
          success: true,
          service: "tols-casino",
          casino: cfg.casinoOrigin,
          governance: cfg.towerOrigin,
          auth: {
            jwt: "Authorization: Bearer <RS256 JWT iss=tols-governance aud=tols-casino>",
            webhook: "POST /api/bridge/webhook with X-Bridge-Signature + X-Bridge-Timestamp",
          },
          endpoints: [
            "GET /api/platform/health",
            "GET /api/platform/whoami",
            "GET /api/bridge/health",
            "POST /api/bridge/webhook",
            "GET /api/treasury",
            "POST /api/flexrix/callback",
          ],
        });
      },
    },
  },
});
