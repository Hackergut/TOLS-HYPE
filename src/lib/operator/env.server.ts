import { env } from "@/lib/env.server";
import type { OperatorBackend } from "@/lib/operator/config";
import type { AggregatorKind } from "@/lib/operator/adapter";

export const CANONICAL_CASINO_ORIGIN = "https://www.tols.fun";

const STALE_ORIGIN_HOSTS = new Set([
  "tols-plum.vercel.app",
  "www.tols-plum.vercel.app",
]);

/** Public origin used for Flexrix/sports callbacks, SSO and cashier links. */
export function normalizePublicOrigin(raw: string | undefined | null): string {
  const fallback = CANONICAL_CASINO_ORIGIN;
  let value = (raw ?? "").trim();
  if (!value) return fallback;
  if (!/^https?:\/\//i.test(value)) value = `https://${value}`;
  try {
    const u = new URL(value);
    const host = u.hostname.toLowerCase();
    if (STALE_ORIGIN_HOSTS.has(host)) return fallback;
    return `${u.protocol}//${u.host}`;
  } catch {
    return fallback;
  }
}

export function resolveCasinoOrigin(
  casinoOriginEnv?: string | null,
  appUrlEnv?: string | null,
): string {
  const primary = (casinoOriginEnv ?? "").trim();
  const secondary = (appUrlEnv ?? "").trim();
  if (primary) {
    const normalized = normalizePublicOrigin(primary);
    if (!STALE_ORIGIN_HOSTS.has(hostOf(primary))) return normalized;
  }
  if (secondary) return normalizePublicOrigin(secondary);
  return CANONICAL_CASINO_ORIGIN;
}

function hostOf(raw: string): string {
  const value = /^https?:\/\//i.test(raw) ? raw : `https://${raw}`;
  try {
    return new URL(value).hostname.toLowerCase();
  } catch {
    return raw.toLowerCase();
  }
}

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
    casinoOrigin: resolveCasinoOrigin(env("CASINO_ORIGIN"), env("APP_URL")),
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
