import { CURRENCIES, type Currency } from "@/lib/games-catalog";
import { flexrixVerify } from "@/lib/operator/flexrix-sign";
import { credit, debit, ensureWallets, snapshotBalances } from "@/lib/wallet.server";
import { getPrisma } from "@/lib/prisma.server";

export type FlexrixWalletReply =
  | { ok: true; balance: number; currency?: string }
  | { ok: false; error_code: string };

function walletCurrency(raw: string | undefined): Currency {
  const c = (raw ?? "USD").toUpperCase();
  if (c === "USD" || c === "EUR") return "USDT";
  if ((CURRENCIES as readonly string[]).includes(c)) return c as Currency;
  return "USDT";
}

function str(v: unknown) {
  return v == null ? "" : String(v);
}

async function cachedBalance(userId: string, txnId: string, currency: Currency) {
  if (!txnId) return null;
  const prisma = await getPrisma();
  const hit = await prisma.ledger.findFirst({ where: { userId, note: txnId } });
  if (!hit) return null;
  const bal = await snapshotBalances(userId);
  return bal[currency];
}

export async function handleFlexrixWallet(
  body: Record<string, string>,
  headers: Record<string, string>,
): Promise<{ status: number; json: FlexrixWalletReply }> {
  const auth = flexrixVerify(body, {
    merchantId: headers["x-merchant-id"] ?? null,
    timestamp: headers["x-timestamp"] ?? null,
    nonce: headers["x-nonce"] ?? null,
    sign: headers["x-sign"] ?? null,
  }, 300);
  if (!auth.ok) {
    return { status: 401, json: { ok: false, error_code: auth.code } };
  }

  const action = str(body.action).toLowerCase();
  const playerId = str(body.player_id);
  const txnId = str(body.transaction_id);
  const gameId = str(body.game_uuid || body.game_id);
  const amount = Number(body.amount ?? 0);
  const currency = walletCurrency(body.currency);

  if (!playerId) return { status: 200, json: { ok: false, error_code: "UNKNOWN_PLAYER" } };

  await ensureWallets(playerId);
  const cached = await cachedBalance(playerId, txnId, currency);
  if (cached != null) return { status: 200, json: { ok: true, balance: cached, currency } };

  const snap = await snapshotBalances(playerId);

  if (action === "balance") {
    return { status: 200, json: { ok: true, balance: snap[currency], currency } };
  }

  if (action === "bet") {
    try {
      const balance = await debit(playerId, currency, amount, "bet", gameId || undefined, txnId || undefined);
      return { status: 200, json: { ok: true, balance } };
    } catch {
      return { status: 200, json: { ok: false, error_code: "INSUFFICIENT_FUNDS" } };
    }
  }

  if (action === "win") {
    const balance = await credit(playerId, currency, amount, "win", gameId || undefined, txnId || undefined);
    return { status: 200, json: { ok: true, balance } };
  }

  if (action === "refund") {
    const balance = await credit(playerId, currency, amount, "refund", gameId || undefined, txnId || undefined);
    return { status: 200, json: { ok: true, balance } };
  }

  if (action === "rollback") {
    try {
      const balance = await debit(playerId, currency, amount, "rollback", gameId || undefined, txnId || undefined);
      return { status: 200, json: { ok: true, balance } };
    } catch {
      const bal = await snapshotBalances(playerId);
      return { status: 200, json: { ok: true, balance: bal[currency] } };
    }
  }

  return { status: 400, json: { ok: false, error_code: "UNKNOWN_ACTION" } };
}
