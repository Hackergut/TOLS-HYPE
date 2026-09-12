import { createHmac, randomBytes } from "node:crypto";
import { operatorServer } from "@/lib/operator/env.server";

/** Same HMAC SSO format as tols-casino-next `createBridgeSsoToken`. */

export function ssoConfigured() {
  return (operatorServer().governanceKey ?? "").length >= 16;
}

function secret() {
  return (operatorServer().governanceKey ?? "").trim();
}

export function mintSkinSso(user: { userId: string; email?: string | null; name?: string | null }) {
  const key = secret();
  if (key.length < 16) throw new Error("GOVERNANCE_BRIDGE_SECRET unset");
  const payload = {
    userId: user.userId,
    email: user.email || undefined,
    username: user.name || (user.email ? user.email.split("@")[0] : `skin_${user.userId.slice(0, 8)}`),
    issuedAt: Date.now(),
    nonce: randomBytes(8).toString("hex"),
  };
  const raw = JSON.stringify(payload);
  const b64 = Buffer.from(raw).toString("base64url");
  const sig = createHmac("sha256", key).update(b64).digest("hex");
  const bodySig = `sha256=${createHmac("sha256", key).update(raw).digest("hex")}`;
  return { payload, raw, token: `${b64}.${sig}`, bodySig };
}

function sessionFrom(res: Response, json: unknown) {
  const data =
    json && typeof json === "object" && "data" in json
      ? ((json as { data?: { sessionToken?: string; token?: string } }).data ?? {})
      : json && typeof json === "object"
        ? (json as { sessionToken?: string; token?: string })
        : {};
  const fromJson = data.sessionToken || data.token;
  if (fromJson) return fromJson;
  const set = typeof res.headers.getSetCookie === "function" ? res.headers.getSetCookie() : [];
  const raw = set.join(",") || res.headers.get("set-cookie") || "";
  return raw.match(/tols_session=([^;,]+)/)?.[1];
}

/**
 * Map this skin's Better Auth user onto a tols.fun `tols_session`.
 * Prefers POST /api/bridge/player-sso (JSON token); falls back to GET /api/bridge/sso.
 */
export async function casinoPlayerSession(user: {
  userId: string;
  email?: string | null;
  name?: string | null;
}): Promise<string | undefined> {
  if (!user.userId || user.userId === "dev-user") return undefined;
  if (!ssoConfigured()) return undefined;
  const origin = operatorServer().casinoOrigin;
  const minted = mintSkinSso(user);

  try {
    const res = await fetch(`${origin}/api/bridge/player-sso`, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        accept: "application/json",
        "x-bridge-signature": minted.bodySig,
      },
      body: minted.raw,
      signal: AbortSignal.timeout(8000),
    });
    const json = await res.json().catch(() => ({}));
    const token = sessionFrom(res, json);
    if (res.ok && token) return token;
  } catch {
    /* fall through to GET SSO */
  }

  try {
    const res = await fetch(`${origin}/api/bridge/sso?token=${encodeURIComponent(minted.token)}`, {
      headers: { accept: "application/json" },
      redirect: "manual",
      signal: AbortSignal.timeout(8000),
    });
    const json = await res.json().catch(() => ({}));
    return sessionFrom(res, json);
  } catch {
    return undefined;
  }
}
