import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { authMiddleware } from "@/lib/auth/middleware";
import { getSql } from "@/lib/db";
import { CURRENCIES, type Currency } from "@/lib/games-catalog";
import { asNumber } from "@/lib/format";
import { credit, debit, ensureWallets, snapshotBalances } from "@/lib/wallet.server";
import { pushBridgeEvent } from "@/lib/governance/bridge";
import { screenChat } from "@/lib/chat-guard";
import { VIP_TIERS, vipTierIndex } from "@/lib/vip";

const currencySchema = z.enum(CURRENCIES);
const roomSchema = z.enum(["en", "sports", "it"]);

async function findUser(name: string) {
  const sql = await getSql();
  const rows = await sql<{ id: string; name: string | null }>`
    select id, name from "user" where lower(name) = lower(${name.trim()}) limit 1
  `;
  return rows[0] ?? null;
}

async function displayName(userId: string) {
  const sql = await getSql();
  const rows = await sql<{ name: string | null }>`select name from "user" where id = ${userId} limit 1`;
  return rows[0]?.name?.trim() || "player";
}

async function vipFor(userId: string) {
  const sql = await getSql();
  const sums = await sql<{ wagered: string; bets: string }>`
    select coalesce(sum(amount), 0)::text as wagered, count(*)::text as bets
    from transactions
    where user_id = ${userId} and type = 'bet'
  `;
  const wagered = asNumber(sums[0]?.wagered);
  const vip = VIP_TIERS[vipTierIndex(wagered)]?.name ?? "Member";
  return { vip, wagered, bets: asNumber(sums[0]?.bets) };
}

async function lastLedger(userId: string, type: string) {
  const sql = await getSql();
  const rows = await sql<{ ms: string }>`
    select (extract(epoch from created_at) * 1000)::text as ms
    from transactions
    where user_id = ${userId} and type = ${type}
    order by id desc
    limit 1
  `;
  return asNumber(rows[0]?.ms);
}

async function insertChat(row: {
  room: string;
  userId: string;
  name: string;
  vip: string;
  kind: string;
  body: string;
  payload: Record<string, unknown>;
}) {
  const sql = await getSql();
  await sql`
    insert into chat_messages (room, user_id, user_name, vip, kind, body, payload)
    values (
      ${row.room},
      ${row.userId},
      ${row.name},
      ${row.vip},
      ${row.kind},
      ${row.body},
      ${JSON.stringify(row.payload)}::jsonb
    )
  `;
}

export const chatProfile = createServerFn({ method: "POST" })
  .validator(z.object({ name: z.string().min(1).max(40) }))
  .handler(async ({ data }) => {
    const row = await findUser(data.name);
    if (!row) return { found: false as const, name: data.name, vip: "Member", wagered: 0, bets: 0 };
    const stats = await vipFor(row.id);
    return { found: true as const, name: row.name ?? data.name, id: row.id, ...stats };
  });

export const listChat = createServerFn({ method: "GET" })
  .validator(z.object({ room: roomSchema }))
  .handler(async ({ data }) => {
    const sql = await getSql();
    const rows = await sql<{
      id: string;
      user_name: string;
      vip: string;
      kind: string;
      body: string;
      payload: unknown;
    }>`
      select id::text, user_name, vip, kind, body, payload
      from chat_messages
      where room = ${data.room}
      order by id desc
      limit 80
    `;
    const online = await sql<{ n: string }>`
      select count(distinct user_id)::text as n
      from chat_messages
      where room = ${data.room} and created_at > now() - interval '10 minutes'
    `;
    return {
      online: asNumber(online[0]?.n),
      messages: rows.reverse().map((r) => ({
        id: Number(r.id),
        user: r.user_name,
        vip: r.vip,
        kind: r.kind,
        text: r.body,
        payload: typeof r.payload === "string" ? JSON.parse(r.payload) : (r.payload ?? {}),
      })),
    };
  });

export const postChat = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator(
    z.object({
      room: roomSchema,
      text: z.string().max(200),
      round: z.record(z.string(), z.unknown()).optional(),
    }),
  )
  .handler(async ({ context, data }) => {
    const sql = await getSql();
    const recent = await sql<{ body: string; ms: string }>`
      select body, (extract(epoch from created_at) * 1000)::text as ms
      from chat_messages
      where user_id = ${context.userId} and kind in ('text', 'win')
      order by id desc
      limit 6
    `;
    const verdict = screenChat(data.text, {
      now: Date.now(),
      ownTimes: recent.map((r) => asNumber(r.ms)).reverse(),
      lastOwn: recent[0]?.body ?? "",
    });
    if (!verdict.ok) throw new Error(verdict.reason);
    const name = await displayName(context.userId);
    const stats = await vipFor(context.userId);
    await insertChat({
      room: data.room,
      userId: context.userId,
      name,
      vip: stats.vip,
      kind: data.round ? "win" : "text",
      body: verdict.text,
      payload: data.round ? { round: data.round } : {},
    });
    return { ok: true as const, vip: stats.vip, name };
  });

