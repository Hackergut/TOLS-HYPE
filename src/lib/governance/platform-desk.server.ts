import { CURRENCIES, CATEGORIES, GAMES, PROMOS, type Currency } from "@/lib/games-catalog";
import { getPrisma } from "@/lib/prisma.server";
import { credit, debit, ensureWallets, snapshotBalances } from "@/lib/wallet.server";
import { pushBridgeEvent } from "@/lib/governance/bridge";

const ORIGINAL_IDS = new Set(GAMES.filter((g) => g.category === "originals").map((g) => g.id));

function num(v: { toString(): string } | number | string | null | undefined): number {
  if (v == null) return 0;
  const n = typeof v === "number" ? v : Number(v.toString());
  return Number.isFinite(n) ? n : 0;
}

function parseCurrency(value: unknown): Currency {
  const v = String(value ?? "USDT");
  if ((CURRENCIES as readonly string[]).includes(v)) return v as Currency;
  return "USDT";
}

function ledgerStatusFilter(status?: string | null): string | undefined {
  if (!status) return undefined;
  const s = status.toLowerCase();
  if (s === "confirmed" || s === "approved" || s === "settled" || s === "credited" || s === "completed") {
    return "completed";
  }
  if (s === "pending") return "pending";
  if (s === "failed") return "failed";
  if (s === "rejected") return "rejected";
  return status;
}

function depositStatusOut(status: string): string {
  if (status === "completed") return "confirmed";
  return status;
}

function withdrawalStatusOut(status: string): string {
  if (status === "completed") return "approved";
  return status;
}

async function sumByType(type: string) {
  const prisma = await getPrisma();
  const agg = await prisma.ledger.aggregate({
    where: { type },
    _sum: { amount: true },
    _count: true,
  });
  return { count: agg._count, amount: num(agg._sum.amount) };
}

type PlayerMeta = { name: string | null; email: string | null; kyc: string; blocked: boolean };

async function playerMeta(userIds: string[]): Promise<Map<string, PlayerMeta>> {
  const map = new Map<string, PlayerMeta>();
  if (userIds.length === 0) return map;
  try {
    const { getSql } = await import("@/lib/db");
    const sql = await getSql();
    const ctl = await sql<{ user_id: string; kyc_status: string | null; blocked: boolean }>`
      select user_id, kyc_status, blocked from player_controls
    `.catch(() => []);
    const pres = await sql<{ user_id: string; display_name: string | null; email: string | null }>`
      select user_id, display_name, email from player_presence
    `.catch(() => []);
    for (const row of ctl) {
      map.set(row.user_id, {
        name: null,
        email: null,
        kyc: row.kyc_status ?? "none",
        blocked: Boolean(row.blocked),
      });
    }
    for (const row of pres) {
      const prev = map.get(row.user_id) ?? { name: null, email: null, kyc: "none", blocked: false };
      prev.name = row.display_name;
      prev.email = row.email;
      map.set(row.user_id, prev);
    }
  } catch {
    /* tables may not exist yet */
  }
  return map;
}

