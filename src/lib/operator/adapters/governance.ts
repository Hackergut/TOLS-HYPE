import type { AggregatorAdapter } from "@/lib/operator/adapter";
import { env } from "@/lib/env.server";
import type { SeamlessRequest } from "@/lib/operator/types";

function tower() {
  return (env("GOVERNANCE_TOWER_URL") ?? env("VITE_GOVERNANCE_URL") ?? "").replace(/\/$/, "");
}

function headers() {
  const h: Record<string, string> = { "content-type": "application/json" };
  const secret = env("GOVERNANCE_BRIDGE_SECRET") ?? env("GOVERNANCE_API_KEY");
  if (secret) h["x-bridge-secret"] = secret;
  return h;
}

/** TOLS-GOVERNANCE (gov.tols.fun) — catalog, KYC, RTP, payouts. */
export const governanceAdapter: AggregatorAdapter = {
  id: "governance",
  label: "TOLS Governance tower",
  async listGames() {
    const base = tower();
    if (!base) return [];
    const res = await fetch(`${base}/api/api-hub`, { headers: headers() });
    if (!res.ok) return [];
    const data = (await res.json()) as { integrations?: { id: string; name: string; type: string }[] };
    return (data.integrations ?? [])
      .filter((i) => i.type.startsWith("casino") || i.type === "custom")
      .map((i) => ({ id: i.id, title: i.name, provider: "Governance" }));
  },
  async launch(req) {
    const base = tower();
    if (!base) return { error: "Set GOVERNANCE_TOWER_URL + GOVERNANCE_BRIDGE_SECRET" };
    const res = await fetch(`${base}/api/games/launch`, {
      method: "POST",
      headers: headers(),
      body: JSON.stringify({
        gameId: req.gameId,
        userId: req.userId,
        currency: req.currency,
      }),
    });
    if (!res.ok) return { error: `Governance ${res.status}` };
    return (await res.json()) as { url?: string; html?: string; error?: string };
  },
  parseWallet(body) {
    if (!body || typeof body !== "object") return null;
    const o = body as Record<string, unknown>;
    const action = String(o.action ?? "");
    if (!["balance", "bet", "win", "rollback"].includes(action)) return null;
    return {
      action: action as SeamlessRequest["action"],
      userId: String(o.userId ?? o.playerId ?? ""),
      currency: String(o.currency ?? "USDT"),
      amount: o.amount != null ? Number(o.amount) : undefined,
      txnId: o.txnId != null ? String(o.txnId) : undefined,
      gameId: o.gameId != null ? String(o.gameId) : undefined,
    };
  },
};
