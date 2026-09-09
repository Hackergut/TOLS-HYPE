import { createServerFn } from "@tanstack/react-start";
import { authMiddleware } from "@/lib/auth/middleware";

export type CasinoSsoResult = {
  ok: boolean;
  token?: string;
  ssoUrl?: string;
  casinoOrigin?: string;
  expiresInSec?: number;
  error?: string;
};

/**
 * After Better Auth login, mint the HMAC token that tols-casino-next already
 * accepts at GET /api/bridge/sso (same createBridgeSsoToken dialect).
 * Money identity stays casinoUser on Next. Flexrix HMAC stays on Next.
 */
export const bridgePlayerSso = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .handler(async ({ context }): Promise<CasinoSsoResult> => {
    const { createHmac } = await import("node:crypto");
    const { getSessionUser } = await import("@/lib/auth/verify.server");
    const { operatorServer } = await import("@/lib/operator/env.server");
    const { env } = await import("@/lib/env.server");

    if (context.userId === "dev-user") {
      return { ok: false, error: "Dev fallback cannot cross the casino bridge" };
    }

    const session = await getSessionUser();
    const email = session?.email?.trim() || undefined;
    const userId = session?.id || context.userId;
    if (!userId || userId === "dev-user") {
      return { ok: false, error: "Signed-in user required" };
    }

    const secret = (
      env("GOVERNANCE_BRIDGE_SECRET") ||
      env("GOVERNANCE_WEBHOOK_SECRET") ||
      env("SKIN_SSO_SECRET") ||
      ""
    ).trim();
    if (secret.length < 16) {
      return { ok: false, error: "GOVERNANCE_BRIDGE_SECRET not configured on the skin" };
    }

    const payload = {
      userId,
      email,
      username: email?.split("@")[0] || userId.slice(0, 12),
      issuedAt: Date.now(),
      nonce: crypto.randomUUID(),
    };
    const b64 = Buffer.from(JSON.stringify(payload)).toString("base64url");
    const sig = createHmac("sha256", secret).update(b64).digest("hex");
    const token = `${b64}.${sig}`;

    const casinoOrigin = operatorServer().casinoOrigin.replace(/\/$/, "");
    const ssoUrl = `${casinoOrigin}/api/bridge/sso?token=${encodeURIComponent(token)}`;
    return { ok: true, token, ssoUrl, casinoOrigin, expiresInSec: 600 };
  });
