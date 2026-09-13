import { createFileRoute } from "@tanstack/react-router";
import { dbPing } from "@/lib/governance/db-ping.server";
import { getBridgeConfig } from "@/lib/governance/bridge";
import { platformCors, platformOptions } from "@/lib/governance/platform-http";

export const Route = createFileRoute("/api/platform/health")({
  server: {
    handlers: {
      OPTIONS: platformOptions,
      HEAD: async () => new Response(null, { status: 200, headers: platformCors }),
      GET: async () => {
        const started = Date.now();
        const cfg = getBridgeConfig();
        const dbState = await dbPing();
        return Response.json(
          {
            success: true,
            ok: true,
            platform: "tols-casino",
            service: "tols-casino-platform-bridge",
            status: dbState.ok ? "ok" : "degraded",
            timestamp: new Date().toISOString(),
            latencyMs: Date.now() - started,
            casino: { origin: cfg.casinoOrigin },
            governance: { origin: cfg.towerOrigin },
            db: dbState,
            bridge: {
              jwtConfigured: cfg.jwtReady,
              env: {
                PLATFORM_JWT_PUBLIC_KEY: cfg.jwtReady,
                PLATFORM_JWT_ISSUER: process.env.PLATFORM_JWT_ISSUER || "tols-governance",
                PLATFORM_JWT_AUDIENCE: process.env.PLATFORM_JWT_AUDIENCE || "tols-casino",
                GOVERNANCE_BRIDGE_SECRET: cfg.hasBridgeSecret,
                GOVERNANCE_TOWER_URL: true,
                APP_URL: true,
              },
            },
          },
          { status: 200, headers: platformCors },
        );
      },
    },
  },
});
