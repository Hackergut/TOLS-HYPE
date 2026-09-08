import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { authMiddleware } from "@/lib/auth/middleware";
import { getSql } from "@/lib/db";
import { VAPID_PUBLIC_KEY } from "@/lib/notifications/vapid";

export type NoticeKind = "win" | "promo" | "race" | "system" | "cashier";

export type Notice = {
  id: number;
  kind: NoticeKind;
  title: string;
  body: string;
  href: string | null;
  read: boolean;
  createdAt: string;
};

export type NoticePrefs = {
  wins: boolean;
  promos: boolean;
  race: boolean;
  system: boolean;
};

const DEFAULT_PREFS: NoticePrefs = { wins: true, promos: true, race: true, system: true };

async function prefsFor(userId: string): Promise<NoticePrefs> {
  const sql = await getSql();
  const rows = await sql<NoticePrefs>`
    select wins, promos, race, system from notification_prefs where user_id = ${userId}
  `;
  return rows[0] ?? DEFAULT_PREFS;
}

function prefAllows(prefs: NoticePrefs, kind: NoticeKind) {
  if (kind === "win") return prefs.wins;
  if (kind === "promo") return prefs.promos;
  if (kind === "race") return prefs.race;
  if (kind === "cashier") return prefs.system;
  return prefs.system;
}

export async function notifyUser(
  userId: string,
  input: { kind: NoticeKind; title: string; body: string; href?: string | null },
) {
  const sql = await getSql();
  const prefs = await prefsFor(userId);
  const rows = await sql<{ id: number }>`
    insert into notifications (user_id, kind, title, body, href)
    values (${userId}, ${input.kind}, ${input.title}, ${input.body}, ${input.href ?? null})
    returning id
  `;
  if (prefAllows(prefs, input.kind)) {
    const { sendPushToUser } = await import("@/lib/notifications/push.server");
    await sendPushToUser(userId, {
      title: input.title,
      body: input.body,
      href: input.href,
      kind: input.kind,
      tag: `${input.kind}-${rows[0]?.id ?? Date.now()}`,
    });
  }
}

export const getPushPublicKey = createServerFn({ method: "GET" }).handler(async () => VAPID_PUBLIC_KEY);

export const listNotifications = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .handler(async ({ context }) => {
    const sql = await getSql();
    const rows = await sql<{
      id: number;
      kind: string;
      title: string;
      body: string;
      href: string | null;
      read_at: string | null;
      created_at: string;
    }>`
      select id, kind, title, body, href, read_at, created_at
      from notifications
      where user_id = ${context.userId}
      order by created_at desc
      limit 40
    `;
    const unread = rows.filter((r) => !r.read_at).length;
    const notices: Notice[] = rows.map((r) => ({
      id: r.id,
      kind: r.kind as NoticeKind,
      title: r.title,
      body: r.body,
      href: r.href,
      read: Boolean(r.read_at),
      createdAt: r.created_at,
    }));
    return { notices, unread };
  });

export const markNotificationsRead = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator(z.object({ ids: z.array(z.number()).optional() }))
  .handler(async ({ context, data }) => {
    const sql = await getSql();
    if (data.ids?.length) {
      for (const id of data.ids) {
        await sql`
          update notifications
          set read_at = now()
          where user_id = ${context.userId} and id = ${id} and read_at is null
        `;
      }
    } else {
      await sql`
        update notifications
        set read_at = now()
        where user_id = ${context.userId} and read_at is null
      `;
    }
    return { ok: true };
  });

export const getNotificationPrefs = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .handler(async ({ context }) => prefsFor(context.userId));

export const saveNotificationPrefs = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator(
    z.object({
      wins: z.boolean(),
      promos: z.boolean(),
      race: z.boolean(),
      system: z.boolean(),
    }),
  )
  .handler(async ({ context, data }) => {
    const sql = await getSql();
    await sql`
      insert into notification_prefs (user_id, wins, promos, race, system)
      values (${context.userId}, ${data.wins}, ${data.promos}, ${data.race}, ${data.system})
      on conflict (user_id) do update set
        wins = excluded.wins,
        promos = excluded.promos,
        race = excluded.race,
        system = excluded.system
    `;
    return data;
  });

export const savePushSubscription = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator(
    z.object({
      endpoint: z.string().min(8),
      keys: z.object({ p256dh: z.string(), auth: z.string() }),
    }),
  )
  .handler(async ({ context, data }) => {
    const sql = await getSql();
    await sql`
      insert into push_subscriptions (endpoint, user_id, p256dh, auth)
      values (${data.endpoint}, ${context.userId}, ${data.keys.p256dh}, ${data.keys.auth})
      on conflict (endpoint) do update set
        user_id = excluded.user_id,
        p256dh = excluded.p256dh,
        auth = excluded.auth
    `;
    return { ok: true };
  });

export const dropPushSubscription = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator(z.object({ endpoint: z.string().optional() }))
  .handler(async ({ context, data }) => {
    const sql = await getSql();
    if (data.endpoint) {
      await sql`delete from push_subscriptions where user_id = ${context.userId} and endpoint = ${data.endpoint}`;
    } else {
      await sql`delete from push_subscriptions where user_id = ${context.userId}`;
    }
    return { ok: true };
  });

export const sendTestNotification = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .handler(async ({ context }) => {
    await notifyUser(context.userId, {
      kind: "system",
      title: "Push is live",
      body: "If this device is subscribed, you should see a native banner too.",
      href: "/alerts",
    });
    return { ok: true };
  });

export const seedWelcomeNotification = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .handler(async ({ context }) => {
    const sql = await getSql();
    const existing = await sql<{ n: number }>`
      select count(*)::int as n from notifications where user_id = ${context.userId}
    `;
    if ((existing[0]?.n ?? 0) > 0) return { seeded: false };
    await notifyUser(context.userId, {
      kind: "system",
      title: "Welcome to TOLS",
      body: "Play-money balances are minted. Originals are live — Dice, Mines, Pool Rush.",
      href: "/casino",
    });
    await notifyUser(context.userId, {
      kind: "promo",
      title: "Welcome bonus is waiting",
      body: "100% match on your first deposit, up to $1,000.",
      href: "/promotions",
    });
    await notifyUser(context.userId, {
      kind: "race",
      title: "$100,000 weekly race",
      body: "Wager Originals. Leaderboard resets Monday.",
      href: "/promotions",
    });
    return { seeded: true };
  });
