import { createHmac, timingSafeEqual } from "node:crypto";
import { env } from "@/lib/env.server";

const GOVERNANCE_ORIGIN = "https://gov.tols.fun";
const CASINO = "https://www.tols.fun";

function strip(s: string) {
  return s.replace(/\/+$/, "");
}

function pick(...keys: string[]): string | undefined {
  for (const k of keys) {
    const v = env(k);
    if (v) return v;
  }
  return undefined;
}

export function canonicalCasinoOrigin(raw?: string | null): string {
  const v = strip((raw || "").trim());
  if (!v) return CASINO;
  try {
    const u = new URL(v);
    const host = u.hostname.toLowerCase();
    if (host === "tols.fun" || host === "www.tols.fun") return CASINO;
    if (host === "gov.tols.fun" || host.includes("tolsgovernz")) return CASINO;
    return `${u.protocol}//${u.host}`;
  } catch {
    return CASINO;
  }
}

export function canonicalGovernanceOrigin(raw?: string | null): string {
  const v = strip((raw || "").trim());
  if (!v) return GOVERNANCE_ORIGIN;
  try {
    const u = new URL(v);
    const host = u.hostname.toLowerCase();
    if (host === "gov.tols.fun" || host.includes("tolsgovernz")) return strip(`${u.protocol}//${u.host}`);
    return GOVERNANCE_ORIGIN;
  } catch {
    return GOVERNANCE_ORIGIN;
  }
}

export function getBridgeConfig() {
  const towerOrigin = canonicalGovernanceOrigin(pick("GOVERNANCE_TOWER_URL", "TOWER_URL", "VITE_GOVERNANCE_URL"));
  const casinoOrigin = canonicalCasinoOrigin(pick("APP_URL", "CASINO_ORIGIN", "CASINO_URL"));
  const secret = pick("GOVERNANCE_BRIDGE_SECRET", "GOVERNANCE_WEBHOOK_SECRET") || "";
  return {
    towerOrigin,
    towerApiBase: `${towerOrigin}/api`,
    casinoOrigin,
    hasBridgeSecret: secret.length >= 16,
    jwtReady: Boolean(pick("PLATFORM_JWT_PUBLIC_KEY")),
    hasDb: Boolean(env("DATABASE_URL")),
  };
}

function bridgeSecret(): string {
  return (pick("GOVERNANCE_BRIDGE_SECRET", "GOVERNANCE_WEBHOOK_SECRET") || "").trim();
}

export function signBridgePayload(payload: string, secretOverride?: string): string {
  const secret = secretOverride || bridgeSecret();
  if (!secret) throw new Error("GOVERNANCE_BRIDGE_SECRET not configured");
  return createHmac("sha256", secret).update(payload).digest("hex");
}

export function verifyBridgeSignature(rawBody: string, signature: string | null, secretOverride?: string): boolean {
  const secret = secretOverride || bridgeSecret();
  if (!secret || !signature) return false;
  const expected = createHmac("sha256", secret).update(rawBody).digest("hex");
  const got = signature.trim().toLowerCase().replace(/^sha256=/, "");
  const a = Buffer.from(expected, "utf8");
  const b = Buffer.from(got, "utf8");
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}

export function verifyBridgeTimestamp(header: string | null): boolean {
  const ts = Number(header);
  if (!Number.isFinite(ts)) return false;
  return Math.abs(Date.now() / 1000 - ts) <= 300;
}

export function signatureFromHeaders(headers: Headers): string | null {
  return (
    headers.get("x-bridge-signature") ||
    headers.get("x-webhook-signature") ||
    headers.get("x-tower-signature") ||
    headers.get("x-governance-signature")
  );
}

export type BridgeEventType =
  | "casino.bet"
  | "casino.win"
  | "casino.deposit_confirmed"
  | "casino.withdrawal_pending"
  | "casino.withdrawal_settled"
  | "casino.session_start"
  | "casino.session_end"
  | "casino.health"
  | "solana_ledger"
  | "bridge.sync_request";

