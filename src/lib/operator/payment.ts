import { env } from "@/lib/env.server";

/** Payment stays on tols-casino-next — this UI proxies deposits/withdrawals. */
export function casinoOrigin() {
  return (env("TOLS_CASINO_URL") ?? env("APP_URL") ?? "https://www.tols.fun").replace(/\/$/, "");
}

export async function proxyCasino(path: string, init?: RequestInit) {
  const url = `${casinoOrigin()}${path}`;
  const secret = env("GOVERNANCE_BRIDGE_SECRET") ?? env("OPERATOR_WEBHOOK_SECRET") ?? "";
  const headers = new Headers(init?.headers);
  headers.set("content-type", "application/json");
  if (secret) headers.set("x-bridge-secret", secret);
  const res = await fetch(url, { ...init, headers });
  const text = await res.text();
  try {
    return { status: res.status, body: JSON.parse(text) as unknown };
  } catch {
    return { status: res.status, body: { raw: text } };
  }
}

export async function createDeposit(input: { userId: string; currency: string; amount: number; chain?: string }) {
  return proxyCasino("/api/casino-deposits", { method: "POST", body: JSON.stringify(input) });
}

export async function createWithdrawal(input: { userId: string; currency: string; amount: number; address: string }) {
  return proxyCasino("/api/casino-withdrawals", { method: "POST", body: JSON.stringify(input) });
}

export async function buyCryptoWidget() {
  return {
    provider: env("NEXT_PUBLIC_BUY_PROVIDER") ?? "moonpay",
    publishable: env("NEXT_PUBLIC_BUY_API_KEY") ?? "",
  };
}
