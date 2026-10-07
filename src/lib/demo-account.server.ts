import { hashPassword } from "better-auth/crypto";
import { getSql } from "@/lib/db";
import { pushBridgeEvent } from "@/lib/governance/bridge";
import { getPrisma } from "@/lib/prisma.server";

/** Shared test login. Play-money only — not a real wallet. */
export const DEMO_EMAIL = "demo@tols.fun";
export const DEMO_PASSWORD = "TolsDemo2026!";
export const DEMO_NAME = "TOLS Demo";

const DEMO_USER_ID = "tols-demo";
const DEMO_ACCOUNT_ID = "tols-demo-credential";

const DEMO_BALANCES: Record<string, number> = {
  SOL: 5000,
  USDT: 250000,
  BTC: 2,
  ETH: 50,
};

let ready: Promise<void> | null = null;

/** Creates the shared demo user once per process and keeps the test balances topped up. */
export function seedDemoAccount(): Promise<void> {
  ready ??= seed().catch((err) => {
    ready = null;
    throw err;
  });
  return ready;
}

async function ensureUser(): Promise<string> {
  const sql = await getSql();
  const now = new Date();
  await sql`
    insert into "user" ("id", "name", "email", "emailVerified", "createdAt", "updatedAt")
    values (${DEMO_USER_ID}, ${DEMO_NAME}, ${DEMO_EMAIL}, true, ${now}, ${now})
    on conflict ("email") do update
      set "name" = excluded."name", "emailVerified" = true, "updatedAt" = excluded."updatedAt"
  `;
  const rows = await sql<{ id: string }>`
    select "id" from "user" where lower("email") = ${DEMO_EMAIL} limit 1
  `;
  return rows[0]?.id ?? DEMO_USER_ID;
}

async function writeCredential(userId: string) {
  const sql = await getSql();
  const password = await hashPassword(DEMO_PASSWORD);
  const now = new Date();
  const found = await sql<{ id: string }>`
    select "id" from "account"
    where "userId" = ${userId} and "providerId" = ${"credential"}
    order by "createdAt" asc
  `;
  if (found.length === 0) {
    await sql`
      insert into "account" ("id", "accountId", "providerId", "userId", "password", "createdAt", "updatedAt")
      values (${DEMO_ACCOUNT_ID}, ${userId}, ${"credential"}, ${userId}, ${password}, ${now}, ${now})
      on conflict ("id") do update
        set "password" = excluded."password",
            "userId" = excluded."userId",
            "accountId" = excluded."accountId",
            "providerId" = excluded."providerId",
            "updatedAt" = excluded."updatedAt"
    `;
    return;
  }
  const keep = found[0].id;
  await sql`
    update "account"
    set "password" = ${password}, "updatedAt" = ${now}
    where "id" = ${keep}
  `;
  for (const row of found.slice(1)) {
    await sql`delete from "account" where "id" = ${row.id} and "providerId" = ${"credential"}`;
  }
}

/** Resets the demo password on the credential row Better Auth actually reads. */
export async function ensureDemoPassword(): Promise<void> {
  const userId = await ensureUser();
  await writeCredential(userId);
}

async function seed() {
  const sql = await getSql();
  const userId = await ensureUser();
  await writeCredential(userId);
  try {
    for (const [currency, balance] of Object.entries(DEMO_BALANCES)) {
      await sql`
        insert into wallets (user_id, currency, balance)
        values (${userId}, ${currency}, ${balance})
        on conflict (user_id, currency) do update
          set balance = greatest(wallets.balance, excluded.balance)
      `;
    }
  } catch (err) {
    console.error("[demo] wallet seed", err);
  }
  try {
    const prisma = await getPrisma();
    for (const [currency, balance] of Object.entries(DEMO_BALANCES)) {
      const row = await prisma.wallet.findUnique({
        where: { userId_currency: { userId, currency } },
      });
      const current = row ? Number(row.balance) : 0;
      if (!row) {
        await prisma.wallet.create({ data: { userId, currency, balance } });
      } else if (current < balance) {
        await prisma.wallet.update({
          where: { userId_currency: { userId, currency } },
          data: { balance },
        });
      }
    }
  } catch (err) {
    console.error("[demo] wallet sync", err);
  }
  void pushBridgeEvent("casino.player_connected", {
    userId,
    provider: "email",
    email: DEMO_EMAIL,
    name: DEMO_NAME,
    balances: DEMO_BALANCES,
  }).catch(() => undefined);
}