export async function bridgeFetch(opts: {
  path: string;
  method?: string;
  body?: unknown;
  timeoutMs?: number;
  useOrigin?: boolean;
}): Promise<Response> {
  const cfg = getBridgeConfig();
  const base = opts.useOrigin === false ? cfg.towerApiBase : cfg.towerOrigin;
  const path = opts.path.startsWith("/") ? opts.path : `/${opts.path}`;
  const raw = opts.body === undefined ? undefined : typeof opts.body === "string" ? opts.body : JSON.stringify(opts.body);
  const headers: Record<string, string> = {
    Accept: "application/json",
    "X-Bridge-Source": "tols-casino",
    "X-Casino-Origin": cfg.casinoOrigin,
  };
  if (raw !== undefined) headers["Content-Type"] = "application/json";
  const secret = bridgeSecret();
  if (secret && raw !== undefined) {
    headers["X-Bridge-Signature"] = `sha256=${signBridgePayload(raw, secret)}`;
    headers["X-Bridge-Timestamp"] = String(Math.floor(Date.now() / 1000));
  }
  const controller = new AbortController();
  const t = setTimeout(() => controller.abort(), opts.timeoutMs ?? 8000);
  try {
    return await fetch(`${base}${path}`, {
      method: opts.method || (raw !== undefined ? "POST" : "GET"),
      headers,
      body: raw,
      cache: "no-store",
      signal: controller.signal,
    });
  } finally {
    clearTimeout(t);
  }
}

export async function probeGovernanceHealth(timeoutMs = 4000): Promise<{
  reachable: boolean;
  status?: number;
  latencyMs: number;
  error?: string;
  url?: string;
}> {
  const paths = ["/api/platform/health", "/api/health"];
  let last = { reachable: false, latencyMs: 0, error: "no probe" as string | undefined, url: undefined as string | undefined, status: undefined as number | undefined };
  for (const path of paths) {
    const t0 = Date.now();
    try {
      const res = await bridgeFetch({ path, method: "GET", timeoutMs, useOrigin: true });
      const latencyMs = Date.now() - t0;
      last = { reachable: true, status: res.status, latencyMs, url: path, error: undefined };
      if (res.status !== 404) return last;
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      last = {
        reachable: false,
        latencyMs: Date.now() - t0,
        error: /abort/i.test(msg) ? "timeout" : msg.slice(0, 300),
        url: path,
        status: undefined,
      };
    }
  }
  return last;
}

export async function pushBridgeEvent(
  type: BridgeEventType | string,
  payload: Record<string, unknown> = {},
): Promise<{ ok: boolean; status: number; body?: unknown }> {
  const body = { type, payload, ts: new Date().toISOString(), source: "casino" };
  const candidates = ["/api/platform/webhooks", "/api/platform/webhook"];
  for (const path of candidates) {
    try {
      const res = await bridgeFetch({ path, method: "POST", body, useOrigin: true });
      if (res.status === 404) continue;
      const text = await res.text();
      let parsed: unknown = text;
      try {
        parsed = JSON.parse(text);
      } catch {
        /* keep text */
      }
      return { ok: res.ok, status: res.status, body: parsed };
    } catch (e) {
      if (path !== candidates[candidates.length - 1]) continue;
      return { ok: false, status: 0, body: { error: e instanceof Error ? e.message : String(e) } };
    }
  }
  return { ok: false, status: 404, body: { error: "webhook 404" } };
}

export function pushSettledBet(opts: {
  userId: string;
  game: string;
  amount: number;
  payout: number;
  multiplier: number;
  won: boolean;
  betId?: string;
}): Promise<{ ok: boolean; status: number; body?: unknown }> {
  if (opts.amount <= 0) return Promise.resolve({ ok: true, status: 204 });
  const type: BridgeEventType = opts.won ? "casino.win" : "casino.bet";
  return pushBridgeEvent(type, { ...opts }).catch(() => ({ ok: false, status: 0 }));
}

export const KNOWN_INBOUND = [
  "governance.rtp_update",
  "governance.limits_update",
  "governance.feature_flag",
  "governance.session_invalidate",
  "governance.wallet_adjust",
  "governance.player_block",
  "governance.support_reply",
  "governance.support_close",
  "governance.bonus_credit",
  "ping",
] as const;
