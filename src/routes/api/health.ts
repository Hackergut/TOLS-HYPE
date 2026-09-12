import { createFileRoute } from "@tanstack/react-router";
import { dbPing } from "@/lib/governance/db-ping.server";
import { getBridgeConfig } from "@/lib/governance/bridge";

export const Route = createFileRoute("/api/health")({
  server: {
    handlers: {
      GET: async () => {
        const cfg = getBridgeConfig();
        const dbState = await dbPing();
        return Response.json({
          ok: dbState.ok,
          service: "tols-hype",
          casino: cfg.casinoOrigin,
          governance: cfg.towerOrigin,
          db: dbState,
          ts: new Date().toISOString(),
        });
      },
    },
  },
});
