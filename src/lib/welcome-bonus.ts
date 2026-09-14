import { createServerFn } from "@tanstack/react-start";
import { authMiddleware } from "@/lib/auth/middleware";
import { WELCOME_DESKTOP } from "@/lib/welcome-amounts";

/**
 * Welcome bonus credited once per user, claimed from the auth widget after a
 * successful sign-in/register. Idempotent: the widget calls it on EVERY login,
 * so a second call finds the ledger row and returns { claimed: false }.
 * Ledger note "welcome-bonus" is the idempotency key (credit + note check).
 *
 * Also the backend-sync point for the EMAIL path: Better Auth wrote the
 * `user` row at sign-up — this seeds wallets and pushes player_connected
 * (first time) / session_start (every login) to the Tower. For social users
 * the sync already ran in the OAuth callback; re-running it here is a cheap
 * idempotent no-op (same row, same wallets).
 */
export const claimWelcomeBonus = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .handler(async ({ context }): Promise<{ ok: true; claimed: boolean; amount: number }> => {
    const { ensureWallets, credit } = await import("@/lib/wallet.server");
    const { getPrisma } = await import("@/lib/prisma.server");
    const { syncUserOnSignIn } = await import("@/lib/auth/user-sync.server");
    const { getSql } = await import("@/lib/db");

    const userId = context.userId;
    const prisma = await getPrisma();

    // Backend sync for the email path (and idempotent re-run for social).
    try {
      const sql = await getSql();
      const rows = await sql<{ name: string; email: string | null; image: string | null }>`
        select "name", "email", "image" from "user" where "id" = ${userId} limit 1
      `;
      const dbUser = rows[0];
      if (dbUser) {
        await syncUserOnSignIn({
          providerAccountId: dbUser.email ?? userId,
          userId,
          email: dbUser.email ?? null,
          name: dbUser.name,
          picture: dbUser.image ?? null,
          provider: "email",
        });
      }
    } catch {
      /* non-fatal: bonus still claims */
    }

    // Idempotency: skip if this user already has a welcome-bonus row.
    const existing = await prisma.ledger.findFirst({
      where: { userId, type: "bonus", note: "welcome-bonus" },
      select: { id: true },
    });
    if (existing) return { ok: true, claimed: false, amount: 0 };

    await ensureWallets(userId);
    await credit(userId, "USDT", WELCOME_DESKTOP, "bonus", undefined, "welcome-bonus");

    return { ok: true, claimed: true, amount: WELCOME_DESKTOP };
  });