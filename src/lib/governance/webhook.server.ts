import { CURRENCIES, type Currency } from "@/lib/games-catalog";
import { credit, debit, ensureWallets, snapshotBalances } from "@/lib/wallet.server";
import {
  KNOWN_INBOUND,
  getBridgeConfig,
  signatureFromHeaders,
  verifyBridgeSignature,
  verifyBridgeTimestamp,
} from "./bridge";

function parseCurrency(value: unknown): Currency {
  const v = String(value ?? "SOL");
  if ((CURRENCIES as readonly string[]).includes(v)) return v as Currency;
  return "SOL";
}

export async function handleBridgeWebhook(request: Request): Promise<Response> {
  const raw = await request.text();
  const sig = signatureFromHeaders(request.headers);
  const hmacOk = verifyBridgeSignature(raw, sig);

  let body: Record<string, unknown>;
  try {
    body = raw ? (JSON.parse(raw) as Record<string, unknown>) : {};
  } catch {
    return Response.json({ success: false, error: "Invalid JSON" }, { status: 400 });
  }

  const type = String(body.type || body.event || "ping");

  if (type === "ping") {
    return Response.json({
      success: true,
      ok: true,
      type: "pong",
      ts: new Date().toISOString(),
      note: "Casino bridge is live",
    });
  }

  if (!hmacOk) {
    const cfg = getBridgeConfig();
    return Response.json(
      {
        success: false,
        error: cfg.hasBridgeSecret
          ? "Invalid bridge signature. Send X-Bridge-Signature: sha256=<hmac>."
          : "GOVERNANCE_BRIDGE_SECRET is not configured",
      },
      { status: cfg.hasBridgeSecret ? 401 : 503 },
    );
  }

  if (!verifyBridgeTimestamp(request.headers.get("x-bridge-timestamp"))) {
    return Response.json(
      { success: false, error: "Missing or stale X-Bridge-Timestamp (maximum clock skew: 5 minutes)" },
      { status: 401 },
    );
  }

  if (!(KNOWN_INBOUND as readonly string[]).includes(type) && !type.startsWith("governance.")) {
    return Response.json({ success: false, error: `Unknown event type: ${type}`, known: KNOWN_INBOUND }, { status: 400 });
  }

  const payload = (body.payload ?? body.data ?? {}) as Record<string, unknown>;

  try {
    if (type === "governance.wallet_adjust" || type === "governance.bonus_credit") {
      const userId = String(payload.userId ?? "");
      const amount = Number(payload.amount);
      if (!userId || !Number.isFinite(amount) || amount === 0) {
        return Response.json({ success: false, error: "userId and non-zero amount required" }, { status: 400 });
      }
      const currency = parseCurrency(payload.currency);
      await ensureWallets(userId);
      if (amount > 0) {
        await credit(userId, currency, amount, type === "governance.bonus_credit" ? "bonus" : "adjust", undefined, String(payload.reason ?? type));
      } else {
        await debit(userId, currency, Math.abs(amount), "adjust", undefined, String(payload.reason ?? type));
      }
      return Response.json({ success: true, ok: true, type, balances: await snapshotBalances(userId) });
    }
  } catch (e) {
    return Response.json(
      { success: false, error: e instanceof Error ? e.message : "command failed" },
      { status: 400 },
    );
  }

  return Response.json({ success: true, ok: true, type, accepted: true, ts: new Date().toISOString() });
}
