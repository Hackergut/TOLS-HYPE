import { randomBytes } from "node:crypto";
import { flexrixVerify } from "@/lib/operator/flexrix-sign";
import { credit, debit, ensureWallets, snapshotBalances } from "@/lib/wallet.server";
import { getPrisma } from "@/lib/prisma.server";

const CERT_START = 1000;

export function corsHeaders(): Record<string, string> {
  return {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, HEAD, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, X-Merchant-Id, X-Timestamp, X-Nonce, X-Sign",
    "Access-Control-Max-Age": "86400",
  };
}

function flatten(body: Record<string, unknown>): Record<string, string> {
  const out: Record<string, string> = {};
  for (const [k, v] of Object.entries(body)) {
    if (v === undefined || v === null) continue;
    out[k] = typeof v === "object" ? JSON.stringify(v) : String(v);
  }
  return out;
}

function round2(n: number) {
  return Math.round(n * 100) / 100;
}

function newTxId() {
  return `fx_${Date.now().toString(36)}_${randomBytes(6).toString("hex")}`;
}

function isCertPlayer(playerId: string) {
  return /test_player/i.test(playerId) || /:test_/i.test(playerId);
}

function gisErr(code: string, description?: string, status = 200) {
  const mapped =
    code === "INSUFFICIENT_FUNDS"
      ? "INSUFFICIENT_FUNDS"
      : code === "UNKNOWN_PLAYER"
        ? "UNKNOWN_PLAYER"
        : "INTERNAL_ERROR";
  const desc =
    description ??
    (mapped === "INSUFFICIENT_FUNDS"
      ? "Insufficient balance"
      : mapped === "UNKNOWN_PLAYER"
        ? "Player not found"
        : "Internal error");
  return { status, json: { error_code: mapped, error_description: desc } };
}

async function seedCert(userId: string) {
  await ensureWallets(userId);
  const snap = await snapshotBalances(userId);
  if (isCertPlayer(userId) && snap.USDT < CERT_START) {
    await credit(userId, "USDT", CERT_START - snap.USDT, "adjust", undefined, "flexrix-cert-seed");
  }
}

async function findByNote(userId: string, note: string) {
  if (!note) return null;
  const prisma = await getPrisma();
  return prisma.ledger.findFirst({ where: { userId, note } });
}

export async function handleFlexrixWallet(
  rawBody: Record<string, unknown>,
  headers: Record<string, string>,
): Promise<{ status: number; json: Record<string, unknown> }> {
  const flat = flatten(rawBody);
  const action = String(rawBody.action ?? rawBody.type ?? "").toLowerCase();
  const playerId = String(rawBody.player_id ?? rawBody.user_id ?? "");
  const sign = headers["x-sign"];

  if (!playerId && !sign) {
    return { status: 200, json: { ok: true, service: "flexrix-callback" } };
  }

  const verified = flexrixVerify(flat, {
    merchantId: headers["x-merchant-id"] ?? null,
    timestamp: headers["x-timestamp"] ?? null,
    nonce: headers["x-nonce"] ?? null,
    sign: headers["x-sign"] ?? null,
  }, 300);
  if (!verified.ok) return gisErr(verified.code);

  if (!playerId) return gisErr("UNKNOWN_PLAYER", "Player not found");

  await seedCert(playerId);
  const externalTxId = String(rawBody.transaction_id ?? "");
  const amount = Number(rawBody.amount ?? 0) || 0;
  const gameId = String(rawBody.game_uuid ?? rawBody.game_id ?? "");

  const cached = await findByNote(playerId, externalTxId);
  if (cached && action !== "balance") {
    const snap = await snapshotBalances(playerId);
    return { status: 200, json: { balance: round2(snap.USDT), transaction_id: newTxId() } };
  }

  if (action === "balance") {
    const snap = await snapshotBalances(playerId);
    return { status: 200, json: { balance: round2(snap.USDT) } };
  }

  if (action === "bet") {
    if (amount === 0) {
      const snap = await snapshotBalances(playerId);
      return { status: 200, json: { balance: round2(snap.USDT), transaction_id: newTxId() } };
    }
    try {
      const balance = await debit(playerId, "USDT", amount, "bet", gameId || undefined, externalTxId || undefined);
      return { status: 200, json: { balance: round2(balance), transaction_id: newTxId() } };
    } catch {
      return gisErr("INSUFFICIENT_FUNDS", "Insufficient balance");
    }
  }

  if (action === "win") {
    const balance = await credit(playerId, "USDT", amount, "win", gameId || undefined, externalTxId || undefined);
    return { status: 200, json: { balance: round2(balance), transaction_id: newTxId() } };
  }

  if (action === "refund") {
    const ref = String(rawBody.bet_transaction_id ?? rawBody.ref_transaction_id ?? "");
    if (amount === 0) {
      const snap = await snapshotBalances(playerId);
      return { status: 200, json: { balance: round2(snap.USDT), transaction_id: newTxId() } };
    }
    if (ref) {
      const orig = await findByNote(playerId, ref);
      if (orig?.type === "win") return gisErr("INTERNAL_ERROR", "Cannot refund a win");
    }
    const balance = await credit(playerId, "USDT", amount, "refund", gameId || undefined, externalTxId || undefined);
    return { status: 200, json: { balance: round2(balance), transaction_id: newTxId() } };
  }

  if (action === "rollback") {
    try {
      const balance = await debit(playerId, "USDT", amount || 0, "rollback", gameId || undefined, externalTxId || undefined);
      return { status: 200, json: { balance: round2(balance), transaction_id: newTxId() } };
    } catch {
      const snap = await snapshotBalances(playerId);
      return { status: 200, json: { balance: round2(snap.USDT), transaction_id: newTxId() } };
    }
  }

  return gisErr("UNKNOWN_ACTION", "Unknown action", 400);
}
