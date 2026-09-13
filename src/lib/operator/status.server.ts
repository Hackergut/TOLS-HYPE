import { googleEnabled } from "@/lib/auth/google-oauth";
import { getBridgeConfig } from "@/lib/governance/bridge";
import { pushConfigured } from "@/lib/notifications/push.server";
import { operatorServer } from "@/lib/operator/env.server";
import { flexrixConfigured } from "@/lib/operator/flexrix-sign";
import { governanceHealth } from "@/lib/operator/governance";
import { ssoConfigured } from "@/lib/operator/sso";
import { sportsConfigured } from "@/lib/operator/sportsbook.server";
import { treasuryAddresses } from "@/lib/treasury.server";

/**
 * Integration readiness probe — one call shows which external connections
 * are configured. Booleans only, no secrets. Shared by the `operatorStatus`
 * serverFn and `GET /api/operator/status` (ops monitoring).
 * Powers the ops checklist (docs/ANALISI-CONNESSIONI.md §4).
 * Field `supabase` is legacy: it only ever meant "some SQL/REST base URL
 * is set" (see backendLabel in config.ts).
 */
export async function getOperatorStatus() {
  const cfg = operatorServer();
  const bridge = getBridgeConfig();
  const gov = await governanceHealth().catch(() => ({ ok: false as const }));
  return {
    ok: true,
    aggregator: cfg.aggregatorKind,
    casinoOrigin: cfg.casinoOrigin,
    sportsCallback: `${cfg.casinoOrigin}/api/sportsbook/callback`,
    db: cfg.databaseUrl ? "neon" : "pglite",
    flexrix: flexrixConfigured(),
    sports: sportsConfigured(),
    sso: ssoConfigured(),
    governance: Boolean(gov.ok && bridge.hasBridgeSecret),
    governanceUrl: cfg.governanceUrl,
    bridgeSecret: bridge.hasBridgeSecret,
    webhookSecret: Boolean(cfg.webhookSecret),
    treasury: Boolean(treasuryAddresses().SOL),
    vapid: pushConfigured(),
    google: googleEnabled(),
    payments: "local-wallet",
    supabase: Boolean(cfg.databaseUrl || cfg.supabaseUrl),
  };
}

export type OperatorStatus = Awaited<ReturnType<typeof getOperatorStatus>>;