export const chatTip = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator(
    z.object({
      to: z.string().min(1).max(40),
      amount: z.number().positive().max(5000),
      currency: currencySchema,
      room: roomSchema.default("en"),
    }),
  )
  .handler(async ({ context, data }) => {
    const prev = await lastLedger(context.userId, "tip");
    if (prev && Date.now() - prev < 15_000) throw new Error("Tip slow mode · 15s");
    if (data.amount < 0.2) throw new Error("Minimum tip is 0.20");
    const target = await findUser(data.to);
    if (!target) throw new Error("Player not found");
    if (target.id === context.userId) throw new Error("You can't tip yourself");
    await ensureWallets(context.userId);
    await ensureWallets(target.id);
    const currency = data.currency as Currency;
    await debit(context.userId, currency, data.amount, "tip", "chat", `tip ${target.name ?? data.to}`);
    try {
      await credit(target.id, currency, data.amount, "tip", "chat", `tip from ${context.userId}`);
    } catch (err) {
      await credit(context.userId, currency, data.amount, "tip", "chat", "tip refund");
      throw err;
    }
    const name = await displayName(context.userId);
    const stats = await vipFor(context.userId);
    const to = target.name ?? data.to;
    await insertChat({
      room: data.room,
      userId: context.userId,
      name,
      vip: stats.vip,
      kind: "tip",
      body: "",
      payload: { to, amount: data.amount.toFixed(2), asset: currency },
    });
    void pushBridgeEvent("casino.tip", {
      userId: context.userId,
      to: target.id,
      amount: data.amount,
      currency,
    });
    return {
      balances: await snapshotBalances(context.userId),
      to,
      amount: data.amount,
      currency,
    };
  });

export const chatRain = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator(
    z.object({
      amount: z.number().positive().max(2000),
      currency: currencySchema,
      room: roomSchema.default("en"),
    }),
  )
  .handler(async ({ context, data }) => {
    const prev = await lastLedger(context.userId, "rain");
    if (prev && Date.now() - prev < 60_000) throw new Error("Rain slow mode · 60s");
    if (data.amount < 1) throw new Error("Minimum rain is 1.00");
    const sql = await getSql();
    const recent = await sql<{ id: string; user_name: string }>`
      select distinct on (user_id) user_id as id, user_name
      from chat_messages
      where room = ${data.room}
        and user_id <> ${context.userId}
        and created_at > now() - interval '30 minutes'
      order by user_id, created_at desc
      limit 8
    `;
    if (recent.length < 2) throw new Error("Need 2 players who spoke in this room");
    const share = Math.floor((data.amount / recent.length) * 100) / 100;
    if (share < 0.01) throw new Error("Rain is too thin");
    const total = Math.round(share * recent.length * 100) / 100;
    const currency = data.currency as Currency;
    await ensureWallets(context.userId);
    await debit(context.userId, currency, total, "rain", "chat", `rain ${recent.length}`);
    const paid: string[] = [];
    try {
      for (const row of recent) {
        await ensureWallets(row.id);
        await credit(row.id, currency, share, "rain", "chat", `rain from ${context.userId}`);
        paid.push(row.id);
      }
    } catch (err) {
      const refund = share * (recent.length - paid.length);
      if (refund > 0) await credit(context.userId, currency, refund, "rain", "chat", "rain refund");
      throw err;
    }
    const name = await displayName(context.userId);
    const stats = await vipFor(context.userId);
    const names = recent.map((t) => t.user_name || "player");
    await insertChat({
      room: data.room,
      userId: context.userId,
      name,
      vip: stats.vip,
      kind: "rain",
      body: "",
      payload: { names, share: share.toFixed(2), asset: currency },
    });
    void pushBridgeEvent("casino.rain", {
      userId: context.userId,
      amount: total,
      currency,
      recipients: recent.map((t) => t.id),
    });
    return {
      balances: await snapshotBalances(context.userId),
      share,
      total,
      currency,
      names,
    };
  });
