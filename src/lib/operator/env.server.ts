import { env } from "@/lib/env.server";
import type { OperatorBackend } from "@/lib/operator/config";
import type { AggregatorKind } from "@/lib/operator/adapter";

export function operatorServer() {
  const backend = (env("OPERATOR_BACKEND") ?? env("VITE_OPERATOR_BACKEND") ?? "local") as OperatorBackend;
  const aggregatorKind = (env("AGGREGATOR_KIND") ?? env("VITE_AGGREGATOR_KIND") ?? "flexrix") as AggregatorKind;
  return {
    backend,
    aggregatorKind,
    databaseUrl: env("DATABASE_URL") ?? env("PRISMA_DATABASE_URL"),
    supabaseUrl: env("SUPABASE_URL") ?? env("VITE_SUPABASE_URL"),
    supabaseKey: env("SUPABASE_SERVICE_ROLE_KEY") ?? env("SUPABASE_ANON_KEY"),
    governanceUrl: (
      env("GOVERNANCE_TOWER_URL") ??
      env("GOVERNANCE_URL") ??
      env("VITE_GOVERNANCE_URL") ??
      "https://gov.tols.fun"
    ).replace(/\/$/, ""),
    /** Shared HMAC with Next + Tower. Alias SKIN_SSO_SECRET for player SSO. */
    governanceKey:
      env("SKIN_SSO_SECRET") ?? env("GOVERNANCE_BRIDGE_SECRET") ?? env("GOVERNANCE_API_KEY") ?? env("GOVERNANCE_WEBHOOK_SECRET"),
    aggregatorUrl: env("AGGREGATOR_URL") ?? env("VITE_AGGREGATOR_URL"),
    aggregatorKey: env("AGGREGATOR_API_KEY"),
    aggregatorOperatorId: env("AGGREGATOR_OPERATOR_ID"),
    webhookSecret: env("OPERATOR_WEBHOOK_SECRET") ?? env("VENDOR_CALLBACK_SECRET"),
    legacyGameMap: env("LEGACY_GAME_MAP"),
    /** This skin's public origin (not tols-casino-next). */
    casinoOrigin: (env("CASINO_ORIGIN") ?? env("APP_URL") ?? "https://www.tols.fun").replace(/\/$/, ""),
    flexrixBase: env("FLEXRIX_API_BASE") ?? "https://api.upaflex.online",
    flexrixKey: env("FLEXRIX_MERCHANT_KEY"),
    flexrixSecret: env("FLEXRIX_API_SECRET"),
    evBase: env("EV_API_BASE") ?? "https://api.staging.betkraft.co.uk",
    evKey: env("EV_API_KEY"),
    evAppKey: env("EV_APP_KEY"),
    jwtPublic: env("PLATFORM_JWT_PUBLIC_KEY"),
  };
}

export function isRemoteGamesEnabled() {
  const c = operatorServer();
  return Boolean(c.aggregatorUrl || c.supabaseUrl || c.governanceUrl || c.casinoOrigin);
}
