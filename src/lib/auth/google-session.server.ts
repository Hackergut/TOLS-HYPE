import { createHash, createHmac, timingSafeEqual } from "node:crypto";
import { env } from "@/lib/env.server";
import { isTolsHost, requestHost } from "./google-oauth";

export const SESSION_COOKIE = "tols_session";
const SESSION_TTL_SEC = 60 * 60 * 24 * 30;

export type GoogleSession = {
  id: string;
  email: string | null;
  name: string | null;
  picture: string | null;
  googleId: string;
};

function sessionSecret(): string {
  return (
    env("GOOGLE_CLIENT_SECRET") ||
    env("GOVERNANCE_BRIDGE_SECRET") ||
    env("GOOGLE_CLIENT_ID") ||
    "tols-google-session"
  );
}

export function googleUserId(sub: string): string {
  return `g_${createHash("sha256").update(sub).digest("hex").slice(0, 16)}`;
}

export function signSession(user: GoogleSession): string {
  const payload = Buffer.from(
    JSON.stringify({
      id: user.id,
      email: user.email,
      name: user.name,
      picture: user.picture,
      googleId: user.googleId,
      t: Date.now(),
    }),
  ).toString("base64url");
  const sig = createHmac("sha256", sessionSecret()).update(payload).digest("hex");
  return `${sig}.${payload}`;
}

export function readSessionToken(token: string | undefined | null): GoogleSession | null {
  if (!token) return null;
  const dot = token.indexOf(".");
  if (dot < 1) return null;
  const sig = token.slice(0, dot);
  const payload = token.slice(dot + 1);
  const expect = createHmac("sha256", sessionSecret()).update(payload).digest("hex");
  const a = Buffer.from(sig);
  const b = Buffer.from(expect);
  if (a.length !== b.length || !timingSafeEqual(a, b)) return null;
  try {
    const data = JSON.parse(Buffer.from(payload, "base64url").toString()) as GoogleSession & { t?: number };
    if (!data.id || !data.googleId) return null;
    if (typeof data.t === "number" && Date.now() - data.t > SESSION_TTL_SEC * 1000) return null;
    return {
      id: data.id,
      email: data.email ?? null,
      name: data.name ?? null,
      picture: data.picture ?? null,
      googleId: data.googleId,
    };
  } catch {
    return null;
  }
}

function cookieHeader(name: string, value: string, host: string, extra: { maxAge: number; domain?: string }): string {
  const parts = [
    `${name}=${value}`,
    "Path=/",
    `Max-Age=${extra.maxAge}`,
    "HttpOnly",
    "SameSite=Lax",
  ];
  if (extra.domain) parts.push(`Domain=${extra.domain}`);
  const h = host.split(":")[0];
  if (h !== "localhost" && h !== "127.0.0.1") parts.push("Secure");
  return parts.join("; ");
}

export function sessionSetCookies(token: string, req: Request): string[] {
  const host = requestHost(req);
  const cookies = [cookieHeader(SESSION_COOKIE, token, host, { maxAge: SESSION_TTL_SEC })];
  if (isTolsHost(host)) {
    cookies.push(cookieHeader(SESSION_COOKIE, token, host, { maxAge: SESSION_TTL_SEC, domain: ".tols.fun" }));
  }
  return cookies;
}

export function sessionClearCookies(req: Request): string[] {
  const host = requestHost(req);
  const cookies = [cookieHeader(SESSION_COOKIE, "", host, { maxAge: 0 })];
  if (isTolsHost(host)) {
    cookies.push(cookieHeader(SESSION_COOKIE, "", host, { maxAge: 0, domain: ".tols.fun" }));
  }
  return cookies;
}

export function oauthClearCookies(req: Request): string[] {
  const host = requestHost(req);
  return [
    cookieHeader("google_state", "", host, { maxAge: 0 }),
    cookieHeader("google_next", "", host, { maxAge: 0 }),
  ];
}

export function oauthSetCookies(state: string, dest: string, req: Request): string[] {
  const host = requestHost(req);
  return [
    cookieHeader("google_state", state, host, { maxAge: 600 }),
    cookieHeader("google_next", dest, host, { maxAge: 600 }),
  ];
}

export function cookieFromRequest(req: Request, name: string): string | undefined {
  const raw = req.headers.get("cookie") || "";
  for (const part of raw.split(";")) {
    const [k, ...rest] = part.trim().split("=");
    if (k === name) return rest.join("=");
  }
  return undefined;
}

export function readSessionFromRequest(req: Request): GoogleSession | null {
  return readSessionToken(cookieFromRequest(req, SESSION_COOKIE));
}

export function withCookies(res: Response, cookies: string[]): Response {
  const headers = new Headers(res.headers);
  for (const c of cookies) headers.append("Set-Cookie", c);
  return new Response(res.body, { status: res.status, statusText: res.statusText, headers });
}