export async function casinoSnapshot() {
  const prisma = await getPrisma();
  const rows = await prisma.ledger.findMany({
    select: { type: true, amount: true, gameId: true, status: true },
  });
  let origStaked = 0;
  let origReturned = 0;
  let origCount = 0;
  let vendorStaked = 0;
  let vendorReturned = 0;
  let vendorBets = 0;
  let vendorRollback = 0;
  let houseWagered = 0;
  let housePaid = 0;
  let houseBets = 0;
  let deposits = 0;
  let withdrawals = 0;
  let pendingWithdrawals = 0;
  let bonuses = 0;

  for (const row of rows) {
    const amount = num(row.amount);
    const original = row.gameId ? ORIGINAL_IDS.has(row.gameId) : false;
    if (row.type === "bet") {
      houseBets += 1;
      houseWagered += amount;
      if (original) {
        origCount += 1;
        origStaked += amount;
      } else {
        vendorBets += 1;
        vendorStaked += amount;
      }
    } else if (row.type === "win") {
      housePaid += amount;
      if (original) origReturned += amount;
      else vendorReturned += amount;
    } else if (row.type === "rollback") {
      vendorRollback += amount;
    } else if (row.type === "deposit") {
      deposits += amount;
    } else if (row.type === "withdrawal") {
      withdrawals += amount;
      if (row.status === "pending") pendingWithdrawals += amount;
    } else if (row.type === "bonus") {
      bonuses += amount;
    }
  }

  const origGgr = origStaked - origReturned;
  const vendorGgr = vendorStaked - vendorReturned - vendorRollback;
  const ngr = deposits - withdrawals - bonuses;
  const ts = new Date().toISOString();

  return {
    originals: { count: origCount, staked: origStaked, returned: origReturned, ggr: origGgr },
    vendor: { bets: vendorBets, staked: vendorStaked, returned: vendorReturned, rollback: vendorRollback, ggr: vendorGgr },
    flexrixLedger: { count: vendorBets, staked: vendorStaked, returned: vendorReturned, ggr: vendorGgr },
    house: { bets: houseBets, wagered: houseWagered, paid: housePaid, profit: houseWagered - housePaid },
    wagers: { count: houseBets, staked: houseWagered, returned: housePaid },
    ngr: {
      formula: "deposits − withdrawals − released bonuses − chargebacks",
      deposits,
      withdrawals,
      releasedBonuses: bonuses,
      chargebacks: 0,
      ngr,
    },
    cash: { deposits, withdrawals, pendingWithdrawals },
    waterfall: {
      totalPool: Math.max(0, ngr),
      waterfallSteps: [
        { name: "Jackpot", priority: 1, rate: 0.02, amount: Math.max(0, ngr) * 0.02 },
        { name: "Affiliate", priority: 2, rate: 0.08, amount: Math.max(0, ngr) * 0.08 },
        { name: "House", priority: 3, rate: 0.9, amount: Math.max(0, ngr) * 0.9 },
      ],
    },
    escrow: {
      id: "casino-ngr",
      totalBalance: Math.max(0, ngr),
      pendingSettlement: pendingWithdrawals,
      settlementFrequency: "daily",
      status: "active",
      lastSettlement: ts,
      source: "ledger",
    },
    ts,
    source: "casino",
  };
}

export async function listDeposits(status?: string | null, limit = 100) {
  const prisma = await getPrisma();
  const mapped = ledgerStatusFilter(status);
  const rows = await prisma.ledger.findMany({
    where: {
      type: { in: ["deposit", "bonus"] },
      ...(mapped ? { status: mapped } : {}),
    },
    orderBy: { createdAt: "desc" },
    take: Math.min(Math.max(limit, 1), 200),
  });
  return rows.map((r) => ({
    id: `dep_${r.id}`,
    userId: r.userId,
    username: r.userId.slice(0, 10),
    chain: r.currency === "BTC" ? "btc" : r.currency === "ETH" ? "eth" : r.currency === "SOL" ? "sol" : "usdt",
    txHash: r.note ?? "",
    amount: num(r.amount),
    amountUsd: num(r.amount),
    currency: r.currency,
    status: depositStatusOut(r.status),
    credited: r.status !== "failed" && r.status !== "pending",
    createdAt: r.createdAt.toISOString(),
    kind: r.type,
  }));
}

export async function listWithdrawals(status?: string | null, limit = 100) {
  const prisma = await getPrisma();
  const mapped = ledgerStatusFilter(status);
  const rows = await prisma.ledger.findMany({
    where: {
      type: "withdrawal",
      ...(mapped ? { status: mapped } : {}),
    },
    orderBy: { createdAt: "desc" },
    take: Math.min(Math.max(limit, 1), 200),
  });
  return rows.map((r) => ({
    id: `wd_${r.id}`,
    userId: r.userId,
    username: r.userId.slice(0, 10),
    amount: num(r.amount),
    currency: r.currency,
    chain: r.currency === "BTC" ? "btc" : r.currency === "ETH" ? "eth" : r.currency === "SOL" ? "sol" : "usdt",
    walletAddress: r.note ?? "",
    status: withdrawalStatusOut(r.status),
    txHash: "",
    createdAt: r.createdAt.toISOString(),
  }));
}

function parseWithdrawalId(id: string): number | null {
  const n = Number(String(id).replace(/^wd_/, ""));
  return Number.isInteger(n) && n > 0 ? n : null;
}

