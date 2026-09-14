import {
  sessionClearCookies,
  sessionSetCookies,
  signSession,
  withCookies,
} from "./google-session.server";
import {
  readTelegramState,
  resolveTelegramBotName,
  signTelegramState,
  telegramEnabled,
  telegramLoginPage,
  telegramRedirectUri,
  telegramUserId,
  verifyTelegramWidget,
  TELEGRAM_STATE_COOKIE,
} from "./telegram-oauth";
import { syncUserOnSignIn } from "./user-sync.server";
import { oauthOrigin, requestHost } from "./google-oauth";

/**
 * Telegram Login Widget handlers — mirror google-handlers.server.ts.
 * The signed session cookie is the SAME `tols_session` used by Google
 * (signSession/verify are provider-agnostic; the `googleId` field carries
 * the provider sub — `telegram:<id>` here — and only verify.server.ts
 * reads it, and only for id/email).
 */

const CANONICAL_HOST = "www.tols.fun";

function isLocalHost(host: string): boolean {
  const h = host.split(":")[0];
  return h === "localhost" || h === "127.0.0.1" || h.endsWith(".local");
}

function cookieHeader(name: string, value: string, maxAge: number): string {
  return `${name}=${encodeURIComponent(value)}; Path=/; Max-Age=${maxAge}; HttpOnly; SameSite=Lax`;
}

export async function handleTelegramDiag(): Promise<Response> {
  return Response.json({
    ok: true,
    v: "t1",
    telegramEnabled: telegramEnabled(),
    bypassState: false,
  });
}

/** Serve the widget host page + set the signed state cookie (login-CSRF). */
export async function handleTelegramStart(request: Request): Promise<Response> {
  const host = requestHost(request);
  const url = new URL(request.url);
  if (host && host !== CANONICAL_HOST && !isLocalHost(host)) {
    return withCookies(new Response(null, { status: 303, headers: { Location: `https://${CANONICAL_HOST}/api/auth/telegram${url.search}` } }), []);
  }
  const origin = oauthOrigin(request);
  if (!telegramEnabled()) {
    return new Response(null, { status: 303, headers: { Location: `${origin}/login?social=not_configured` } });
  }
  const botName = await resolveTelegramBotName();
  if (!botName) {
    return new Response(null, { status: 303, headers: { Location: `${origin}/login?social=not_configured` } });
  }
  const next = url.searchParams.get("next");
  const dest = next && next.startsWith("/") && !next.startsWith("//") ? next : "/";
  const state = signTelegramState(dest);
  const html = telegramLoginPage(botName, `${telegramRedirectUri(origin)}?state=${encodeURIComponent(state)}`, origin);
  return withCookies(
    new Response(html, {
      status: 200,
      headers: { "content-type": "text/html; charset=utf-8", "cache-control": "no-store" },
    }),
    [cookieHeader(TELEGRAM_STATE_COOKIE, state, 600)],
  );
}

/** Verify state + widget hash, sync the user, mint the session. */
export async function handleTelegramCallback(request: Request): Promise<Response> {
  const origin = oauthOrigin(request);
  const url = new URL(request.url);
  const failCookies = [cookieHeader(TELEGRAM_STATE_COOKIE, "", 0)];

  if (!telegramEnabled()) {
    return new Response(null, { status: 303, headers: { Location: `${origin}/login?social=not_configured` } });
  }

  const stateParam = url.searchParams.get("state") || "";
  const stateCookie = (request.headers.get("cookie") || "")
    .match(new RegExp(`(?:^|;\\s*)${TELEGRAM_STATE_COOKIE}=([^;]+)`))?.[1] ?? "";
  let decodedCookie = "";
  try {
    decodedCookie = decodeURIComponent(stateCookie);
  } catch {
    /* ignore */
  }
  const signed = readTelegramState(stateParam);
  const cookieOk = Boolean(decodedCookie && stateParam && decodedCookie === stateParam);

  if (!signed && !cookieOk) {
    // SECURITY: same stance as Google — never accept the payload without a
    // valid state (login-CSRF).
    console.warn("[telegram-oauth] bad_state — refusing widget payload");
    return withCookies(
      new Response(null, { status: 303, headers: { Location: `${origin}/login?social=error&reason=bad_state` } }),
      failCookies,
    );
  }
  if (signed && cookieOk && signed.dest && readTelegramState(decodedCookie)?.dest !== signed.dest) {
    console.warn("[telegram-oauth] state mismatch between cookie and param");
  }

  const profile = verifyTelegramWidget(url.searchParams);
  if (!profile) {
    return withCookies(
      new Response(null, { status: 303, headers: { Location: `${origin}/login?social=error&reason=bad_hash` } }),
      failCookies,
    );
  }

  const userId = telegramUserId(profile.id);

  // User creation + wallet seed + Tower sync — the missing piece.
  await syncUserOnSignIn({
    providerAccountId: String(profile.id),
    userId,
    email: profile.username ? `${profile.username}@t.me` : null,
    name: profile.name,
    picture: profile.picture,
    provider: "telegram",
  });

  const token = signSession({
    id: userId,
    email: profile.username ? `${profile.username}@t.me` : null,
    name: profile.name,
    picture: profile.picture,
    googleId: `telegram:${profile.id}`,
  });
  const cookies = [...failCookies, ...sessionSetCookies(token, request)];
  const dest = signed?.dest || "/";
  const land = dest.includes("?") ? `${dest}&social=ok` : `${dest}?social=ok`;
  return withCookies(
    new Response(null, { status: 303, headers: { Location: `${origin}${land}` } }),
    cookies,
  );
}

export async function handleTelegramLogout(request: Request): Promise<Response> {
  const origin = oauthOrigin(request);
  return withCookies(
    new Response(null, { status: 303, headers: { Location: `${origin}/` } }),
    [...sessionClearCookies(request)],
  );
}