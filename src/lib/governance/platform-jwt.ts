import { createPublicKey, createVerify, verify as rsaVerify } from "node:crypto";
import { env } from "@/lib/env.server";
import { getBridgeConfig, signatureFromHeaders, verifyRestHmac } from "@/lib/governance/bridge";

function normalizePem(raw: string | undefined | null): string | null {
  if (!raw) return null;
  const trimmed = raw.trim().replace(/^['"]|['"]$/g, "");
  if (!trimmed) return null;
  if (!trimmed.includes("-----BEGIN")) {
    try {
      const decoded = Buffer.from(trimmed, "base64").toString("utf8");
      if (decoded.includes("-----BEGIN")) return decoded.replace(/\\n/g, "\n");
    } catch {
      /* fall through */
    }
    return trimmed.replace(/\\n/g, "\n");
  }
  return trimmed.replace(/\\n/g, "\n");
}

export type PlatformJwtClaims = {
  iss: string;
  aud: string;
  sub?: string;
  iat: number;
  exp: number;
  jti?: string;
  role?: string;
  scope?: string | string[];
};

export type VerifyResult = { valid: boolean; claims?: PlatformJwtClaims; error?: string };

export const PLATFORM_CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET,POST,PUT,PATCH,OPTIONS,HEAD",
  "Access-Control-Allow-Headers":
    "Authorization, Content-Type, X-Bridge-Signature, X-Bridge-Timestamp, X-Bridge-Source, X-Casino-Origin, X-Webhook-Signature, X-Tower-Signature, X-Governance-Signature, X-Platform-Public-Key, X-Bridge-Path",
  "Cache-Control": "no-store",
};

export function scopesOf(claims: PlatformJwtClaims): string[] {
  const raw = claims.scope;
  if (raw == null) return ["*"];
  if (Array.isArray(raw)) return raw.map(String).filter(Boolean);
  return String(raw)
    .split(/[\s,]+/)
    .map((s) => s.trim())
    .filter(Boolean);
}

export function scopeHas(claims: PlatformJwtClaims, needed: string): boolean {
  const scopes = scopesOf(claims);
  if (scopes.length === 0 || scopes.includes("*")) return true;
  return scopes.includes(needed);
}

const seenJti = new Map<string, number>();

function rememberJti(jti: string | undefined, exp: number): string | null {
  if (!jti) return null;
  const now = Math.floor(Date.now() / 1000);
  const prev = seenJti.get(jti) ?? 0;
  if (prev > now) return "replay detected";
  seenJti.set(jti, Math.max(exp, now + 60));
  if (seenJti.size > 4000) {
    for (const [key, until] of seenJti) {
      if (until <= now) seenJti.delete(key);
    }
  }
  return null;
}

function audMatches(value: unknown, expected: string): boolean {
  if (value === expected) return true;
  if (Array.isArray(value)) return value.map(String).includes(expected);
  return false;
}

function tryVerifyRsa(data: string, sig: Buffer, pem: string): boolean {
  const attempts: Array<() => ReturnType<typeof createPublicKey>> = [() => createPublicKey(pem)];
  if (!pem.includes("-----BEGIN")) {
    attempts.push(() =>
      createPublicKey({ key: Buffer.from(pem, "base64"), format: "der", type: "spki" }),
    );
    attempts.push(() =>
      createPublicKey({ key: Buffer.from(pem, "base64"), format: "der", type: "pkcs1" }),
    );
  }
  for (const load of attempts) {
    try {
      const key = load();
      const verifier = createVerify("RSA-SHA256");
      verifier.update(data);
      verifier.end();
      if (verifier.verify(key, sig)) return true;
      if (rsaVerify("RSA-SHA256", Buffer.from(data), key, sig)) return true;
    } catch {
      /* next form */
    }
  }
  return false;
}

function finishClaims(payload: Record<string, unknown>, iss: string, aud: string): VerifyResult {
  const nowSec = Math.floor(Date.now() / 1000);
  const exp = Number(payload.exp);
  const iat = Number(payload.iat);
  if (!Number.isFinite(exp) || exp < nowSec) return { valid: false, error: "Token expired" };
  if (Number.isFinite(iat) && iat > nowSec + 60) return { valid: false, error: "Token iat in future" };
  if (payload.iss !== iss) return { valid: false, error: `Invalid iss expected ${iss}` };
  if (!audMatches(payload.aud, aud)) return { valid: false, error: `Invalid aud expected ${aud}` };
  const replay = rememberJti(typeof payload.jti === "string" ? payload.jti : undefined, exp);
  if (replay) return { valid: false, error: replay };
  return {
    valid: true,
    claims: {
      iss,
      aud,
      sub: payload.sub == null ? undefined : String(payload.sub),
      iat: Number.isFinite(iat) ? iat : nowSec,
      exp,
      jti: typeof payload.jti === "string" ? payload.jti : undefined,
      role: payload.role == null ? undefined : String(payload.role),
      scope: payload.scope as string | string[] | undefined,
    },
  };
}

export function verifyPlatformJwt(
  token: string | null | undefined,
  extraPem?: string | null,
): VerifyResult {
  if (!token) return { valid: false, error: "Missing Authorization Bearer token" };
  const raw = token.trim().replace(/^Bearer\s+/i, "");
  if (!raw) return { valid: false, error: "Empty token" };

  const parts = raw.split(".");
  if (parts.length !== 3) return { valid: false, error: "Invalid JWT format" };
  const [hB64, pB64, sigB64] = parts;
  let header: Record<string, unknown>;
  let payload: Record<string, unknown>;
  try {
    header = JSON.parse(Buffer.from(hB64, "base64url").toString("utf8"));
    payload = JSON.parse(Buffer.from(pB64, "base64url").toString("utf8"));
  } catch {
    return { valid: false, error: "Invalid JWT encoding" };
  }
  if (header.alg !== "RS256") return { valid: false, error: `Invalid alg ${String(header.alg)} — expected RS256` };

  const envPem = normalizePem(env("PLATFORM_JWT_PUBLIC_KEY"));
  const extra = normalizePem(extraPem);
  const pems = [envPem, extra].filter((p, i, a): p is string => Boolean(p) && a.indexOf(p) === i);
  if (pems.length === 0) return { valid: false, error: "PLATFORM_JWT_PUBLIC_KEY not configured on Casino" };

  const data = `${hB64}.${pB64}`;
  const sig = Buffer.from(sigB64, "base64url");
  let verified = false;
  try {
    for (const pem of pems) {
      if (tryVerifyRsa(data, sig, pem)) {
        verified = true;
        break;
      }
    }
  } catch (e) {
    return { valid: false, error: `Signature verify failed: ${e instanceof Error ? e.message : String(e)}` };
  }
  if (!verified) {
    const iss = String(payload.iss ?? "");
    const aud = Array.isArray(payload.aud) ? payload.aud.join(",") : String(payload.aud ?? "");
    return { valid: false, error: `Invalid signature (alg=RS256 iss=${iss} aud=${aud})` };
  }

  const iss = (env("PLATFORM_JWT_ISSUER") || "tols-governance").trim();
  const aud = (env("PLATFORM_JWT_AUDIENCE") || "tols-casino").trim();
  return finishClaims(payload, iss, aud);
}

export function getBearerToken(req: Request): string | null {
  const h = req.headers.get("authorization") || req.headers.get("Authorization");
  if (!h) return null;
  const m = h.match(/^Bearer\s+(.+)$/i);
  return m ? m[1] : null;
}

export function hmacPlatformClaims(req: Request): PlatformJwtClaims | null {
  if (!verifyRestHmac(req)) return null;
  const now = Math.floor(Date.now() / 1000);
  const ts = Number(req.headers.get("x-bridge-timestamp")) || now;
  return {
    iss: "tols-governance",
    aud: "tols-casino",
    sub: "hmac-bridge",
    iat: ts,
    exp: ts + 300,
    role: "platform",
    scope: "*",
  };
}

function advertisedPublicPem(req: Request): string | null {
  const raw =
    req.headers.get("x-platform-public-key") ||
    req.headers.get("x-governance-public-key") ||
    req.headers.get("x-jwks-pem");
  return normalizePem(raw);
}

type JwksCache = { pem: string; until: number };
let jwksCache: JwksCache | null = null;

export async function fetchGovernancePublicPem(): Promise<string | null> {
  if (jwksCache && jwksCache.until > Date.now()) return jwksCache.pem;
  const origin = getBridgeConfig().towerOrigin;
  const urls = [`${origin}/api/platform/jwks`, `${origin}/api/.well-known/jwks.json`];
  for (const url of urls) {
    try {
      const res = await fetch(url, {
        cache: "no-store",
        headers: { Accept: "application/json", "X-Bridge-Source": "tols-casino" },
        signal: AbortSignal.timeout(4000),
      });
      if (!res.ok) continue;
      const body = (await res.json().catch(() => null)) as {
        data?: { pem?: string; pemBase64?: string };
        pem?: string;
        keys?: unknown;
      } | null;
      const pem =
        normalizePem(body?.data?.pem) ||
        normalizePem(body?.pem) ||
        normalizePem(body?.data?.pemBase64);
      if (pem) {
        jwksCache = { pem, until: Date.now() + 10 * 60 * 1000 };
        return pem;
      }
    } catch {
      /* next url */
    }
  }
  return jwksCache?.pem ?? null;
}

export async function inspectPlatformAuth(req: Request): Promise<{
  jwt: VerifyResult;
  hmac: boolean;
  hmacPresent: boolean;
  claims?: PlatformJwtClaims;
  via?: "jwt" | "hmac";
  jwks?: boolean;
}> {
  const token = getBearerToken(req);
  const hmacPresent = Boolean(signatureFromHeaders(req.headers));
  const hmacClaims = hmacPlatformClaims(req);
  const hmac = Boolean(hmacClaims);

  let jwt = verifyPlatformJwt(token);
  if (jwt.valid && jwt.claims) {
    return { jwt, hmac, hmacPresent, claims: jwt.claims, via: "jwt" };
  }

  if (hmac) {
    const advertised = advertisedPublicPem(req);
    if (advertised) {
      const again = verifyPlatformJwt(token, advertised);
      if (again.valid && again.claims) {
        return { jwt: again, hmac, hmacPresent, claims: again.claims, via: "jwt", jwks: true };
      }
    }
  }

  if (token && !jwt.valid) {
    const jwksPem = await fetchGovernancePublicPem();
    if (jwksPem) {
      const again = verifyPlatformJwt(token, jwksPem);
      if (again.valid && again.claims) {
        return { jwt: again, hmac, hmacPresent, claims: again.claims, via: "jwt", jwks: true };
      }
      jwt = again;
    }
  }

  if (hmacClaims) return { jwt, hmac: true, hmacPresent, claims: hmacClaims, via: "hmac" };
  return { jwt, hmac: false, hmacPresent };
}

export async function requirePlatformAuth(
  req: Request,
): Promise<{ claims: PlatformJwtClaims } | { response: Response }> {
  const inspected = await inspectPlatformAuth(req);
  if (inspected.claims) return { claims: inspected.claims };

  const result = inspected.jwt;
  const isMissingKey = result.error?.includes("PLATFORM_JWT_PUBLIC_KEY");
  const hmacHint = inspected.hmacPresent
    ? " HMAC present but invalid — GOVERNANCE_BRIDGE_SECRET must match, and X-Bridge-Path should be the signed path."
    : " Or send X-Bridge-Signature + X-Bridge-Timestamp (shared GOVERNANCE_BRIDGE_SECRET).";
  return {
    response: Response.json(
      {
        success: false,
        error: result.error || "Unauthorized",
        hint: isMissingKey
          ? "Set PLATFORM_JWT_PUBLIC_KEY on the casino to the Governance public key, or expose GET /api/platform/jwks on gov.tols.fun."
          : `Send Authorization: Bearer <RS256 JWT iss=tols-governance aud=tols-casino>.${hmacHint}`,
      },
      { status: isMissingKey && !inspected.hmacPresent ? 503 : 401, headers: PLATFORM_CORS },
    ),
  };
}

export async function requirePlatformScope(
  req: Request,
  needed: string,
): Promise<{ claims: PlatformJwtClaims } | { response: Response }> {
  const auth = await requirePlatformAuth(req);
  if ("response" in auth) return auth;
  if (!scopeHas(auth.claims, needed)) {
    return {
      response: Response.json(
        { success: false, error: `Missing scope: ${needed}` },
        { status: 403, headers: PLATFORM_CORS },
      ),
    };
  }
  return auth;
}
