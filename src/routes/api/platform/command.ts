import { createFileRoute } from "@tanstack/react-router";
import { CURRENCIES, type Currency } from "@/lib/games-catalog";
import { requirePlatformAuth } from "@/lib/governance/platform-jwt";
import { applyGovCommand } from "@/lib/governance/platform-desk.server";
import { credit, debit, ensureWallets, snapshotBalances } from "@/lib/wallet.server";

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST,OPTIONS",
  "Access-Control-Allow-Headers": "Authorization, Content-Type",
  "Cache-Control": "no-store",
};

function parseCurrency(value: unknown): Currency {
  const v = String(value ?? "USDT");
  if ((CURRENCIES as readonly string[]).includes(v)) return v as Currency;
  return "USDT";
}

export const Route = createFileRoute("/api/platform/command")({
  server: {
    handlers: {
      OPTIONS: async () => new Response(null, { status: 204, headers: CORS }),
      POST: async ({ request }) => {
        const auth = requirePlatformAuth(request);
        if ("response" in auth) return auth.response;
        let body: Record<string, unknown>;
        try {
          body = (await request.json()) as Record<string, unknown>;
        } catch {
          return Response.json({ success: false, error: "Invalid JSON" }, { status: 400, headers: CORS });
        }
        const type = String(body.type || body.action || "");
        const payload = (body.payload ?? body.data ?? body) as Record<string, unknown>;
        try {
          if (type === "governance.wallet_adjust" || type === "governance.bonus_credit") {
            const userId = String(payload.userId ?? payload.user_id ?? "");
            const amount = Number(payload.amount);
            if (!userId || !Number.isFinite(amount) || amount === 0) {
              return Response.json({ success: false, error: "userId and non-zero amount required" }, { status: 400, headers: CORS });
            }
            const currency = parseCurrency(payload.currency);
            await ensureWallets(userId);
            if (amount > 0) {
              await credit(userId, currency, amount, type === "governance.bonus_credit" ? "bonus" : "adjust", undefined, String(payload.reason ?? type));
            } else {
              await debit(userId, currency, Math.abs(amount), "adjust", undefined, String(payload.reason ?? type));
            }
            return Response.json({ success: true, ok: true, type, balances: await snapshotBalances(userId) }, { headers: CORS });
          }
          const applied = await applyGovCommand(type, payload);
          return Response.json({ success: true, type, ...applied }, { headers: CORS });
        } catch (e) {
          return Response.json({ success: false, error: e instanceof Error ? e.message : "command failed" }, { status: 400, headers: CORS });
        }
      },
    },
  },
});
