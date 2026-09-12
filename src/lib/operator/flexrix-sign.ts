import { createHmac, randomBytes, timingSafeEqual } from "node:crypto";
import { env } from "@/lib/env.server";

export function flexrixMerchant() {
  return env("FLEXRIX_MERCHANT_KEY") ?? "";
}
export function flexrixSecret() {
  return env("FLEXRIX_API_SECRET") ?? env("FLEXRIX_CASINO_SECRET") ?? "";
}
export function flexrixBase() {
  return (env("FLEXRIX_API_BASE") ?? "https://api.upaflex.online").replace(/\/$/, "");
}
export function flexrixConfigured() {
  return Boolean(flexrixMerchant() && flexrixSecret());
}

export function flexrixHashString(params: Record<string, string>): string {
  return Object.keys(params)
    .filter((k) => params[k] != null)
    .sort()
    .map((k) => `${k}=${encodeURIComponent(String(params[k]))}`)
    .join("&");
}

export function flexrixSign(params: Record<string, string | number | boolean>) {
  const ts = String(Math.floor(Date.now() / 1000));
  const nonce = randomBytes(16).toString("hex");
  const merged: Record<string, string> = {
    ...Object.fromEntries(Object.entries(params).map(([k, v]) => [k, String(v)])),
    "X-Merchant-Id": flexrixMerchant(),
    "X-Timestamp": ts,
    "X-Nonce": nonce,
  };
  const hashString = flexrixHashString(merged);
  const sign = createHmac("sha1", flexrixSecret()).update(hashString).digest("hex");
  return {
    hashString,
    headers: {
      "X-Merchant-Id": flexrixMerchant(),
      "X-Timestamp": ts,
      "X-Nonce": nonce,
      "X-Sign": sign,
    },
  };
}

export function flexrixVerify(
  params: Record<string, string>,
  headers: { merchantId: string | null; timestamp: string | null; nonce: string | null; sign: string | null },
  windowSec = 300,
): { ok: true } | { ok: false; code: string } {
  if (!flexrixConfigured()) return { ok: false, code: "NOT_CONFIGURED" };
  const merchantId = headers.merchantId ?? "";
  const timestamp = headers.timestamp ?? "";
  const nonce = headers.nonce ?? "";
  const sign = (headers.sign ?? "").toLowerCase();
  if (!merchantId || !timestamp || !nonce || !sign) return { ok: false, code: "AUTH_REQUIRED" };
  const ts = Number(timestamp);
  if (!Number.isFinite(ts) || Math.abs(Date.now() / 1000 - ts) > windowSec) {
    return { ok: false, code: "TIMESTAMP_EXPIRED" };
  }
  const merged = {
    ...params,
    "X-Merchant-Id": merchantId,
    "X-Timestamp": timestamp,
    "X-Nonce": nonce,
  };
  const expected = createHmac("sha1", flexrixSecret()).update(flexrixHashString(merged)).digest("hex");
  const expectedRaw = createHmac("sha1", flexrixSecret())
    .update(
      Object.keys(merged)
        .sort()
        .map((k) => `${k}=${merged[k]}`)
        .join("&"),
    )
    .digest("hex");
  try {
    const b = Buffer.from(sign);
    for (const exp of [expected, expectedRaw]) {
      const a = Buffer.from(exp);
      if (a.length === b.length && timingSafeEqual(a, b)) return { ok: true };
    }
    return { ok: false, code: "BAD_SIGNATURE" };
  } catch {
    return { ok: false, code: "BAD_SIGNATURE" };
  }
  return { ok: true };
}
