import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { authMiddleware } from "@/lib/auth/middleware";
import type { LaunchResponse, RemoteGame } from "@/lib/operator/types";

export const listRemoteGames = createServerFn({ method: "GET" }).handler(async (): Promise<RemoteGame[]> => {
  const { resolveAdapter } = await import("@/lib/operator/registry");
  return await resolveAdapter().listGames();
});

export const launchRemoteGame = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator(z.object({ gameId: z.string(), currency: z.string() }))
  .handler(async ({ context, data }): Promise<LaunchResponse> => {
    const { resolveAdapter } = await import("@/lib/operator/registry");
    const adapter = resolveAdapter();
    try {
      return await adapter.launch({
        gameId: data.gameId,
        userId: context.userId,
        email: context.email,
        currency: data.currency,
      });
    } catch (err) {
      return { error: err instanceof Error ? err.message : "Launch failed" };
    }
  });

/**
 * Integration readiness probe — one call shows which external connections
 * are configured. Booleans only, no secrets. Powers the ops checklist
 * (docs/ANALISI-CONNESSIONI.md §4). Field `supabase` is legacy: it only
 * ever meant "some SQL/REST base URL is set".
 */
export const operatorStatus = createServerFn({ method: "GET" }).handler(async () => {
  const { operatorServer } = await import("@/lib/operator/env.server");
  const { flexrixConfigured } = await import("@/lib/operator/flexrix-sign");
  const { governanceHealth } = await import("@/lib/operator/governance");
  const { ssoConfigured } = await import("@/lib/operator/sso");
  const { sportsConfigured } = await import("@/lib/operator/sportsbook.server");
  const { treasuryAddresses } = await import("@/lib/treasury.server");
  const { pushConfigured } = await import("@/lib/notifications/push.server");
  const { googleEnabled } = await import("@/lib/auth/google-oauth");
  const cfg = operatorServer();
  const gov = await governanceHealth().catch(() => ({ ok: false as const }));
  return {
    ok: true,
    aggregator: cfg.aggregatorKind,
    casinoOrigin: cfg.casinoOrigin,
    db: cfg.databaseUrl ? "neon" : "pglite",
    flexrix: flexrixConfigured(),
    sports: sportsConfigured(),
    sso: ssoConfigured(),
    governance: Boolean(gov.ok),
    governanceUrl: cfg.governanceUrl,
    bridgeSecret: Boolean(cfg.governanceKey),
    webhookSecret: Boolean(cfg.webhookSecret),
    treasury: Boolean(treasuryAddresses().SOL),
    vapid: pushConfigured(),
    google: googleEnabled(),
    payments: "local-wallet",
    supabase: Boolean(cfg.databaseUrl || cfg.supabaseUrl),
  };
});
