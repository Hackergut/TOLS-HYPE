import webpush from "web-push";
import { getSql } from "@/lib/db";
import { env } from "@/lib/env.server";
import { VAPID_PUBLIC_KEY, VAPID_SUBJECT } from "@/lib/notifications/vapid";

const VAPID_PRIVATE_KEY =
  env("VAPID_PRIVATE_KEY") ?? "3LzyeOhTECXor0PNTyiQ4bJgMBjn0j4hUqJmk-iLiwA";

let configured = false;
function ensureVapid() {
  if (configured) return;
  webpush.setVapidDetails(VAPID_SUBJECT, VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY);
  configured = true;
}

export type PushPayload = {
  title: string;
  body: string;
  href?: string | null;
  kind?: string;
  tag?: string;
};

export async function sendPushToUser(userId: string, payload: PushPayload) {
  ensureVapid();
  const sql = await getSql();
  const rows = await sql<{ endpoint: string; p256dh: string; auth: string }>`
    select endpoint, p256dh, auth from push_subscriptions where user_id = ${userId}
  `;
  if (!rows.length) return;
  const body = JSON.stringify({
    title: payload.title,
    body: payload.body,
    href: payload.href ?? "/alerts",
    kind: payload.kind ?? "system",
    tag: payload.tag ?? payload.kind ?? "tols",
  });
  await Promise.all(
    rows.map(async (sub) => {
      try {
        await webpush.sendNotification(
          { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
          body,
        );
      } catch (err) {
        const status = (err as { statusCode?: number }).statusCode;
        if (status === 404 || status === 410) {
          await sql`delete from push_subscriptions where endpoint = ${sub.endpoint}`;
        }
      }
    }),
  );
}
