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
  const prisma = await getPrisma();
  return prisma.$transaction(async (tx) => {
    const row = await tx.wallet.findUnique({
      where: { userId_currency: { userId, currency } },
    });
    const current = money(row?.balance);
    if (!row || current < amount) throw new Error("Insufficient balance");
    const next = current - amount;
    await tx.wallet.update({
      where: { userId_currency: { userId, currency } },
      data: { balance: next },
    });
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
    const row = await tx.wallet.findUnique({
      where: { userId_currency: { userId, currency } },
    });
    if (!row) throw new Error("Wallet missing");
    const updated = money(row.balance) + amount;
    await tx.wallet.update({
      where: { userId_currency: { userId, currency } },
      data: { balance: updated },
    });
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
    return updated;
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
