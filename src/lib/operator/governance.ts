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
  try {
    const data = await governanceFetch("/api/platform/health");
    return { ok: true, data };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "Tower unreachable" };
  }
}
