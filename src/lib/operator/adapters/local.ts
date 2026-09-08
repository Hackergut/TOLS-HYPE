import type { AggregatorAdapter } from "@/lib/operator/adapter";
import type { SeamlessRequest } from "@/lib/operator/types";

/** Built-in originals — no remote studio. */
export const localAdapter: AggregatorAdapter = {
  id: "local",
  label: "Local originals",
  async listGames() {
    return [];
  },
  async launch() {
    return { error: "Originals launch in-app. Set AGGREGATOR_KIND to attach a studio." };
  },
  parseWallet(body) {
    if (!body || typeof body !== "object") return null;
    const o = body as Record<string, unknown>;
    const action = String(o.action ?? "");
    if (!["balance", "bet", "win", "rollback"].includes(action)) return null;
    return {
      action: action as SeamlessRequest["action"],
      userId: String(o.userId ?? ""),
      currency: String(o.currency ?? "USDT"),
      amount: o.amount != null ? Number(o.amount) : undefined,
      txnId: o.txnId != null ? String(o.txnId) : undefined,
      gameId: o.gameId != null ? String(o.gameId) : undefined,
      roundId: o.roundId != null ? String(o.roundId) : undefined,
    };
  },
};
