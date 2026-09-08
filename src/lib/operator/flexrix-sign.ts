import { createHmac, randomBytes, timingSafeEqual } from "node:crypto";
import { env } from "@/lib/env.server";

export function flexrixMerchant() {
  return env("FLEXRIX_MERCHANT_KEY") ?? "";
}
export function flexrixSecret() {
  return env("FLEXRIX_API_SECRET") ?? "";
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
) {
  if (!flexrixConfigured()) return false;
  const merchantId = headers.merchantId ?? "";
  const timestamp = headers.timestamp ?? "";
  const nonce = headers.nonce ?? "";
  const sign = (headers.sign ?? "").toLowerCase();
  if (!merchantId || !timestamp || !nonce || !sign) return false;
  if (merchantId !== flexrixMerchant()) return false;
  const merged = {
    ...params,
    "X-Merchant-Id": merchantId,
    "X-Timestamp": timestamp,
    "X-Nonce": nonce,
  };
  const expected = createHmac("sha1", flexrixSecret()).update(flexrixHashString(merged)).digest("hex");
  try {
    const a = Buffer.from(expected);
    const b = Buffer.from(sign);
    return a.length === b.length && timingSafeEqual(a, b);
  } catch {
    return false;
  }
}
