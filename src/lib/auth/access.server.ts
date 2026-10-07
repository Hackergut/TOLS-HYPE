import { hashPassword } from "better-auth/crypto";
import { getSql } from "@/lib/db";
import { pushBridgeEvent } from "@/lib/governance/bridge";
import { ensureWallets } from "@/lib/wallet.server";

const CURRENCIES = ["SOL", "USDT", "BTC", "ETH"] as const;

let columnReady: Promise<void> | null = null;

function ensureColumn(): Promise<void> {
  columnReady ??= getSql()
    .then((sql) => sql`alter table player_controls add column if not exists sessions_revoked_at timestamptz`)
    .then(() => undefined)
    .catch((err) => {
      columnReady = null;
      throw err;
    });
  return columnReady;
}

export async function loginBlocked(email: string): Promise<boolean> {
  const sql = await getSql();
  const rows = await sql<{ blocked: boolean | null }>`
    select c.blocked
    from "user" u
    left join player_controls c on c.user_id = u."id"
    where lower(u."email") = ${email.trim().toLowerCase()}
    limit 1
  `.catch(() => [] as { blocked: boolean | null }[]);
  return Boolean(rows[0]?.blocked);
}

/** False when governance blocked the player or revoked sessions after this cookie was issued. */
export async function sessionAllowed(userId: string, sessionCreatedAt: Date | string): Promise<boolean> {
  await ensureColumn();
  const sql = await getSql();
  const rows = await sql<{ blocked: boolean; revoked: string | null }>`
    select blocked, sessions_revoked_at as revoked
    from player_controls
    where user_id = ${userId}
    limit 1
  `.catch(() => [] as { blocked: boolean; revoked: string | null }[]);
  const row = rows[0];
  if (!row) return true;
  if (row.blocked) return false;
  if (!row.revoked) return true;
  const revoked = new Date(row.revoked).getTime();
  const created = new Date(sessionCreatedAt).getTime();
  if (!Number.isFinite(revoked) || !Number.isFinite(created)) return true;
  return created >= revoked;
}

export async function revokeSessions(userId: string): Promise<void> {
  await ensureColumn();
  const sql = await getSql();
  await sql`delete from "session" where "userId" = ${userId}`.catch(() => undefined);
  await sql`
    insert into player_controls (user_id, sessions_revoked_at, updated_at, updated_by)
    values (${userId}, now(), now(), 'tower')
    on conflict (user_id) do update set
      sessions_revoked_at = now(),
      updated_at = now(),
      updated_by = 'tower'
  `.catch(() => undefined);
}

/** Tower creates or refreshes a login. Password is required only for a new email. */
export async function grantAccess(payload: Record<string, unknown>) {
  const email = String(payload.email ?? "").trim().toLowerCase();
  const name = String(payload.name ?? payload.username ?? "Player").trim() || "Player";
  const password = payload.password == null ? "" : String(payload.password);
  if (!email.includes("@")) throw new Error("email required");
  await ensureColumn();

  const sql = await getSql();
  const existing = await sql<{ id: string }>`
    select "id" from "user" where lower("email") = ${email} limit 1
  `;
  const userId = existing[0]?.id ?? String(payload.userId ?? payload.user_id ?? `e_${crypto.randomUUID()}`);
  const now = new Date();

  if (!existing[0]) {
    if (password.length < 8) throw new Error("password required (8+ characters)");
    await sql`
      insert into "user" ("id", "name", "email", "emailVerified", "createdAt", "updatedAt")
      values (${userId}, ${name}, ${email}, true, ${now}, ${now})
      on conflict ("id") do nothing
    `;
  } else {
    await sql`
      update "user" set "name" = ${name}, "emailVerified" = true, "updatedAt" = ${now}
      where "id" = ${userId}
    `;
  }

  if (password.length >= 8) {
    const hash = await hashPassword(password);
    const found = await sql<{ id: string }>`
      select "id" from "account"
      where "userId" = ${userId} and "providerId" = ${"credential"}
      limit 1
    `;
    if (found[0]) {
      await sql`
        update "account" set "password" = ${hash}, "updatedAt" = ${now}
        where "id" = ${found[0].id}
      `;
    } else {
      const accountId = `${userId}-credential`;
      await sql`
        insert into "account" ("id", "accountId", "providerId", "userId", "password", "createdAt", "updatedAt")
        values (${accountId}, ${userId}, ${"credential"}, ${userId}, ${hash}, ${now}, ${now})
        on conflict ("id") do update set
          "password" = excluded."password",
          "userId" = excluded."userId",
          "updatedAt" = excluded."updatedAt"
      `;
    }
  }

  await ensureWallets(userId);
  const balances = (payload.balances ?? {}) as Record<string, unknown>;
  const applied: Record<string, number> = {};
  for (const currency of CURRENCIES) {
    const amount = Number(balances[currency]);
    if (!Number.isFinite(amount) || amount <= 0) continue;
    await sql`
      insert into wallets (user_id, currency, balance)
      values (${userId}, ${currency}, ${amount})
      on conflict (user_id, currency) do update
        set balance = greatest(wallets.balance, excluded.balance)
    `;
    applied[currency] = amount;
  }

  await sql`
    insert into player_controls (user_id, blocked, block_reason, updated_at, updated_by)
    values (${userId}, false, null, now(), 'tower')
    on conflict (user_id) do update set
      blocked = false,
      block_reason = null,
      updated_at = now(),
      updated_by = 'tower'
  `.catch(() => undefined);

  void pushBridgeEvent("casino.player_connected", {
    userId,
    provider: "email",
    email,
    name,
    balances: applied,
    source: "governance.access_grant",
  }).catch(() => undefined);

  return { applied: true, action: "access_grant", userId, email, name };
}