export async function approveWithdrawal(id: string, txHash?: string) {
  const rowId = parseWithdrawalId(id);
  if (!rowId) throw new Error("invalid withdrawal id");
  const prisma = await getPrisma();
  const row = await prisma.ledger.findUnique({ where: { id: rowId } });
  if (!row || row.type !== "withdrawal") throw new Error("withdrawal not found");
  await prisma.ledger.update({
    where: { id: rowId },
    data: { status: "completed", note: txHash ? `${row.note ?? ""} ${txHash}`.trim() : row.note },
  });
  void pushBridgeEvent("casino.withdrawal_settled", {
    id: `wd_${rowId}`,
    userId: row.userId,
    amount: num(row.amount),
    currency: row.currency,
    txHash: txHash ?? null,
  });
  return { id: `wd_${rowId}`, action: "approved", status: "approved", txHash: txHash ?? null };
}

export async function rejectWithdrawal(id: string, reason?: string) {
  const rowId = parseWithdrawalId(id);
  if (!rowId) throw new Error("invalid withdrawal id");
  const prisma = await getPrisma();
  const row = await prisma.ledger.findUnique({ where: { id: rowId } });
  if (!row || row.type !== "withdrawal") throw new Error("withdrawal not found");
  if (row.status !== "rejected") {
    await prisma.ledger.update({ where: { id: rowId }, data: { status: "rejected", note: reason ?? row.note } });
    const currency: Currency = (CURRENCIES as readonly string[]).includes(row.currency)
      ? (row.currency as Currency)
      : "USDT";
    await ensureWallets(row.userId);
    await credit(row.userId, currency, num(row.amount), "adjust", undefined, reason ?? "withdrawal_rejected");
  }
  void pushBridgeEvent("casino.withdrawal_pending", {
    id: `wd_${rowId}`,
    userId: row.userId,
    amount: num(row.amount),
    currency: row.currency,
    reason: reason ?? "rejected",
  });
  return { id: `wd_${rowId}`, action: "rejected", status: "rejected", reason: reason ?? null };
}

export async function paymentSummary() {
  const [deposits, withdrawals, bets, wins] = await Promise.all([
    sumByType("deposit"),
    sumByType("withdrawal"),
    sumByType("bet"),
    sumByType("win"),
  ]);
  return {
    treasury: Math.max(0, deposits.amount - withdrawals.amount),
    houseEarnings: Math.max(0, bets.amount - wins.amount),
    settledDeposits: deposits.count,
    settledWithdrawals: withdrawals.count,
    currency: "USDT",
  };
}

export async function casinoStats() {
  const prisma = await getPrisma();
  const [users, deposits, withdrawals, bets, wins] = await Promise.all([
    prisma.wallet.findMany({ distinct: ["userId"], select: { userId: true } }),
    sumByType("deposit"),
    sumByType("withdrawal"),
    sumByType("bet"),
    sumByType("win"),
  ]);
  const pending = await prisma.ledger.aggregate({
    where: { type: "withdrawal", status: "pending" },
    _sum: { amount: true },
    _count: true,
  });
  return {
    users: users.length,
    deposits: deposits.amount,
    withdrawals: withdrawals.amount,
    bets: bets.count,
    wagered: bets.amount,
    payout: wins.amount,
    pendingWithdrawals: { count: pending._count, amount: num(pending._sum.amount) },
  };
}

export type CasinoWalletRecord = {
  id: string;
  userId: string;
  username: string | null;
  email: string | null;
  kycStatus: string | null;
  currency: string;
  balance: number;
  vipLevel: number;
  totalWagered: number;
  totalWon: number;
  updatedAt: string;
};

