import { createPublicKey, createVerify, verify as rsaVerify } from "node:crypto";
import { env } from "@/lib/env.server";
import { signatureFromHeaders, verifyRestHmac } from "@/lib/governance/bridge";

function normalizePem(raw: string | undefined): string | null {
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
    "Authorization, Content-Type, X-Bridge-Signature, X-Bridge-Timestamp, X-Bridge-Source, X-Casino-Origin, X-Webhook-Signature, X-Tower-Signature, X-Governance-Signature",
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
  const attempts: Array<() => ReturnType<typeof createPublicKey>> = [
    () => createPublicKey(pem),
  ];
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

export function verifyPlatformJwt(token: string | null | undefined): VerifyResult {
  if (!token) return { valid: false, error: "Missing Authorization Bearer token" };
  const raw = token.trim().replace(/^Bearer\s+/i, "");
  if (!raw) return { valid: false, error: "Empty token" };
  const pubPem = normalizePem(env("PLATFORM_JWT_PUBLIC_KEY"));
  if (!pubPem) return { valid: false, error: "PLATFORM_JWT_PUBLIC_KEY not configured on Casino" };

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

  try {
    const data = `${hB64}.${pB64}`;
    const sig = Buffer.from(sigB64, "base64url");
    if (!tryVerifyRsa(data, sig, pubPem)) {
      const iss = String(payload.iss ?? "");
      const aud = Array.isArray(payload.aud) ? payload.aud.join(",") : String(payload.aud ?? "");
      return { valid: false, error: `Invalid signature (alg=RS256 iss=${iss} aud=${aud})` };
    }
  } catch (e) {
    return { valid: false, error: `Signature verify failed: ${e instanceof Error ? e.message : String(e)}` };
  }

  const nowSec = Math.floor(Date.now() / 1000);
  const exp = Number(payload.exp);
  const iat = Number(payload.iat);
  if (!Number.isFinite(exp) || exp < nowSec) return { valid: false, error: "Token expired" };
  if (Number.isFinite(iat) && iat > nowSec + 60) return { valid: false, error: "Token iat in future" };
  const iss = (env("PLATFORM_JWT_ISSUER") || "tols-governance").trim();
  if (payload.iss !== iss) return { valid: false, error: `Invalid iss expected ${iss}` };
  const aud = (env("PLATFORM_JWT_AUDIENCE") || "tols-casino").trim();
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

export function inspectPlatformAuth(req: Request): {
  jwt: VerifyResult;
  hmac: boolean;
  hmacPresent: boolean;
  claims?: PlatformJwtClaims;
  via?: "jwt" | "hmac";
} {
  const jwt = verifyPlatformJwt(getBearerToken(req));
  const hmacPresent = Boolean(signatureFromHeaders(req.headers));
  const hmacClaims = hmacPlatformClaims(req);
  if (jwt.valid && jwt.claims) return { jwt, hmac: Boolean(hmacClaims), hmacPresent, claims: jwt.claims, via: "jwt" };
  if (hmacClaims) return { jwt, hmac: true, hmacPresent, claims: hmacClaims, via: "hmac" };
  return { jwt, hmac: false, hmacPresent };
}

export function requirePlatformAuth(req: Request): { claims: PlatformJwtClaims } | { response: Response } {
  const inspected = inspectPlatformAuth(req);
  if (inspected.claims) return { claims: inspected.claims };

  const result = inspected.jwt;
  const isMissingKey = result.error?.includes("PLATFORM_JWT_PUBLIC_KEY");
  const hmacHint = inspected.hmacPresent
    ? " HMAC present but invalid — GOVERNANCE_BRIDGE_SECRET must match on both projects."
    : " Or send X-Bridge-Signature + X-Bridge-Timestamp (shared GOVERNANCE_BRIDGE_SECRET).";
  return {
    response: Response.json(
      {
        success: false,
        error: result.error || "Unauthorized",
        hint: isMissingKey
          ? "Set PLATFORM_JWT_PUBLIC_KEY on the casino to the Governance public key (same pair as PLATFORM_JWT_PRIVATE_KEY)."
          : `Send Authorization: Bearer <RS256 JWT iss=tols-governance aud=tols-casino>.${hmacHint}`,
      },
      { status: isMissingKey && !inspected.hmacPresent ? 503 : 401, headers: PLATFORM_CORS },
    ),
  };
}

export function requirePlatformScope(
  req: Request,
  needed: string,
): { claims: PlatformJwtClaims } | { response: Response } {
  const auth = requirePlatformAuth(req);
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
