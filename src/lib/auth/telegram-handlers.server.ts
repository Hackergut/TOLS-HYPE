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
import { env } from "@/lib/env.server";
import { validateTelegramInitData } from "./telegram-initdata";

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

/** Mini App initData — different HMAC than the Login Widget. Same tols_session. */
export async function handleTelegramMiniApp(request: Request): Promise<Response> {
  if (!telegramEnabled()) {
    return Response.json({ ok: false, error: "not_configured" }, { status: 503 });
  }
  const botToken = env("TELEGRAM_BOT_TOKEN") || "";
  let initData = "";
  try {
    const body = (await request.json()) as { initData?: string };
    initData = typeof body?.initData === "string" ? body.initData : "";
  } catch {
    return Response.json({ ok: false, error: "bad_body" }, { status: 400 });
  }
  const parsed = validateTelegramInitData(initData, botToken);
  if (!parsed) {
    return Response.json({ ok: false, error: "bad_init_data" }, { status: 401 });
  }

  const userId = telegramUserId(parsed.user.id);
  const name =
    [parsed.user.first_name, parsed.user.last_name].filter(Boolean).join(" ") ||
    parsed.user.username ||
    `tg${parsed.user.id}`;

  await syncUserOnSignIn({
    providerAccountId: String(parsed.user.id),
    userId,
    email: parsed.user.username ? `${parsed.user.username}@t.me` : null,
    name,
    picture: parsed.user.photo_url ?? null,
    provider: "telegram",
  });

  const token = signSession({
    id: userId,
    email: parsed.user.username ? `${parsed.user.username}@t.me` : null,
    name,
    picture: parsed.user.photo_url ?? null,
    googleId: `telegram:${parsed.user.id}`,
  });

  return withCookies(
    Response.json({ ok: true, provider: "telegram-miniapp" }),
    sessionSetCookies(token, request),
  );
}