export async function listWallets(limit = 100): Promise<{
  wallets: CasinoWalletRecord[];
  totals: { balance: number; wallets: number };
}> {
  const prisma = await getPrisma();
  const rows = await prisma.wallet.findMany({ take: Math.min(Math.max(limit, 1), 400) });
  const userIds = [...new Set(rows.map((r) => r.userId))];
  const [sums, meta] = await Promise.all([
    userIds.length
      ? prisma.ledger.groupBy({
          by: ["userId", "type"],
          where: { userId: { in: userIds }, type: { in: ["bet", "win"] } },
          _sum: { amount: true },
        })
      : Promise.resolve([]),
    playerMeta(userIds),
  ]);
  const wagered = new Map<string, number>();
  const won = new Map<string, number>();
  for (const s of sums) {
    if (s.type === "bet") wagered.set(s.userId, num(s._sum.amount));
    if (s.type === "win") won.set(s.userId, num(s._sum.amount));
  }
  const now = new Date().toISOString();
  const wallets = rows.map((r) => {
    const m = meta.get(r.userId);
    return {
      id: `${r.userId}:${r.currency}`,
      userId: r.userId,
      username: m?.name ?? r.userId.slice(0, 10),
      email: m?.email ?? null,
      kycStatus: m?.kyc ?? "none",
      currency: r.currency,
      balance: num(r.balance),
      vipLevel: 0,
      totalWagered: wagered.get(r.userId) ?? 0,
      totalWon: won.get(r.userId) ?? 0,
      updatedAt: now,
    };
  });
  return {
    wallets,
    totals: { balance: wallets.reduce((a, w) => a + w.balance, 0), wallets: wallets.length },
  };
}

export async function listUsers(limit = 100) {
  const { wallets } = await listWallets(Math.min(Math.max(limit, 1), 400));
  const byUser = new Map<string, CasinoWalletRecord[]>();
  for (const w of wallets) {
    const arr = byUser.get(w.userId) ?? [];
    arr.push(w);
    byUser.set(w.userId, arr);
  }
  const meta = await playerMeta([...byUser.keys()]);
  return [...byUser.entries()].map(([userId, ws]) => {
    const m = meta.get(userId);
    return {
      id: userId,
      userId,
      username: m?.name ?? ws[0]?.username ?? userId.slice(0, 10),
      email: m?.email ?? ws[0]?.email ?? null,
      kycStatus: m?.kyc ?? ws[0]?.kycStatus ?? "none",
      blocked: m?.blocked ?? false,
      balances: Object.fromEntries(ws.map((w) => [w.currency, w.balance])),
      totalWagered: ws[0]?.totalWagered ?? 0,
      totalWon: ws[0]?.totalWon ?? 0,
    };
  });
}

export async function getUser(userId: string) {
  const users = await listUsers(400);
  const found = users.find((u) => u.userId === userId);
  if (!found) throw new Error("user not found");
  const prisma = await getPrisma();
  const tx = await prisma.ledger.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    take: 40,
  });
  return {
    ...found,
    transactions: tx.map((t) => ({
      id: t.id,
      type: t.type,
      amount: num(t.amount),
      currency: t.currency,
      status: t.status,
      gameId: t.gameId,
      note: t.note,
      createdAt: t.createdAt.toISOString(),
    })),
  };
}

export async function patchUser(userId: string, body: Record<string, unknown>) {
  const action = String(body.action ?? body.op ?? "").toLowerCase();
  if (body.blocked === true || action === "block") {
    return applyGovCommand("governance.player_block", { userId, reason: body.reason ?? "blocked" });
  }
  if (body.blocked === false || action === "unblock") {
    return applyGovCommand("governance.player_unblock", { userId });
  }
  if (body.kycStatus != null || body.kyc_status != null || action === "kyc") {
    return applyGovCommand("governance.kyc_update", {
      userId,
      kyc_status: body.kycStatus ?? body.kyc_status ?? body.status,
    });
  }
  if (body.wager_limit != null || body.deposit_limit != null || action === "limits") {
    return applyGovCommand("governance.limits_update", body);
  }
  return applyGovCommand(action ? `governance.${action}` : "governance.player_block", { ...body, userId });
}

export async function adjustWallet(payload: Record<string, unknown>, kind: "adjust" | "bonus" = "adjust") {
  const userId = String(payload.userId ?? payload.user_id ?? payload.playerId ?? "");
  const amount = Number(payload.amount);
  if (!userId || !Number.isFinite(amount) || amount === 0) {
    throw new Error("userId and non-zero amount required");
  }
  const currency = parseCurrency(payload.currency);
  await ensureWallets(userId);
  if (amount > 0) {
    await credit(userId, currency, amount, kind === "bonus" ? "bonus" : "adjust", undefined, String(payload.reason ?? kind));
  } else {
    await debit(userId, currency, Math.abs(amount), "adjust", undefined, String(payload.reason ?? kind));
  }
  void pushBridgeEvent(kind === "bonus" ? "casino.bonus_released" : "casino.health", {
    userId,
    amount,
    currency,
    kind,
  });
  return { userId, amount, currency, kind, balances: await snapshotBalances(userId) };
}

