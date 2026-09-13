import { CURRENCIES, type Currency } from "@/lib/games-catalog";
import { operatorServer } from "@/lib/operator/env.server";
import { resolveAdapter } from "@/lib/operator/registry";
import type { SeamlessRequest, SeamlessResponse } from "@/lib/operator/types";
import { getPrisma } from "@/lib/prisma.server";
import { credit, debit, ensureWallets, snapshotBalances } from "@/lib/wallet.server";

export { listRemoteGames, launchRemoteGame, operatorStatus } from "@/lib/operator/rpc";

function parseCurrency(value: string): Currency {
  if ((CURRENCIES as readonly string[]).includes(value)) return value as Currency;
  return "USDT";
}

async function headerAuth(headers: Record<string, string>) {
  const cfg = operatorServer();
  if (!cfg.webhookSecret) return true;
  const got = headers.authorization ?? headers["x-operator-secret"] ?? "";
  return got === cfg.webhookSecret || got === `Bearer ${cfg.webhookSecret}`;
}

/**
 * Vendor callbacks are retried on timeouts — a repeated txnId must not move
 * money twice. Mirrors the dedupe in flexrix-wallet.ts (ledger `note`).
 */
async function alreadyProcessed(userId: string, txnId: string | undefined): Promise<boolean> {
  if (!txnId) return false;
  const prisma = await getPrisma();
  const row = await prisma.ledger.findFirst({ where: { userId, note: txnId } });
  return Boolean(row);
}

export async function seamlessWallet(
  req: SeamlessRequest,
  headers: Record<string, string>,
): Promise<SeamlessResponse> {
  if (!(await headerAuth(headers))) return { ok: false, error: "Unauthorized" };
  if (!req.userId) return { ok: false, error: "Missing userId" };
  const currency = parseCurrency(String(req.currency));
  const userId = req.userId;
  await ensureWallets(userId);
  const txnId = req.txnId ?? `tx_${Date.now()}`;

  if (req.action === "balance" || req.action === "rollback") {
    const balances = await snapshotBalances(userId);
    return { ok: true, balance: balances[currency], txnId };
  }

  // Idempotency: replayed vendor callbacks return the current balance
  // without writing a second ledger row.
  if (req.txnId && (req.action === "bet" || req.action === "win") && (await alreadyProcessed(userId, req.txnId))) {
    const balances = await snapshotBalances(userId);
    return { ok: true, balance: balances[currency], txnId };
  }

  const amount = Number(req.amount ?? 0);
  try {
    if (req.action === "bet") {
      const balance = await debit(userId, currency, amount, "bet", req.gameId, txnId);
      return { ok: true, balance, txnId };
    }
    if (req.action === "win") {
      const balance = await credit(userId, currency, amount, "win", req.gameId, txnId);
      return { ok: true, balance, txnId };
    }
  } catch (err) {
    const balances = await snapshotBalances(userId);
    return {
      ok: false,
      error: err instanceof Error ? err.message : "Wallet error",
      balance: balances[currency],
    };
  }

  return { ok: false, error: "Unknown action" };
}

export async function inboundWallet(body: unknown, headers: Record<string, string>): Promise<SeamlessResponse> {
  const parsed = resolveAdapter().parseWallet(body);
  if (!parsed) return { ok: false, error: "Unrecognized wallet payload" };
  return seamlessWallet(parsed, headers);
}
