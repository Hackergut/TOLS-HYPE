import { operatorServer } from "@/lib/operator/env.server";

/** HMAC + JWT RS256 bridge to tolsgovernz — same contract as tols-casino-next BRIDGE.md */
export async function governanceFetch(path: string, init?: RequestInit) {
  const cfg = operatorServer();
  const base = cfg.governanceUrl;
  if (!base) throw new Error("GOVERNANCE_TOWER_URL not set");
  const headers: Record<string, string> = {
    "content-type": "application/json",
    ...(init?.headers as Record<string, string> | undefined),
  };
  if (cfg.governanceKey) headers["x-bridge-secret"] = cfg.governanceKey;
  const res = await fetch(`${base.replace(/\/$/, "")}${path}`, { ...init, headers });
  if (!res.ok) throw new Error(`Governance ${res.status}`);
  return res.json() as Promise<unknown>;
}

export async function governanceHealth() {
  const cfg = operatorServer();
  if (!cfg.governanceUrl) return { ok: false, error: "GOVERNANCE_TOWER_URL unset" };
  for (const path of ["/api/health", "/api/platform/health"]) {
    try {
      const data = await governanceFetch(path);
      return { ok: true, data };
    } catch {
      /* try next */
    }
  }
  return { ok: false, error: "Tower unreachable" };
}

export async function casinoHealth() {
  const origin = operatorServer().casinoOrigin;
  try {
    const res = await fetch(`${origin}/api/platform/health`, {
      signal: AbortSignal.timeout(8000),
    });
    const json = (await res.json().catch(() => ({}))) as Record<string, unknown>;
    const bridge = (json.bridge as Record<string, unknown> | undefined) ?? {};
    const db = (json.db as Record<string, unknown> | undefined) ?? {};
    return {
      ok: res.ok && (json.success === true || json.status === "ok" || Boolean(json.ok)),
      jwt: Boolean(bridge.jwtConfigured),
      db: db.ok !== false,
      origin,
    };
  } catch (err) {
    return {
      ok: false,
      jwt: false,
      db: false,
      origin,
      error: err instanceof Error ? err.message : "Casino unreachable",
    };
  }
}
