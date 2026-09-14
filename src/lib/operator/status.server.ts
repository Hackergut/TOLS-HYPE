import { env } from "@/lib/env.server";
import { googleEnabled } from "@/lib/auth/google-oauth";
import { gateIdentityEnabled } from "@/lib/auth/gate-identity.server";
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
  // Prod sign-in works via native Google OAuth or custom Grok-broker creds;
  // the baked preview client only completes callbacks on *.grok-sandbox.com,
  // so a deployed casino without either would strand visitors at sign-in.
  const brokerCustom = Boolean(env("GROK_AUTH_CLIENT_ID") && env("GROK_AUTH_CLIENT_SECRET"));
  const google = googleEnabled();
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
    google,
    auth: {
      enabled: gateIdentityEnabled(),
      google,
      brokerCustom,
      // True when sign-in federation would fall back to the baked preview
      // client — real operation on tols.fun needs google or brokerCustom.
      brokerPreviewFallback: !brokerCustom,
      prodReady: google || brokerCustom,
    },
    payments: "local-wallet",
    supabase: Boolean(cfg.databaseUrl || cfg.supabaseUrl),
  };
}

export type OperatorStatus = Awaited<ReturnType<typeof getOperatorStatus>>;
