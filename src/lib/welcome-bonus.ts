import { createServerFn } from "@tanstack/react-start";
import { authMiddleware } from "@/lib/auth/middleware";
import { WELCOME_DESKTOP } from "@/lib/welcome-amounts";

/**
 * Welcome bonus credited once per user, claimed from the auth widget after a
 * successful sign-in/register. Idempotent: the widget calls it on EVERY login,
 * so a second call finds the ledger row and returns { claimed: false }.
 * Ledger note "welcome-bonus" is the idempotency key (credit + note check).
 */
export const claimWelcomeBonus = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .handler(async ({ context }): Promise<{ ok: true; claimed: boolean; amount: number }> => {
    const { ensureWallets, credit } = await import("@/lib/wallet.server");
    const { getPrisma } = await import("@/lib/prisma.server");

    const userId = context.userId;
    const prisma = await getPrisma();

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