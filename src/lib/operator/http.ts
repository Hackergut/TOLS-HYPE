import { operatorServer } from "@/lib/operator/env.server";

export async function aggregatorFetch(path: string, body?: unknown): Promise<unknown> {
  const cfg = operatorServer();
  const base = cfg.aggregatorUrl || cfg.governanceUrl || cfg.supabaseUrl;
  if (!base) throw new Error("Set AGGREGATOR_URL (or GOVERNANCE_URL / SUPABASE_URL)");
  const headers: Record<string, string> = { "content-type": "application/json" };
  if (cfg.aggregatorKey) headers.authorization = `Bearer ${cfg.aggregatorKey}`;
  if (cfg.governanceKey) headers["x-api-key"] = cfg.governanceKey;
  if (cfg.supabaseKey) {
    headers.apikey = cfg.supabaseKey;
    headers.authorization = `Bearer ${cfg.supabaseKey}`;
  }
  const url = path.startsWith("http") ? path : `${base.replace(/\/$/, "")}${path}`;
  const res = await fetch(url, {
    method: body ? "POST" : "GET",
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });
  if (!res.ok) throw new Error(`Upstream ${res.status}`);
  return res.json();
}

export function asGames(data: unknown): import("@/lib/operator/types").RemoteGame[] {
  if (Array.isArray(data)) return data as import("@/lib/operator/types").RemoteGame[];
  if (data && typeof data === "object") {
    const o = data as { games?: unknown; items?: unknown };
    if (Array.isArray(o.games)) return o.games as import("@/lib/operator/types").RemoteGame[];
    if (Array.isArray(o.items)) return o.items as import("@/lib/operator/types").RemoteGame[];
  }
  return [];
}
