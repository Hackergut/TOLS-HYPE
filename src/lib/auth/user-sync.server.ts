import { getSql } from "@/lib/db";
import { ensureWallets } from "@/lib/wallet.server";
import { pushBridgeEvent } from "@/lib/governance/bridge";

/**
 * User-creation + backend sync for EVERY sign-in path.
 *
 * The native Google flow minted a signed session cookie without ever writing
 * a `user` row — email sign-up (Better Auth) created one, but social
 * identities never did, so the platform had two classes of users. This module
 * is the single choke point every path shares:
 *
 *   1. upsert the Better Auth `user` row (the SAME table email sign-up writes
 *      — camelCase columns, double-quoted per migrations/auth/0001_auth.sql)
 *   2. seed the wallets (idempotent, skipDuplicates)
 *   3. fire `casino.player_connected` to the Tower once per NEW user,
 *      `casino.session_start` on every sign-in
 *
 * Fail-open on DB errors — sign-in must never break because sync hiccupped
 * (same stance as the Google handler's wallet seeding).
 */

export type SocialProvider = "google" | "telegram" | "email";

export type SignInProfile = {
  /** Stable provider id (Google `sub` / Telegram user id). */
  providerAccountId: string;
  /** Local user id (g_xxx / t_xxx / e_xxx) — pre-hashed by the caller. */
  userId: string;
  email: string | null;
  name: string;
  picture: string | null;
  provider: SocialProvider;
};

/** True when a `user` row with this id already existed (vs just created). */
async function upsertUserRow(profile: SignInProfile): Promise<boolean> {
  const sql = await getSql();
  const email = profile.email?.toLowerCase() ?? null;

  // Same-provider reconnect: refresh name/image, keep id stable.
  const rows = await sql<{ id: string; email: string | null }>`
    select "id", "email" from "user" where "id" = ${profile.userId} limit 1
  `;
  if (rows.length > 0) {
    await sql`
      update "user"
      set "name" = ${profile.name},
          "image" = ${profile.picture ?? null},
          "emailVerified" = true,
          "updatedAt" = now()
      where "id" = ${profile.userId}
    `;
    return true;
  }

  // New social user. Better Auth keeps "email" UNIQUE — a social id whose
  // address already belongs to an email-signup row stores a synthetic
  // address instead of failing the sign-in.
  let finalEmail = email ?? `${profile.userId}@social.tols.fun`;
  if (email) {
    const taken = await sql<{ id: string }>`
      select "id" from "user" where "email" = ${email} limit 1
    `;
    if (taken.length > 0) finalEmail = `${profile.userId}@social.tols.fun`;
  }

  await sql`
    insert into "user" ("id", "name", "email", "emailVerified", "image", "createdAt", "updatedAt")
    values (${profile.userId}, ${profile.name}, ${finalEmail}, true, ${profile.picture ?? null}, now(), now())
    on conflict ("id") do nothing
  `;
  return false;
}

async function upsertAccountRow(profile: SignInProfile): Promise<void> {
  if (profile.provider === "email") return;
  const sql = await getSql();
  const existing = await sql<{ id: string }>`
    select "id" from "account"
    where "providerId" = ${profile.provider} and "accountId" = ${profile.providerAccountId}
    limit 1
  `;
  if (existing.length > 0) return;
  const id = `${profile.provider}:${profile.providerAccountId}`.slice(0, 64);
  await sql`
    insert into "account" ("id", "accountId", "providerId", "userId", "createdAt", "updatedAt")
    values (${id}, ${profile.providerAccountId}, ${profile.provider}, ${profile.userId}, now(), now())
    on conflict ("id") do nothing
  `;
}

/**
 * Create/refresh the user row, seed wallets, notify the Tower.
 * Never throws — sign-in proceeds even when the DB/Tower are down.
 */
export async function syncUserOnSignIn(profile: SignInProfile): Promise<void> {
  try {
    const existed = await upsertUserRow(profile);
    await upsertAccountRow(profile);
    await ensureWallets(profile.userId);
    void import("@/lib/governance/presence.server")
      .then(({ touchPresence }) =>
        touchPresence({
          userId: profile.userId,
          email: profile.email,
          name: profile.name,
          place: "lobby",
        }),
      )
      .catch(() => undefined);
    if (!existed) {
      void pushBridgeEvent("casino.player_connected", {
        userId: profile.userId,
        provider: profile.provider,
        email: profile.email,
        name: profile.name,
      }).catch(() => undefined);
    }
    void pushBridgeEvent("casino.session_start", {
      userId: profile.userId,
      provider: profile.provider,
      email: profile.email,
      name: profile.name,
    }).catch(() => undefined);
  } catch (e) {
    console.error(`[user-sync] ${profile.provider} sync failed (non-fatal):`, e);
  }
}