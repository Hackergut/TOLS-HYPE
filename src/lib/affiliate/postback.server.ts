/**
 * TOLS.FUN → HYPE affiliate postback (telegram subid tg_<id>).
 * Same contract as tols-bot FastAPI /postback — hosted on www.tols.fun.
 */
import { env } from "@/lib/env.server";

export type AffiliatePostbackBody = {
    subid?: string;
    event?: string;
    amount?: number;
    secret?: string;
};

function webhookSecret(): string {
    return (
          env("TOLS_AFFILIATE_WEBHOOK_SECRET") ||
          env("WEBHOOK_SECRET") ||
          env("TELEGRAM_BOT_TOKEN") || // never ideal; prefer dedicated secret
          ""
        ).trim();
}

export async function handleAffiliatePostback(request: Request): Promise<Response> {
    let body: AffiliatePostbackBody;
    try {
          body = (await request.json()) as AffiliatePostbackBody;
    } catch {
          return Response.json({ ok: false, error: "Invalid JSON" }, { status: 400 });
    }

  const secret = String(body.secret ?? "");
    const expected = webhookSecret();
    if (!expected) {
          return Response.json(
            { ok: false, error: "TOLS_AFFILIATE_WEBHOOK_SECRET (or WEBHOOK_SECRET) not configured" },
            { status: 503 },
                );
    }
    if (secret !== expected) {
          return Response.json({ ok: false, error: "Invalid secret" }, { status: 401 });
    }

  const subid = String(body.subid ?? "").trim();
    const event = String(body.event ?? "").trim().toLowerCase();
    const amount = Number(body.amount ?? 0);

  if (!subid || !event) {
        return Response.json({ ok: false, error: "subid and event required" }, { status: 400 });
  }

  // Channel traffic (no user points)
  if (subid === "tg_channel") {
        console.info("[affiliate-postback]", { subid, event, amount });
        return Response.json({ ok: true, channel: true });
  }

  if (!subid.startsWith("tg_")) {
        return Response.json({ ok: false, error: "subid must be tg_<telegramId> or tg_channel" }, { status: 400 });
  }

  const telegramId = Number(subid.slice(3));
    if (!Number.isFinite(telegramId) || telegramId <= 0) {
          return Response.json({ ok: false, error: "Invalid telegram id in subid" }, { status: 400 });
    }

  // Persist lightly via console for now; wire to DB / referral ledger in a follow-up.
  // Identity key for bot + login: telegram:<id> / tg_<id>
  console.info("[affiliate-postback]", {
        telegramId,
        subid,
        event,
        amount: Number.isFinite(amount) ? amount : 0,
  });

  return Response.json({
        ok: true,
        telegramId,
        event,
        amount: Number.isFinite(amount) ? amount : 0,
        note: "accepted — points ledger can credit telegram:" + telegramId,
  });
}
