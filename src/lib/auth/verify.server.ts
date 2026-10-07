import { getRequest, getCookie, setCookie } from "@tanstack/react-start/server";
import { randomBytes } from "node:crypto";
import { auth, authConfigured } from "./server";
import { readSessionToken, SESSION_COOKIE } from "./google-session.server";

/**
 * Server-side session resolution (server-only).
 *
 * Because this app runs its OWN Better Auth at same-origin `/api/auth/*`, the
 * session cookie is sent with every request to this app — server functions AND
 * SSR loaders included. So we resolve the user straight from the request cookies
 * via `auth.api.getSession` (no client-minted JWT needed). Never trust a
 * client-supplied user id — only the result of this verification.
 */

/** True when a real database is configured server-side. */
const databaseConfigured = Boolean(process.env.DATABASE_URL?.trim());

/** Re-export so callers can branch on it without importing `server.ts`. */
export { authConfigured };

if (databaseConfigured && !authConfigured) {
  console.warn(
    "[auth] DATABASE_URL set, VITE_AUTH_ENABLED=false — bets use a per-browser guest cookie, not a shared dev user.",
  );
}

const GUEST_COOKIE = "tols_guest";

function guestUserId(): string {
  const existing = getCookie(GUEST_COOKIE)?.trim();
  if (existing && /^guest_[a-z0-9]{16,}$/i.test(existing)) return existing;
  const id = `guest_${randomBytes(12).toString("hex")}`;
  setCookie(GUEST_COOKIE, id, {
    path: "/",
    maxAge: 60 * 60 * 24 * 400,
    sameSite: "lax",
    httpOnly: true,
  });
  return id;
}
export const DEV_USER_ID = "dev-user";

/**
 * Thrown by `requireUserId` when the caller has no valid session. Carries
 * `status: 401`; the message is a stable contract — match
 * `err.message === "Unauthorized"` client-side to send the visitor to sign-in.
 */
export class UnauthorizedError extends Error {
  readonly status = 401;
  constructor() {
    super("Unauthorized");
    this.name = "UnauthorizedError";
  }
}

export type VerifiedUser = { id: string; email: string | null };

/**
 * Resolve the signed-in user from the current request, or `null` when auth isn't
 * configured / nobody is signed in. Safe to call from server functions and SSR
 * loaders.
 *
 * `bearerToken` is for the LIVE PREVIEW: the app runs in a partitioned iframe
 * whose cookies don't reach the server, so `authMiddleware` forwards the session
 * as a bearer token, which we present as `Authorization: Bearer …` (the `bearer`
 * plugin resolves it). When deployed no token is passed and the cookie is used.
 */
function googleSessionUser(): VerifiedUser | null {
  const native = readSessionToken(getCookie(SESSION_COOKIE));
  if (!native) return null;
  return { id: native.id, email: native.email };
}

export async function getSessionUser(
  bearerToken?: string,
): Promise<VerifiedUser | null> {
  const google = googleSessionUser();
  if (google) return google;
  const request = getRequest();
  if (!request) return null;
  try {
    let headers = request.headers;
    if (bearerToken) {
      headers = new Headers(request.headers);
      headers.set("Authorization", `Bearer ${bearerToken}`);
    }
    const session = await auth.api.getSession({ headers });
    if (session?.user) {
      const { sessionAllowed } = await import("./access.server");
      const created = session.session?.createdAt ?? new Date();
      if (!(await sessionAllowed(session.user.id, created))) return null;
      return { id: session.user.id, email: session.user.email ?? null };
    }
    const url = new URL(request.url);
    url.pathname = "/api/auth/get-session";
    url.search = "";
    const viaHandler = await auth.handler(new Request(url, { method: "GET", headers })).catch(() => null);
    const data = (await viaHandler?.json().catch(() => null)) as {
      session?: { createdAt?: string };
      user?: { id?: string; email?: string | null };
    } | null;
    if (!data?.user?.id) return null;
    const { sessionAllowed } = await import("./access.server");
    if (!(await sessionAllowed(data.user.id, data.session?.createdAt ?? new Date().toISOString()))) return null;
    return { id: data.user.id, email: data.user.email ?? null };
  } catch {
    return null;
  }
}

function requestHost(): string {
  const request = getRequest();
  if (!request) return "";
  const raw = request.headers.get("x-forwarded-host") ?? request.headers.get("host") ?? "";
  return raw.split(",")[0]?.trim().split(":")[0]?.toLowerCase() ?? "";
}

function isDeployedHost(host: string): boolean {
  return host === "tols.fun" || host === "www.tols.fun" || host.endsWith(".vercel.app");
}

/** Sandbox dev server only. Production (NODE_ENV) and tols.fun never take this seat. */
function previewPlayerId(): string | null {
  if (process.env.NODE_ENV === "production") return null;
  if (process.env.BETTER_AUTH_URL?.trim() || process.env.GROK_AUTH_CLIENT_ID?.trim()) return null;
  const host = requestHost();
  if (isDeployedHost(host)) return null;
  return "preview-player";
}

export async function requireUserId(bearerToken?: string): Promise<string> {
  const user = await getSessionUser(bearerToken);
  if (user) return user.id;
  const preview = previewPlayerId();
  if (preview) return preview;
  if (databaseConfigured) return guestUserId();
  if (!authConfigured) return DEV_USER_ID;
  throw new UnauthorizedError();
}