export async function applyGovCommand(type: string, payload: Record<string, unknown>) {
  const userId = String(payload.userId ?? payload.user_id ?? "");
  const { getSql } = await import("@/lib/db");
  const sql = await getSql();

  const log = async (title: string, body: string) => {
    if (!userId) return;
    await sql`
      insert into gov_events (user_id, type, title, body)
      values (${userId}, ${type}, ${title}, ${body})
    `.catch(() => undefined);
  };

  if (type === "governance.player_block" && userId) {
    const reason = String(payload.reason ?? "blocked");
    await sql`
      insert into player_controls (user_id, blocked, block_reason, updated_at, updated_by)
      values (${userId}, true, ${reason}, now(), 'tower')
      on conflict (user_id) do update set
        blocked = true,
        block_reason = excluded.block_reason,
        updated_at = now(),
        updated_by = 'tower'
    `;
    await log("Player blocked", reason);
    return { applied: true, action: "block", userId };
  }

  if (type === "governance.player_unblock" && userId) {
    await sql`
      insert into player_controls (user_id, blocked, block_reason, updated_at, updated_by)
      values (${userId}, false, null, now(), 'tower')
      on conflict (user_id) do update set
        blocked = false,
        block_reason = null,
        updated_at = now(),
        updated_by = 'tower'
    `;
    await log("Player unblocked", "");
    return { applied: true, action: "unblock", userId };
  }

  if (type === "governance.kyc_update" && userId) {
    const kyc = String(payload.kyc_status ?? payload.status ?? "none");
    await sql`
      insert into player_controls (user_id, kyc_status, updated_at, updated_by)
      values (${userId}, ${kyc}, now(), 'tower')
      on conflict (user_id) do update set
        kyc_status = excluded.kyc_status,
        updated_at = now(),
        updated_by = 'tower'
    `;
    await log("KYC updated", kyc);
    return { applied: true, action: "kyc", userId, kyc };
  }

  if (type === "governance.limits_update" && userId) {
    const wager = payload.wager_limit == null ? null : Number(payload.wager_limit);
    const deposit = payload.deposit_limit == null ? null : Number(payload.deposit_limit);
    await sql`
      insert into player_controls (user_id, wager_limit, deposit_limit, updated_at, updated_by)
      values (${userId}, ${wager}, ${deposit}, now(), 'tower')
      on conflict (user_id) do update set
        wager_limit = excluded.wager_limit,
        deposit_limit = excluded.deposit_limit,
        updated_at = now(),
        updated_by = 'tower'
    `;
    await log("Limits updated", JSON.stringify({ wager, deposit }));
    return { applied: true, action: "limits", userId };
  }

  if (type === "governance.rtp_update") {
    const rtp = payload.rtp == null ? null : Number(payload.rtp);
    if (userId) {
      await sql`
        insert into player_controls (user_id, rtp_override, updated_at, updated_by)
        values (${userId}, ${rtp}, now(), 'tower')
        on conflict (user_id) do update set
          rtp_override = excluded.rtp_override,
          updated_at = now(),
          updated_by = 'tower'
      `;
    }
    const key = String(payload.gameId ?? payload.game_id ?? "global");
    await sql`
      insert into gov_flags (key, value, updated_at)
      values (${`rtp:${key}`}, ${String(rtp ?? "")}, now())
      on conflict (key) do update set value = excluded.value, updated_at = now()
    `;
    await log("RTP updated", String(rtp ?? ""));
    return { applied: true, action: "rtp", userId: userId || null, rtp };
  }

  if (type === "governance.session_invalidate" && userId) {
    await sql`
      insert into player_controls (user_id, session_epoch, updated_at, updated_by)
      values (${userId}, 1, now(), 'tower')
      on conflict (user_id) do update set
        session_epoch = player_controls.session_epoch + 1,
        updated_at = now(),
        updated_by = 'tower'
    `;
    await log("Session invalidated", "");
    return { applied: true, action: "session_invalidate", userId };
  }

  if (type === "governance.feature_flag") {
    const key = String(payload.key ?? payload.flag ?? "");
    if (key) {
      await sql`
        insert into gov_flags (key, value, updated_at)
        values (${key}, ${String(payload.value ?? "true")}, now())
        on conflict (key) do update set value = excluded.value, updated_at = now()
      `;
    }
    return { applied: true, action: "feature_flag", key };
  }

  return { accepted: true, type };
}

