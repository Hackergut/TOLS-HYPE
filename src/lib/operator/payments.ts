import { operatorServer } from "@/lib/operator/env.server";

/** Payments stay on tols-casino-next: on-chain deposits, Moonpay, withdrawals. */
export async function casinoFetch(path: string, init?: RequestInit) {
  const base = operatorServer().casinoOrigin;
  const res = await fetch(`${base}${path}`, {
    ...init,
    headers: { "content-type": "application/json", ...(init?.headers ?? {}) },
  });
  const json = (await res.json().catch(() => ({}))) as unknown;
  if (!res.ok) {
    const err = json && typeof json === "object" && "error" in json ? String((json as { error: string }).error) : `HTTP ${res.status}`;
    throw new Error(err);
  }
  return json;
}

export function paymentEndpoints() {
  const origin = operatorServer().casinoOrigin;
  return {
    deposits: `${origin}/api/casino-deposits`,
    withdrawals: `${origin}/api/casino-withdrawals`,
    payments: `${origin}/api/payments`,
    buy: `${origin}/api/buy`,
    watch: `${origin}/api/cron/watch-deposits`,
  };
}
