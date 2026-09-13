import { createFileRoute } from "@tanstack/react-router";
import { getBridgeConfig } from "@/lib/governance/bridge";
import { platformCors, platformOptions } from "@/lib/governance/platform-http";

export const Route = createFileRoute("/api/platform/")({
  server: {
    handlers: {
      OPTIONS: platformOptions,
      GET: async () => {
        const cfg = getBridgeConfig();
        return Response.json(
          {
            success: true,
            ok: true,
            platform: "tols-casino",
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
              "GET /api/platform/overview",
              "GET /api/platform/snapshot",
              "GET /api/platform/cashflow",
              "GET /api/platform/deposits",
              "GET /api/platform/withdrawals",
              "POST /api/platform/withdrawals/:id/approve",
              "POST /api/platform/withdrawals/:id/reject",
              "GET /api/platform/payments",
              "GET /api/platform/stats",
              "GET /api/platform/wallets",
              "POST /api/platform/wallets/adjust",
              "POST /api/platform/wallets/bonus",
              "GET /api/platform/users",
              "GET /api/platform/users/:id",
              "PATCH /api/platform/users/:id",
              "GET /api/platform/live-map",
              "GET /api/platform/bets",
              "GET /api/platform/rtp",
              "PUT /api/platform/rtp",
              "GET /api/platform/promotions",
              "PUT /api/platform/promotions",
              "GET /api/platform/affiliates",
              "GET /api/platform/games",
              "GET /api/platform/lobby",
              "GET /api/platform/categories",
              "POST /api/bridge/webhook",
            ],
          },
          { headers: platformCors },
        );
      },
    },
  },
});