export async function liveMap() {
  const empty = {
    activeSessions: [] as unknown[],
    liveEvents: [] as unknown[],
    stats: {
      totalOnline: 0,
      activeGames: 0,
      avgSessionDuration: 0,
      peakConcurrent: 0,
      totalWageredLive: 0,
      totalWonLive: 0,
      byDevice: {} as Record<string, number>,
      byCountry: {} as Record<string, number>,
      byGame: [] as { game: string; count: number }[],
    },
  };
  try {
    const { getSql } = await import("@/lib/db");
    const sql = await getSql();
    const players = await sql<{
      user_id: string;
      display_name: string | null;
      current_game: string | null;
      current_game_title: string | null;
      status: string | null;
      session_wagered: string | number | null;
      last_seen: string;
      device: string | null;
    }>`
      select user_id, display_name, current_game, current_game_title, status,
             session_wagered, last_seen::text as last_seen, device
      from player_presence
      order by last_seen desc
      limit 250
    `;
    const events = await sql<{
      id: number;
      user_id: string;
      type: string;
      title: string;
      body: string | null;
      created_at: string;
    }>`
      select id, user_id, type, title, body, created_at::text as created_at
      from gov_events
      order by created_at desc
      limit 40
    `.catch(() => []);
    const byGame = new Map<string, number>();
    let online = 0;
    let wagered = 0;
    for (const p of players) {
      const g = p.current_game_title || p.current_game || "lobby";
      byGame.set(g, (byGame.get(g) ?? 0) + 1);
      if (p.status === "online") online += 1;
      wagered += num(p.session_wagered);
    }
    return {
      activeSessions: players.map((p) => ({
        userId: p.user_id,
        displayName: p.display_name,
        game: p.current_game_title,
        gameId: p.current_game,
        status: p.status,
        wagered: num(p.session_wagered),
        lastSeen: p.last_seen,
        device: p.device,
      })),
      liveEvents: events.map((e) => ({
        id: e.id,
        userId: e.user_id,
        type: e.type,
        title: e.title,
        body: e.body,
        createdAt: e.created_at,
      })),
      stats: {
        totalOnline: online,
        activeGames: byGame.size,
        avgSessionDuration: 0,
        peakConcurrent: online,
        totalWageredLive: wagered,
        totalWonLive: 0,
        byDevice: {} as Record<string, number>,
        byCountry: {} as Record<string, number>,
        byGame: [...byGame.entries()].map(([game, count]) => ({ game, count })),
      },
    };
  } catch {
    return empty;
  }
}

export async function listBets(opts: { gameId?: string | null; userId?: string | null; result?: string | null; limit?: number } = {}) {
  const prisma = await getPrisma();
  const limit = Math.min(Math.max(opts.limit ?? 100, 1), 400);
  const rows = await prisma.ledger.findMany({
    where: {
      type: { in: ["bet", "win"] },
      ...(opts.gameId ? { gameId: opts.gameId } : {}),
      ...(opts.userId ? { userId: opts.userId } : {}),
    },
    orderBy: { createdAt: "desc" },
    take: limit,
  });
  const resultFilter = (opts.result ?? "").toLowerCase();
  return rows
    .filter((r) => {
      if (!resultFilter) return true;
      if (resultFilter === "win" || resultFilter === "won") return r.type === "win";
      if (resultFilter === "loss" || resultFilter === "lost" || resultFilter === "bet") return r.type === "bet";
      return true;
    })
    .map((r) => ({
      id: `bet_${r.id}`,
      userId: r.userId,
      gameId: r.gameId,
      type: r.type,
      result: r.type === "win" ? "win" : "bet",
      amount: num(r.amount),
      currency: r.currency,
      status: r.status,
      createdAt: r.createdAt.toISOString(),
    }));
}

