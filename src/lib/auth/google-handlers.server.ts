import { syncUserOnSignIn } from "./user-sync.server";
import {
  exchangeGoogle,
  googleAuthUrl,
  googleEnabled,
  googleRedirectUri,
  oauthOrigin,
  parseGoogleStateParam,
  requestHost,
  signGoogleState,
} from "./google-oauth";
import {
  googleUserId,
  oauthClearCookies,
  oauthSetCookies,
  readSessionFromRequest,
  sessionClearCookies,
  sessionSetCookies,
  signSession,
  withCookies,
} from "./google-session.server";

const CANONICAL_HOST = "www.tols.fun";

function isLocalHost(host: string): boolean {
  const h = host.split(":")[0];
  return h === "localhost" || h === "127.0.0.1" || h.endsWith(".local");
}

function redirect303(url: string, cookies: string[] = []): Response {
  return withCookies(new Response(null, { status: 303, headers: { Location: url, "cache-control": "no-store" } }), cookies);
}

function htmlHandoff(dest: string, cookies: string[]): Response {
  const html = `<!doctype html><meta charset="utf-8"><meta http-equiv="refresh" content="0;url=${dest}"><script>location.replace(${JSON.stringify(dest)})</script>`;
  return withCookies(
    new Response(html, {
      status: 200,
      headers: { "content-type": "text/html; charset=utf-8", "cache-control": "no-store" },
    }),
    cookies,
  );
}

export async function handleGoogleDiag(): Promise<Response> {
  return Response.json({
    ok: true,
    v: "g3",
    googleEnabled: googleEnabled(),
    bypassState: false,
    dest: "/",
  });
}

export async function handleGoogleMe(request: Request): Promise<Response> {
  const session = readSessionFromRequest(request);
  if (!session) return Response.json({ ok: true, user: null });
  const ua = request.headers.get("user-agent") ?? "";
  const device = /mobile|android|iphone|ipad/i.test(ua) ? "mobile" : "desktop";
  void import("@/lib/governance/presence.server")
    .then(({ touchPresence }) =>
      touchPresence({
        userId: session.id,
        email: session.email,
        name: session.name,
        device,
        place: "keep",
      }),
    )
    .catch(() => undefined);
  return Response.json({
    ok: true,
    user: {
      id: session.id,
      displayName: session.name,
      primaryEmail: session.email,
      profileImageUrl: session.picture,
      isDevFallback: false,
    },
  });
}

export async function handleGoogleStart(request: Request): Promise<Response> {
  const host = requestHost(request);
  const url = new URL(request.url);
  if (host && host !== CANONICAL_HOST && !isLocalHost(host)) {
    return redirect303(`https://${CANONICAL_HOST}/api/auth/google${url.search}`);
  }
  const origin = oauthOrigin(request);
  if (!googleEnabled()) {
    return redirect303(`${origin}/?google=not_configured`);
  }
  const next = url.searchParams.get("next");
  const dest = next && next.startsWith("/") && !next.startsWith("//") ? next : "/";
  const state = signGoogleState(dest);
  return withCookies(redirect303(googleAuthUrl(state, origin)), oauthSetCookies(state, dest, request));
}

export async function handleGoogleCallback(request: Request): Promise<Response> {
  const origin = oauthOrigin(request);
  const url = new URL(request.url);
  const failCookies = [...oauthClearCookies(request)];

  if (!googleEnabled()) {
    return redirect303(`${origin}/?google=not_configured`, failCookies);
  }

  const code = url.searchParams.get("code") || "";
  const state = url.searchParams.get("state") || "";
  const expected = (request.headers.get("cookie") || "").match(/(?:^|;\s*)google_state=([^;]+)/)?.[1];
  const signed = parseGoogleStateParam(state) || (expected ? parseGoogleStateParam(decodeURIComponent(expected)) : null);
  const cookieOk = Boolean(expected && state && (state === expected || parseGoogleStateParam(decodeURIComponent(expected))));

  if (!code) {
    return redirect303(`${origin}/?google=error&reason=missing_code`, failCookies);
  }
  if (!signed && !cookieOk) {
    // SECURITY: never exchange without a valid state — the old bypass
    // allowed login-CSRF (victim logged into the attacker's account).
    console.warn("[google-oauth] bad_state — refusing code exchange");
    return redirect303(`${origin}/?google=error&reason=bad_state`, failCookies);
  }

  let profile;
  try {
    profile = await exchangeGoogle(code, origin);
  } catch (e) {
    const errMsg = e instanceof Error ? e.message : String(e);
    console.error("[google-oauth] exchange failed:", errMsg, "| redirect_uri:", googleRedirectUri(origin));
    const short = errMsg.replace(/google token exchange failed:\s*/i, "").slice(0, 80);
    const why = `token:${short || "exchange"}`;
    return redirect303(`${origin}/?google=error&reason=${encodeURIComponent(why)}`, failCookies);
  }
  if (!profile.sub || !profile.email) {
    return redirect303(`${origin}/?google=error&reason=no_profile`, failCookies);
  }

  const user = {
    id: googleUserId(profile.sub),
    email: profile.email.toLowerCase(),
    name: profile.name || profile.email.split("@")[0],
    picture: profile.picture ?? null,
    googleId: profile.sub,
  };

  // User creation + wallet seed + Tower sync — one choke point for every path.
  await syncUserOnSignIn({
    providerAccountId: profile.sub,
    userId: user.id,
    email: user.email,
    name: user.name,
    picture: user.picture,
    provider: "google",
  });

  const token = signSession(user);
  const cookies = [...oauthClearCookies(request), ...sessionSetCookies(token, request)];
  const dest = signed?.dest || "/";
  const land = dest.includes("?") ? `${dest}&google=ok` : `${dest}?google=ok`;
  return htmlHandoff(`${origin}${land}`, cookies);
}

export async function handleGoogleLogout(request: Request): Promise<Response> {
  const origin = oauthOrigin(request);
  return redirect303(`${origin}/`, [...sessionClearCookies(request), ...oauthClearCookies(request)]);
}
