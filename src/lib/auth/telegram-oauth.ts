import { createHash, createHmac, randomBytes, timingSafeEqual } from "node:crypto";
import { env } from "@/lib/env.server";
import { requestHost, isTolsHost } from "./google-oauth";

/**
 * Telegram Login Widget flow (official Botfather method).
 *
 *  1. GET /api/auth/telegram serves a minimal HTML page embedding
 *     telegram-widget.js with data-auth-url = /api/auth/telegram/callback.
 *     A fresh signed state rides BOTH in the auth-url and a cookie.
 *  2. The widget redirects the browser to the callback with the user params
 *     (id, first_name, username, photo_url, auth_date, hash) + our state.
 *  3. The callback verifies the state cookie (login-CSRF guard, same stance
 *     as the Google flow — no code exchange without valid state) and the
 *     widget hash (HMAC-SHA256 of the data-check-string keyed with
 *     SHA256(bot_token)) per core.telegram.org/widgets/login.
 */

export function telegramEnabled(): boolean {
  // Token alone is enough — bot username is resolved via getMe (or TELEGRAM_BOT_NAME).
  return Boolean(env("TELEGRAM_BOT_TOKEN"));
}

let cachedBotName: string | null | undefined;

/** Botfather username without @. Cached per isolate after the first getMe. */
export async function resolveTelegramBotName(): Promise<string | null> {
  const named = env("TELEGRAM_BOT_NAME")?.replace(/^@/, "").trim();
  if (named) return named;
  if (cachedBotName !== undefined) return cachedBotName;
  const token = env("TELEGRAM_BOT_TOKEN");
  if (!token) {
    cachedBotName = null;
    return null;
  }
  try {
    const res = await fetch(`https://api.telegram.org/bot${token}/getMe`, { cache: "no-store" });
    const json = (await res.json()) as { ok?: boolean; result?: { username?: string } };
    const username = json?.ok && typeof json.result?.username === "string" ? json.result.username : "";
    cachedBotName = username || null;
    return cachedBotName;
  } catch {
    cachedBotName = null;
    return null;
  }
}

export function telegramRedirectUri(origin?: string): string {
  return `${origin || "https://www.tols.fun"}/api/auth/telegram/callback`;
}

const STATE_TTL_MS = 10 * 60 * 1000;
export const TELEGRAM_STATE_COOKIE = "telegram_state";

function stateSecret(): string {
  return env("TELEGRAM_BOT_TOKEN") || env("GOVERNANCE_BRIDGE_SECRET") || "tols-telegram-state";
}

export function signTelegramState(dest: string): string {
  const safe = dest.startsWith("/") && !dest.startsWith("//") ? dest : "/";
  const payload = Buffer.from(
    JSON.stringify({ d: safe, t: Date.now(), n: randomBytes(8).toString("hex") }),
  ).toString("base64url");
  const sig = createHmac("sha256", stateSecret()).update(payload).digest("hex");
  return `${sig}.${payload}`;
}

export function readTelegramState(state: string): { dest: string } | null {
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

export type TelegramProfile = {
  id: number;
  name: string;
  username: string | null;
  picture: string | null;
};

/**
 * Verify the widget payload: hash = HMAC-SHA256(data-check-string, key) where
 * key = SHA256(bot_token). Rejects anything older than 24h.
 */
export function verifyTelegramWidget(params: URLSearchParams): TelegramProfile | null {
  const botToken = env("TELEGRAM_BOT_TOKEN");
  if (!botToken) return null;

  const data: Record<string, string> = {};
  for (const key of ["id", "first_name", "last_name", "username", "photo_url", "auth_date"]) {
    const v = params.get(key);
    if (v != null) data[key] = v;
  }
  const hash = params.get("hash") || "";
  if (!hash || !data.id || !data.auth_date) return null;

  const checkString = Object.keys(data)
    .sort()
    .map((k) => `${k}=${data[k]}`)
    .join("\n");
  const secretKey = createHash("sha256").update(botToken).digest();
  const expect = createHmac("sha256", secretKey).update(checkString).digest("hex");
  const a = Buffer.from(hash);
  const b = Buffer.from(expect);
  if (a.length !== b.length || !timingSafeEqual(a, b)) return null;

  const authDate = Number(data.auth_date);
  if (!authDate || Date.now() / 1000 - authDate > 86400) return null;

  const id = Number(data.id);
  if (!Number.isFinite(id)) return null;

  const name =
    [data.first_name, data.last_name].filter(Boolean).join(" ") ||
    data.username ||
    `tg${id}`;

  return {
    id,
    name,
    username: data.username ?? null,
    picture: data.photo_url ?? null,
  };
}

export function telegramUserId(id: number | string): string {
  return `t_${createHash("sha256").update(String(id)).digest("hex").slice(0, 16)}`;
}

/** Minimal widget host page — no React, never paints the app shell. */
export function telegramLoginPage(botName: string, callbackUrl: string, origin: string): string {
  const esc = (s: string) => s.replace(/[&<>"']/g, (c) => `&#${c.charCodeAt(0)};`);
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Sign in with Telegram</title>
<style>
  html,body{margin:0;min-height:100dvh;background:#0d0d10;color:#fff;font:14px/1.5 system-ui,sans-serif}
  .wrap{min-height:100dvh;display:grid;place-items:center;padding:24px}
  .card{display:grid;gap:16px;justify-items:center;text-align:center}
  .back{color:#8f8fa3;text-decoration:none}
  .back:hover{color:#fff}
</style>
</head>
<body>
<div class="wrap">
  <div class="card">
    <div><script async src="https://telegram.org/js/telegram-widget.js?22"
      data-telegram-login="${esc(botName)}"
      data-size="large"
      data-radius="12"
      data-userpic="true"
      data-request-access="write"
      data-auth-url="${esc(callbackUrl)}"></script></div>
    <a class="back" href="${esc(origin)}/login">Back to TOLS</a>
  </div>
</div>
</body>
</html>`;
}