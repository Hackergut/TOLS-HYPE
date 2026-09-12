import { createHmac, randomBytes, timingSafeEqual } from "node:crypto";
import { env } from "@/lib/env.server";

const PROD_ORIGIN = "https://www.tols.fun";

export function googleEnabled(): boolean {
  return Boolean(env("GOOGLE_CLIENT_ID") && env("GOOGLE_CLIENT_SECRET"));
}

export function requestHost(req: Request): string {
  return (req.headers.get("x-forwarded-host") || req.headers.get("host") || "")
    .split(",")[0]
    .trim()
    .toLowerCase();
}

export function isTolsHost(host: string): boolean {
  const h = host.split(":")[0];
  return h === "tols.fun" || h === "www.tols.fun";
}

export function oauthOrigin(req: Request): string {
  const host = requestHost(req);
  if (isTolsHost(host)) return PROD_ORIGIN;
  const proto = (req.headers.get("x-forwarded-proto") || "https").split(",")[0].trim();
  if (host) return `${proto}://${host}`.replace(/\/+$/, "");
  const app = (env("APP_URL") ?? env("CASINO_ORIGIN") ?? PROD_ORIGIN).replace(/\/+$/, "");
  if (/tols\.fun/i.test(app)) return PROD_ORIGIN;
  return app;
}

export function googleRedirectUri(origin?: string): string {
  return `${origin || PROD_ORIGIN}/api/auth/google/callback`;
}

export function googleAuthUrl(state: string, origin?: string): string {
  const u = new URL("https://accounts.google.com/o/oauth2/v2/auth");
  u.searchParams.set("client_id", env("GOOGLE_CLIENT_ID") as string);
  u.searchParams.set("redirect_uri", googleRedirectUri(origin));
  u.searchParams.set("response_type", "code");
  u.searchParams.set("scope", "openid email profile");
  u.searchParams.set("state", state);
  return u.toString();
}

const STATE_TTL_MS = 10 * 60 * 1000;

function stateSecret(): string {
  return env("GOOGLE_CLIENT_SECRET") || env("GOOGLE_CLIENT_ID") || "tols-google-state";
}

export function signGoogleState(dest: string): string {
  const safe = dest.startsWith("/") && !dest.startsWith("//") ? dest : "/";
  const payload = Buffer.from(
    JSON.stringify({ d: safe, t: Date.now(), n: randomBytes(8).toString("hex") }),
  ).toString("base64url");
  const sig = createHmac("sha256", stateSecret()).update(payload).digest("hex");
  return `${sig}.${payload}`;
}

export function readGoogleState(state: string): { dest: string } | null {
  const dot = state.indexOf(".");
  if (dot < 1) return null;
  const sig = state.slice(0, dot);
  const payload = state.slice(dot + 1);
  if (!payload) return null;
  const expect = createHmac("sha256", stateSecret()).update(payload).digest("hex");
  const a = Buffer.from(sig);
  const b = Buffer.from(expect);
  if (a.length !== b.length || !timingSafeEqual(a, b)) return null;
  try {
    const data = JSON.parse(Buffer.from(payload, "base64url").toString()) as { d?: string; t?: number };
    if (typeof data.t !== "number" || Date.now() - data.t > STATE_TTL_MS || Date.now() < data.t - 30_000) {
      return null;
    }
    const dest =
      typeof data.d === "string" && data.d.startsWith("/") && !data.d.startsWith("//") ? data.d : "/";
    return { dest };
  } catch {
    return null;
  }
}

export function parseGoogleStateParam(raw: string): { dest: string } | null {
  const trimmed = String(raw || "")
    .trim()
    .replace(/^"+|"+$/g, "");
  if (!trimmed) return null;
  const candidates = [trimmed];
  try {
    candidates.push(decodeURIComponent(trimmed));
  } catch {
    /* ignore */
  }
  candidates.push(trimmed.replace(/ /g, "+"));
  for (const s of candidates) {
    const got = readGoogleState(s);
    if (got) return got;
  }
  return null;
}

export interface GoogleProfile {
  sub: string;
  email: string;
  name: string;
  picture?: string;
}

export async function exchangeGoogle(code: string, origin?: string): Promise<GoogleProfile> {
  const r = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      code,
      client_id: env("GOOGLE_CLIENT_ID") as string,
      client_secret: env("GOOGLE_CLIENT_SECRET") as string,
      redirect_uri: googleRedirectUri(origin),
      grant_type: "authorization_code",
    }),
    signal: AbortSignal.timeout(8_000),
  });
  const t = (await r.json()) as { access_token?: string; error?: string; error_description?: string };
  if (!t.access_token) {
    const detail = [t.error, t.error_description].filter(Boolean).join(": ") || "no access_token";
    throw new Error(`google token exchange failed: ${detail}`);
  }
  const ui = (await (
    await fetch("https://openidconnect.googleapis.com/v1/userinfo", {
      headers: { Authorization: `Bearer ${t.access_token}` },
      signal: AbortSignal.timeout(8_000),
    })
  ).json()) as { sub?: string; email?: string; name?: string; picture?: string };
  return {
    sub: String(ui.sub ?? ""),
    email: String(ui.email ?? ""),
    name: String(ui.name ?? ""),
    picture: ui.picture ? String(ui.picture) : undefined,
  };
}
