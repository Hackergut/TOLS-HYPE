import { CURRENCIES, STARTING_BALANCES, emptyBalances, type Currency } from "@/lib/games-catalog";
import { asNumber } from "@/lib/format";
import { getPrisma } from "@/lib/prisma.server";

function parseCurrency(value: string): Currency {
  if ((CURRENCIES as readonly string[]).includes(value)) return value as Currency;
  return "USDT";
}

function money(value: { toString(): string } | number | string | null | undefined): number {
  if (value == null) return 0;
  return asNumber(typeof value === "number" ? value : value.toString());
}

export async function ensureWallets(userId: string) {
  const prisma = await getPrisma();
  await prisma.wallet.createMany({
    data: CURRENCIES.map((currency) => ({
      userId,
      currency,
      balance: STARTING_BALANCES[currency],
    })),
    skipDuplicates: true,
  });
}

export async function debit(
  userId: string,
  currency: Currency,
  amount: number,
  type: string,
  gameId?: string,
  note?: string,
) {
  if (amount <= 0) {
    const prisma = await getPrisma();
    const row = await prisma.wallet.findUnique({
      where: { userId_currency: { userId, currency } },
    });
    return money(row?.balance);
  }
  const prisma = await getPrisma();
  const balance = await prisma.$transaction(async (tx) => {
    // Atomic conditional decrement: two concurrent bets can no longer both pass
    // a stale read-then-check and overdraw the wallet (classic TOCTOU race).
    const res = await tx.wallet.updateMany({
      where: { userId, currency, balance: { gte: amount } },
      data: { balance: { decrement: amount } },
    });
    if (res.count === 0) throw new Error("Insufficient balance");
    const row = await tx.wallet.findUnique({
      where: { userId_currency: { userId, currency } },
    });
    const next = money(row?.balance);
    await tx.ledger.create({
      data: {
        userId,
        type,
        amount,
        currency,
        gameId: gameId ?? null,
        note: note ?? null,
      },
    });
    return next;
  });
  if (type === "bet" && gameId) {
    void import("@/lib/governance/presence.server")
      .then(({ touchPresence }) =>
        touchPresence({
          userId,
          gameId,
          place: "game",
          wager: amount,
        }),
      )
      .catch(() => undefined);
  }
  return balance;
}

export async function credit(
  userId: string,
  currency: Currency,
  amount: number,
  type: string,
  gameId?: string,
  note?: string,
) {
  const prisma = await getPrisma();
  const next = await prisma.$transaction(async (tx) => {
    // Atomic increment: concurrent credits (payouts, bonuses) can no longer
    // lose an update through a read-then-write race.
    const res = await tx.wallet.updateMany({
      where: { userId, currency },
      data: { balance: { increment: amount } },
    });
    if (res.count === 0) throw new Error("Wallet missing");
    if (amount > 0) {
      await tx.ledger.create({
        data: {
          userId,
          type,
          amount,
          currency,
          gameId: gameId ?? null,
          note: note ?? null,
        },
      });
    }
    const row = await tx.wallet.findUnique({
      where: { userId_currency: { userId, currency } },
    });
    return money(row?.balance);
  });

  if (type === "win") {
    const notable =
      (currency === "USDT" && amount >= 25) ||
      (currency === "BTC" && amount >= 0.0005) ||
      (currency === "ETH" && amount >= 0.01);
    if (notable) {
      void import("@/lib/notifications/server")
        .then(({ notifyUser }) =>
          notifyUser(userId, {
            kind: "win",
            title: "Nice hit",
            body: `+${amount} ${currency}${note ? ` on ${note}` : ""}`,
            href: gameId ? `/games/${gameId}` : "/casino",
          }),
        )
        .catch(() => undefined);
    }
  }
  if (type === "deposit") {
    void import("@/lib/notifications/server")
      .then(({ notifyUser }) =>
        notifyUser(userId, {
          kind: "cashier",
          title: "Deposit credited",
          body: `${amount} ${currency} is in your wallet.`,
          href: "/profile",
        }),
      )
      .catch(() => undefined);
  }
  return next;
}

export async function snapshotBalances(userId: string): Promise<Record<Currency, number>> {
  const prisma = await getPrisma();
  const rows = await prisma.wallet.findMany({ where: { userId } });
  const balances = emptyBalances();
  for (const row of rows) balances[parseCurrency(row.currency)] = money(row.balance);
  return balances;
}

export async function readWallet(userId: string) {
  await ensureWallets(userId);
  const prisma = await getPrisma();
  const [rows, tx, wagered] = await Promise.all([
    prisma.wallet.findMany({ where: { userId } }),
    prisma.ledger.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      take: 40,
    }),
    prisma.ledger.aggregate({
      where: { userId, type: "bet" },
      _sum: { amount: true },
    }),
  ]);
  const balances = emptyBalances();
  for (const row of rows) balances[parseCurrency(row.currency)] = money(row.balance);
  return {
    balances,
    wagered: money(wagered._sum.amount),
    transactions: tx.map((t) => ({
      id: t.id,
      type: t.type,
      amount: money(t.amount),
      currency: parseCurrency(t.currency),
      status: t.status,
      gameId: t.gameId,
      note: t.note,
      createdAt: t.createdAt.toISOString(),
    })),
  };
}
