import { operatorServer } from "@/lib/operator/env.server";

/** Real payment rails on tols-casino-next. `/api/casino-deposits` is retired (410). */
export async function casinoFetch(path: string, init?: RequestInit) {
  const base = operatorServer().casinoOrigin;
  const res = await fetch(`${base}${path}`, {
    ...init,
    headers: { "content-type": "application/json", ...(init?.headers ?? {}) },
  });
  const json = (await res.json().catch(() => ({}))) as unknown;
  if (!res.ok) {
    const err =
      json && typeof json === "object" && "error" in json
        ? String((json as { error: string }).error)
        : `HTTP ${res.status}`;
    throw new Error(err);
  }
  return json;
}

export function publicCashierLinks() {
  const origin = operatorServer().casinoOrigin;
  return {
    cashier: `${origin}/deposit`,
    wallet: `${origin}/account/wallet`,
  };
}

export function paymentEndpoints() {
  return publicCashierLinks();
}
