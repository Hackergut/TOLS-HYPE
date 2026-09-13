import { googleEnabled } from "@/lib/auth/google-oauth";
import { pushConfigured } from "@/lib/notifications/push.server";
import { operatorServer } from "@/lib/operator/env.server";
import { flexrixConfigured } from "@/lib/operator/flexrix-sign";
import { governanceHealth } from "@/lib/operator/governance";
import { ssoConfigured } from "@/lib/operator/sso";
import { sportsConfigured } from "@/lib/operator/sportsbook.server";
import { oddsApiStatus } from "@/lib/sports/odds-api.server";
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
  const gov = await governanceHealth().catch(() => ({ ok: false as const }));
  const odds = oddsApiStatus();
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
    /** The Odds API v4 (real sportsboard odds). Counters, never the key. */
    odds: odds.configured,
    oddsQuotaRemaining: odds.remaining,
    oddsCostPerRefresh: odds.costPerRefresh,
    payments: "local-wallet",
    supabase: Boolean(cfg.databaseUrl || cfg.supabaseUrl),
  };
}

export type OperatorStatus = Awaited<ReturnType<typeof getOperatorStatus>>;
