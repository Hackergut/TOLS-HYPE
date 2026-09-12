import { createFileRoute } from "@tanstack/react-router";
import { dbPing } from "@/lib/governance/db-ping.server";
import { getBridgeConfig, probeGovernanceHealth, pushBridgeEvent } from "@/lib/governance/bridge";

export const Route = createFileRoute("/api/bridge/health")({
  server: {
    handlers: {
      OPTIONS: async () =>
        new Response(null, {
          status: 204,
          headers: {
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Methods": "GET,HEAD,OPTIONS",
            "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Bridge-Signature",
          },
        }),
      HEAD: async () => new Response(null, { status: 200, headers: { "Cache-Control": "no-store" } }),
      GET: async ({ request }) => {
        const started = Date.now();
        const cfg = getBridgeConfig();
        const url = new URL(request.url);
        const probeTower = url.searchParams.get("probe") !== "false";
        const heartbeat = url.searchParams.get("heartbeat") === "1";
        const dbState = await dbPing();
        const tower = probeTower ? await probeGovernanceHealth(4000) : { reachable: null as boolean | null };
        const live = Boolean(dbState.ok && tower.reachable && cfg.hasBridgeSecret);
        if (heartbeat && tower.reachable) {
          void pushBridgeEvent("casino.health", {
            casinoOrigin: cfg.casinoOrigin,
            db: dbState.ok,
          }).catch(() => undefined);
        }
        const body = {
          ok: dbState.ok,
          service: "tols-casino-bridge",
          timestamp: new Date().toISOString(),
          latencyMs: Date.now() - started,
          casino: { origin: cfg.casinoOrigin },
          tower: { origin: cfg.towerOrigin, apiBase: cfg.towerApiBase, ...tower },
          link: {
            live,
            status: live ? "live" : tower.reachable ? "degraded" : "offline",
            source: "environment",
            secretReady: cfg.hasBridgeSecret,
            jwtReady: cfg.jwtReady,
          },
          bridge: {
            configured: cfg.hasBridgeSecret,
            source: "environment",
            envPresent: {
              GOVERNANCE_TOWER_URL: Boolean(process.env.GOVERNANCE_TOWER_URL),
              APP_URL: Boolean(process.env.APP_URL),
              GOVERNANCE_BRIDGE_SECRET: cfg.hasBridgeSecret,
              PLATFORM_JWT_PUBLIC_KEY: cfg.jwtReady,
            },
          },
          db: dbState,
        };
        return Response.json(body, {
          status: dbState.ok ? 200 : 503,
          headers: { "Cache-Control": "no-store" },
        });
      },
    },
  },
});
