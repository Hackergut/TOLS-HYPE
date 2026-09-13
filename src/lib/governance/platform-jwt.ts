import { createPublicKey, createVerify } from "node:crypto";
import { env } from "@/lib/env.server";

function normalizePem(raw: string | undefined): string | null {
  if (!raw) return null;
  const trimmed = raw.trim();
  if (!trimmed) return null;
  if (!trimmed.includes("-----BEGIN")) {
    try {
      const decoded = Buffer.from(trimmed, "base64").toString("utf8");
      if (decoded.includes("-----BEGIN")) return decoded;
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
  "Access-Control-Allow-Methods": "GET,POST,OPTIONS,HEAD",
  "Access-Control-Allow-Headers": "Authorization, Content-Type",
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
  let payload: PlatformJwtClaims;
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
    const key = createPublicKey(pubPem);
    const verifier = createVerify("RSA-SHA256");
    verifier.update(data);
    verifier.end();
    if (!verifier.verify(key, sig)) return { valid: false, error: "Invalid signature" };
  } catch (e) {
    return { valid: false, error: `Signature verify failed: ${e instanceof Error ? e.message : String(e)}` };
  }

  const nowSec = Math.floor(Date.now() / 1000);
  if (typeof payload.exp !== "number" || payload.exp < nowSec) return { valid: false, error: "Token expired" };
  if (typeof payload.iat === "number" && payload.iat > nowSec + 60) return { valid: false, error: "Token iat in future" };
  const iss = (env("PLATFORM_JWT_ISSUER") || "tols-governance").trim();
  if (payload.iss !== iss) return { valid: false, error: `Invalid iss expected ${iss}` };
  const aud = (env("PLATFORM_JWT_AUDIENCE") || "tols-casino").trim();
  if (payload.aud !== aud) return { valid: false, error: `Invalid aud expected ${aud}` };
  const replay = rememberJti(payload.jti, payload.exp);
  if (replay) return { valid: false, error: replay };
  return { valid: true, claims: payload };
}

export function getBearerToken(req: Request): string | null {
  const h = req.headers.get("authorization") || req.headers.get("Authorization");
  if (!h) return null;
  const m = h.match(/^Bearer\s+(.+)$/i);
  return m ? m[1] : null;
}

export function requirePlatformAuth(req: Request): { claims: PlatformJwtClaims } | { response: Response } {
  const result = verifyPlatformJwt(getBearerToken(req));
  if (!result.valid || !result.claims) {
    const isMissingKey = result.error?.includes("PLATFORM_JWT_PUBLIC_KEY");
    return {
      response: Response.json(
        {
          success: false,
          error: result.error || "Unauthorized",
          hint: isMissingKey
            ? "Set PLATFORM_JWT_PUBLIC_KEY on the casino (governance public key)"
            : "Send Authorization: Bearer <RS256 JWT iss=tols-governance aud=tols-casino>",
        },
        { status: isMissingKey ? 503 : 401, headers: PLATFORM_CORS },
      ),
    };
  }
  return { claims: result.claims };
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