export async function getRtp() {
  const { getSql } = await import("@/lib/db");
  const sql = await getSql();
  const rows = await sql<{ key: string; value: string }>`
    select key, value from gov_flags where key like ${"rtp:%"}
  `.catch(() => []);
  const games: Record<string, number> = {};
  let bias = 1;
  for (const row of rows) {
    const id = row.key.replace(/^rtp:/, "");
    const n = Number(row.value);
    if (!Number.isFinite(n)) continue;
    if (id === "global" || id === "bias") bias = n;
    else games[id] = n;
  }
  return { bias, games, fair: bias === 1, source: "casino" };
}

export async function setRtp(body: Record<string, unknown>) {
  const action = String(body.action ?? "").toLowerCase();
  const { getSql } = await import("@/lib/db");
  const sql = await getSql();
  if (action === "reset") {
    await sql`delete from gov_flags where key like ${"rtp:%"}`.catch(() => undefined);
    return getRtp();
  }
  const key = String(body.gameId ?? body.game_id ?? body.key ?? "global");
  const raw = body.rtp ?? body.bias ?? body.value;
  const n = raw == null ? 1 : Number(raw);
  const clamped = Math.min(2, Math.max(0, Number.isFinite(n) ? n : 1));
  await sql`
    insert into gov_flags (key, value, updated_at)
    values (${`rtp:${key}`}, ${String(clamped)}, now())
    on conflict (key) do update set value = excluded.value, updated_at = now()
  `;
  return getRtp();
}

export async function getPromotions() {
  const { getSql } = await import("@/lib/db");
  const sql = await getSql();
  const flags = await sql<{ key: string; value: string }>`
    select key, value from gov_flags where key like ${"promo:%"}
  `.catch(() => []);
  const overrides = new Map(flags.map((f) => [f.key.replace(/^promo:/, ""), f.value]));
  return PROMOS.map((p) => ({
    id: p.id,
    entity: "promo",
    title: p.title,
    kicker: p.kicker,
    tag: p.tag,
    badge: p.badge,
    body: p.body,
    cta: p.cta,
    to: p.to,
    image: p.image,
    enabled: overrides.get(p.id) !== "off",
    override: overrides.get(p.id) ?? null,
  }));
}

export async function setPromotion(body: Record<string, unknown>) {
  const key = String(body.key ?? body.id ?? body.entityKey ?? "");
  if (!key) throw new Error("key required");
  const enabled = body.enabled === false || body.value === "off" || body.action === "disable" ? "off" : "on";
  const { getSql } = await import("@/lib/db");
  const sql = await getSql();
  await sql`
    insert into gov_flags (key, value, updated_at)
    values (${`promo:${key}`}, ${enabled}, now())
    on conflict (key) do update set value = excluded.value, updated_at = now()
  `;
  return getPromotions();
}

export async function listAffiliates() {
  return { affiliates: [] as unknown[], source: "casino" };
}

export function platformGames() {
  return GAMES.map((g) => ({
    id: g.id,
    title: g.title,
    provider: g.provider,
    category: g.category,
    kind: g.kind,
    rtp: g.rtp,
    edge: g.edge,
    live: Boolean(g.live),
    original: Boolean(g.original),
    cover: g.cover,
    players: g.players ?? 0,
  }));
}

export function platformCategories() {
  return CATEGORIES;
}

export function platformLobby() {
  return { games: platformGames(), categories: CATEGORIES, source: "casino" };
}

export async function patchCatalog(kind: "games" | "lobby" | "categories", body: Record<string, unknown>) {
  const key = String(body.key ?? body.id ?? kind);
  const { getSql } = await import("@/lib/db");
  const sql = await getSql();
  await sql`
    insert into gov_flags (key, value, updated_at)
    values (${`cms:${kind}:${key}`}, ${JSON.stringify(body)}, now())
    on conflict (key) do update set value = excluded.value, updated_at = now()
  `;
  if (kind === "categories") return platformCategories();
  if (kind === "lobby") return platformLobby();
  return platformGames();
}

