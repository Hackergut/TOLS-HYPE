import { operatorServer } from "@/lib/operator/env.server";
import { bridgeFetch, getBridgeConfig, probeGovernanceHealth } from "@/lib/governance/bridge";

/** HMAC + JWT RS256 bridge to tolsgovernz — same contract as tols-casino-next BRIDGE.md */
export async function governanceFetch(path: string, init?: RequestInit) {
  const method = (init?.method || (init?.body ? "POST" : "GET")).toUpperCase();
  let body: unknown;
  if (typeof init?.body === "string") body = init.body;
  else if (init?.body) body = init.body;
  const res = await bridgeFetch({
    path,
    method,
    body,
    useOrigin: true,
  });
  if (!res.ok) throw new Error(`Governance ${res.status}`);
  return res.json() as Promise<unknown>;
}

export async function governanceHealth() {
  const cfg = getBridgeConfig();
  if (!cfg.towerOrigin) return { ok: false, error: "GOVERNANCE_TOWER_URL unset" };
  const probe = await probeGovernanceHealth(4000);
  if (probe.reachable) return { ok: true, data: probe };
  return { ok: false, error: probe.error || "Tower unreachable" };
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
