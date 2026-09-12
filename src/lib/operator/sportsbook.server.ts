import { createHmac, randomBytes, timingSafeEqual } from "node:crypto";
import { env } from "@/lib/env.server";
import { credit, debit, ensureWallets, snapshotBalances } from "@/lib/wallet.server";

function sportsSecret() {
  return env("FLEXRIX_SPORTS_SECRET") ?? env("FLEXRIX_API_SECRET") ?? "";
}

function sportsJwtSecret() {
  return env("FLEXRIX_SPORTS_JWT_SECRET") ?? sportsSecret();
}

export function sportsbookOrigin() {
  return (env("FLEXRIX_SPORTS_ORIGIN") ?? "https://sports.flexrix.com").replace(/\/$/, "");
}

function hashString(params: Record<string, string>) {
  return Object.keys(params)
    .filter((k) => params[k] != null)
    .sort()
    .map((k) => `${k}=${encodeURIComponent(String(params[k]))}`)
    .join("&");
}

export function verifySportsHmac(params: Record<string, string>, headers: Record<string, string>) {
  const secret = sportsSecret();
  if (!secret) return false;
  const mid = headers["x-merchant-id"] ?? "";
  const ts = headers["x-timestamp"] ?? "";
  const nonce = headers["x-nonce"] ?? "";
  const sign = (headers["x-sign"] ?? "").toLowerCase();
  if (!mid || !ts || !nonce || !sign) return false;
  if (Math.abs(Date.now() / 1000 - Number(ts)) > 300) return false;
  const merged = { ...params, "X-Merchant-Id": mid, "X-Timestamp": ts, "X-Nonce": nonce };
  const expected = createHmac("sha1", secret).update(hashString(merged)).digest("hex");
  try {
    const a = Buffer.from(expected);
    const b = Buffer.from(sign);
    return a.length === b.length && timingSafeEqual(a, b);
  } catch {
    return false;
  }
}

function b64url(buf: Buffer) {
  return buf.toString("base64").replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

export function sportsSsoToken(userId: string, currency = "USD") {
  const secret = sportsJwtSecret();
  if (!secret) return null;
  const header = b64url(Buffer.from(JSON.stringify({ alg: "HS256", typ: "JWT" })));
  const now = Math.floor(Date.now() / 1000);
  const payload = b64url(
    Buffer.from(
      JSON.stringify({
        sub: userId,
        player_id: userId,
        currency,
        language: "en",
        lang: "en",
        iat: now,
        exp: now + 60 * 60,
      }),
    ),
  );
  const sig = b64url(createHmac("sha256", secret).update(`${header}.${payload}`).digest());
  return `${header}.${payload}.${sig}`;
}

export function englishSportsUrl(token?: string | null) {
  const base = `${sportsbookOrigin()}/en/sports`;
  if (!token) return base;
  const u = new URL(base);
  u.searchParams.set("token", token);
  u.searchParams.set("lang", "en");
  u.searchParams.set("language", "en");
  return u.toString();
}

function round2(n: number) {
  return Math.round(n * 100) / 100;
}

function newTx() {
  return `sb_${Date.now().toString(36)}_${randomBytes(4).toString("hex")}`;
}

function flatten(body: Record<string, unknown>): Record<string, string> {
  const out: Record<string, string> = {};
  for (const [k, v] of Object.entries(body)) {
    if (v == null) continue;
    out[k] = typeof v === "object" ? JSON.stringify(v) : String(v);
  }
  return out;
}

export async function handleSportsbookWallet(
  action: string,
  body: Record<string, unknown>,
  headers: Record<string, string>,
) {
  const flat = flatten(body);
  if (headers["x-sign"] && !verifySportsHmac(flat, headers)) {
    return { status: 401, json: { error_code: "INTERNAL_ERROR", error_description: "Internal error" } };
  }
  const playerId = String(body.player_id ?? body.userId ?? body.user_id ?? "");
  const amount = Number(body.amount ?? body.betAmount ?? 0) || 0;
  const verb = (action || String(body.action ?? body.method ?? "")).toLowerCase();
  if (!playerId) return { status: 200, json: { error_code: "UNKNOWN_PLAYER" } };
  await ensureWallets(playerId);

  if (verb === "balance" || verb === "getplayerinfo") {
    const snap = await snapshotBalances(playerId);
    return { status: 200, json: { balance: round2(snap.USDT), currency: "USD" } };
  }
  if (verb === "debit" || verb === "bet" || verb === "withdraw") {
    if (amount === 0) {
      const snap = await snapshotBalances(playerId);
      return { status: 200, json: { balance: round2(snap.USDT), transaction_id: newTx() } };
    }
    try {
      const balance = await debit(playerId, "USDT", amount, "sport-bet", undefined, String(body.transaction_id ?? ""));
      return { status: 200, json: { balance: round2(balance), transaction_id: newTx() } };
    } catch {
      return { status: 200, json: { error_code: "INSUFFICIENT_FUNDS", error_description: "Insufficient balance" } };
    }
  }
  if (verb === "credit" || verb === "win" || verb === "deposit") {
    const balance = await credit(playerId, "USDT", amount, "sport-win", undefined, String(body.transaction_id ?? ""));
    return { status: 200, json: { balance: round2(balance), transaction_id: newTx() } };
  }
  if (verb === "rollback" || verb === "refund") {
    const balance = await credit(playerId, "USDT", amount, "sport-refund", undefined, String(body.transaction_id ?? ""));
    return { status: 200, json: { balance: round2(balance), transaction_id: newTx() } };
  }
  const snap = await snapshotBalances(playerId);
  return { status: 200, json: { balance: round2(snap.USDT) } };
}
