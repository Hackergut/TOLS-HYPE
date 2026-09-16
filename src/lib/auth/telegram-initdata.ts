import { createHmac, timingSafeEqual } from "node:crypto";

/**
 * Telegram Mini App initData validation (server only).
 *
 * Official algorithm:
 *   secret_key = HMAC_SHA256(key="WebAppData", data=<bot_token>)
 *   data_check_string = every field except `hash` and `signature`,
 *                       sorted by key, joined as "k=v\n"
 *   hash = hex(HMAC_SHA256(key=secret_key, data=data_check_string))
 *
 * Widget login uses a DIFFERENT key (SHA256(bot_token)) — see telegram-oauth.ts.
 * Never reuse one verifier for both.
 */

export type TelegramMiniUser = {
  id: string;
  username?: string;
  first_name?: string;
  last_name?: string;
  photo_url?: string;
};

export type ParsedInitData = {
  user: TelegramMiniUser;
  auth_date: number;
  hash: string;
};

export const TELEGRAM_INITDATA_MAX_AGE_SEC = 24 * 60 * 60;

function hexBuf(hex: string): Buffer | null {
  if (!/^[0-9a-fA-F]+$/.test(hex) || hex.length % 2 !== 0) return null;
  return Buffer.from(hex, "hex");
}

export function validateTelegramInitData(
  initData: string,
  botToken: string,
  opts?: { now?: number; maxAgeSec?: number },
): ParsedInitData | null {
  if (!initData || !botToken) return null;
  const params = new URLSearchParams(initData);
  const hash = params.get("hash");
  const authDate = Number(params.get("auth_date") ?? 0);
  if (!hash || !Number.isFinite(authDate) || authDate <= 0) return null;

  const now = opts?.now ?? Date.now() / 1000;
  const maxAge = opts?.maxAgeSec ?? TELEGRAM_INITDATA_MAX_AGE_SEC;
  const ageSec = now - authDate;
  if (ageSec > maxAge || ageSec < -60) return null;

  const keys = [...new Set([...params.keys()])]
    .filter((k) => k !== "hash" && k !== "signature")
    .sort();
  const dataCheckString = keys.map((k) => `${k}=${params.get(k)}`).join("\n");

  const secret = createHmac("sha256", "WebAppData").update(botToken).digest();
  const calc = createHmac("sha256", secret).update(dataCheckString).digest("hex");

  const a = hexBuf(calc);
  const b = hexBuf(hash);
  if (!a || !b || a.length !== b.length || !timingSafeEqual(a, b)) return null;

  let parsed: {
    id?: string | number;
    username?: string;
    first_name?: string;
    last_name?: string;
    photo_url?: string;
  } | null = null;
  try {
    parsed = JSON.parse(params.get("user") || "null");
  } catch {
    return null;
  }
  if (!parsed || parsed.id == null || parsed.id === "") return null;

  return {
    user: {
      id: String(parsed.id),
      username: parsed.username,
      first_name: parsed.first_name,
      last_name: parsed.last_name,
      photo_url: parsed.photo_url,
    },
    auth_date: authDate,
    hash,
  };
}
