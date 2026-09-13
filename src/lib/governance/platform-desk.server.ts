import { CURRENCIES, GAMES, type Currency } from "@/lib/games-catalog";
import { getPrisma } from "@/lib/prisma.server";
import { credit, ensureWallets } from "@/lib/wallet.server";
import { pushBridgeEvent } from "@/lib/governance/bridge";

const ORIGINAL_IDS = new Set(GAMES.filter((g) => g.category === "originals").map((g) => g.id));

function num(v: { toString(): string } | number | string | null | undefined): number {
  if (v == null) return 0;
  const n = typeof v === "number" ? v : Number(v.toString());
  return Number.isFinite(n) ? n : 0;
}

function ledgerStatusFilter(status?: string | null): string | undefined {
  if (!status) return undefined;
  const s = status.toLowerCase();
  if (s === "confirmed" || s === "approved" || s === "settled" || s === "credited" || s === "completed") return "completed";
  if (s === "pending") return "pending";
  if (s === "failed") return "failed";
  if (s === "rejected") return "rejected";
  return status;
}

function depositStatusOut(status: string): string {
  return status === "completed" ? "confirmed" : status;
}

function withdrawalStatusOut(status: string): string {
  return status === "completed" ? "approved" : status;
}

async function sumByType(type: string) {
  const prisma = await getPrisma();
  const agg = await prisma.ledger.aggregate({ where: { type }, _sum: { amount: true }, _count: true });
  return { count: agg._count, amount: num(agg._sum.amount) };
}

export async function casinoSnapshot() {
  const prisma = await getPrisma();
  const rows = await prisma.ledger.findMany({ select: { type: true, amount: true, gameId: true, status: true } });
  let origStaked = 0, origReturned = 0, origCount = 0, vendorStaked = 0, vendorReturned = 0, vendorBets = 0, vendorRollback = 0;
  let houseWagered = 0, housePaid = 0, houseBets = 0, deposits = 0, withdrawals = 0, pendingWithdrawals = 0, bonuses = 0;
  for (const row of rows) {
    const amount = num(row.amount);
    const original = row.gameId ? ORIGINAL_IDS.has(row.gameId) : false;
    if (row.type === "bet") {
      houseBets += 1; houseWagered += amount;
      if (original) { origCount += 1; origStaked += amount; } else { vendorBets += 1; vendorStaked += amount; }
    } else if (row.type === "win") {
      housePaid += amount;
      if (original) origReturned += amount; else vendorReturned += amount;
    } else if (row.type === "rollback") vendorRollback += amount;
    else if (row.type === "deposit") deposits += amount;
    else if (row.type === "withdrawal") { withdrawals += amount; if (row.status === "pending") pendingWithdrawals += amount; }
    else if (row.type === "bonus") bonuses += amount;
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
    ngr: { formula: "deposits - withdrawals - released bonuses - chargebacks", deposits, withdrawals, releasedBonuses: bonuses, chargebacks: 0, ngr },
    cash: { deposits, withdrawals, pendingWithdrawals },
    waterfall: {
      totalPool: Math.max(0, ngr),
      waterfallSteps: [
        { name: "Jackpot", priority: 1, rate: 0.02, amount: Math.max(0, ngr) * 0.02 },
        { name: "Affiliate", priority: 2, rate: 0.08, amount: Math.max(0, ngr) * 0.08 },
        { name: "House", priority: 3, rate: 0.9, amount: Math.max(0, ngr) * 0.9 },
      ],
    },
    escrow: { id: "casino-ngr", totalBalance: Math.max(0, ngr), pendingSettlement: pendingWithdrawals, settlementFrequency: "daily", status: "active", lastSettlement: ts, source: "ledger" },
    ts,
    source: "casino",
  };
}

export async function listDeposits(status?: string | null, limit = 100) {
  const prisma = await getPrisma();
  const mapped = ledgerStatusFilter(status);
  const rows = await prisma.ledger.findMany({
    where: { type: { in: ["deposit", "bonus"] }, ...(mapped ? { status: mapped } : {}) },
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
    where: { type: "withdrawal", ...(mapped ? { status: mapped } : {}) },
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
    id: `wd_${rowId}`, userId: row.userId, amount: num(row.amount), currency: row.currency, txHash: txHash ?? null,
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
    const currency: Currency = (CURRENCIES as readonly string[]).includes(row.currency) ? (row.currency as Currency) : "USDT";
    await ensureWallets(row.userId);
    await credit(row.userId, currency, num(row.amount), "adjust", undefined, reason ?? "withdrawal_rejected");
  }
  void pushBridgeEvent("casino.withdrawal_pending", {
    id: `wd_${rowId}`, userId: row.userId, amount: num(row.amount), currency: row.currency, reason: reason ?? "rejected",
  });
  return { id: `wd_${rowId}`, action: "rejected", status: "rejected", reason: reason ?? null };
}

export async function paymentSummary() {
  const [deposits, withdrawals, bets, wins] = await Promise.all([sumByType("deposit"), sumByType("withdrawal"), sumByType("bet"), sumByType("win")]);
  return { treasury: Math.max(0, deposits.amount - withdrawals.amount), houseEarnings: Math.max(0, bets.amount - wins.amount), settledDeposits: deposits.count, settledWithdrawals: withdrawals.count, currency: "USDT" };
}

export async function casinoStats() {
  const prisma = await getPrisma();
  const [users, deposits, withdrawals, bets, wins] = await Promise.all([
    prisma.wallet.findMany({ distinct: ["userId"], select: { userId: true } }),
    sumByType("deposit"), sumByType("withdrawal"), sumByType("bet"), sumByType("win"),
  ]);
  const pending = await prisma.ledger.aggregate({ where: { type: "withdrawal", status: "pending" }, _sum: { amount: true }, _count: true });
  return { users: users.length, deposits: deposits.amount, withdrawals: withdrawals.amount, bets: bets.count, wagered: bets.amount, payout: wins.amount, pendingWithdrawals: { count: pending._count, amount: num(pending._sum.amount) } };
}

export async function listWallets(limit = 100) {
  const prisma = await getPrisma();
  const rows = await prisma.wallet.findMany({ take: Math.min(Math.max(limit, 1), 400) });
  return rows.map((r) => ({ userId: r.userId, currency: r.currency, balance: num(r.balance) }));
}

export async function applyGovCommand(type: string, payload: Record<string, unknown>) {
  const userId = String(payload.userId ?? payload.user_id ?? "");
  const { getSql } = await import("@/lib/db");
  const sql = await getSql();
  const log = async (title: string, body: string) => {
    if (!userId) return;
    await sql`insert into gov_events (user_id, type, title, body) values (${userId}, ${type}, ${title}, ${body})`.catch(() => undefined);
  };
  if (type === "governance.player_block" && userId) {
    const reason = String(payload.reason ?? "blocked");
    await sql`insert into player_controls (user_id, blocked, block_reason, updated_at, updated_by) values (${userId}, true, ${reason}, now(), 'tower') on conflict (user_id) do update set blocked = true, block_reason = excluded.block_reason, updated_at = now(), updated_by = 'tower'`;
    await log("Player blocked", reason);
    return { applied: true, action: "block", userId };
  }
  if (type === "governance.player_unblock" && userId) {
    await sql`insert into player_controls (user_id, blocked, block_reason, updated_at, updated_by) values (${userId}, false, null, now(), 'tower') on conflict (user_id) do update set blocked = false, block_reason = null, updated_at = now(), updated_by = 'tower'`;
    await log("Player unblocked", "");
    return { applied: true, action: "unblock", userId };
  }
  if (type === "governance.kyc_update" && userId) {
    const kyc = String(payload.kyc_status ?? payload.status ?? "none");
    await sql`insert into player_controls (user_id, kyc_status, updated_at, updated_by) values (${userId}, ${kyc}, now(), 'tower') on conflict (user_id) do update set kyc_status = excluded.kyc_status, updated_at = now(), updated_by = 'tower'`;
    await log("KYC updated", kyc);
    return { applied: true, action: "kyc", userId, kyc };
  }
  if (type === "governance.limits_update" && userId) {
    const wager = payload.wager_limit == null ? null : Number(payload.wager_limit);
    const deposit = payload.deposit_limit == null ? null : Number(payload.deposit_limit);
    await sql`insert into player_controls (user_id, wager_limit, deposit_limit, updated_at, updated_by) values (${userId}, ${wager}, ${deposit}, now(), 'tower') on conflict (user_id) do update set wager_limit = excluded.wager_limit, deposit_limit = excluded.deposit_limit, updated_at = now(), updated_by = 'tower'`;
    await log("Limits updated", JSON.stringify({ wager, deposit }));
    return { applied: true, action: "limits", userId };
  }
  if (type === "governance.rtp_update") {
    const rtp = payload.rtp == null ? null : Number(payload.rtp);
    if (userId) {
      await sql`insert into player_controls (user_id, rtp_override, updated_at, updated_by) values (${userId}, ${rtp}, now(), 'tower') on conflict (user_id) do update set rtp_override = excluded.rtp_override, updated_at = now(), updated_by = 'tower'`;
    }
    const key = String(payload.gameId ?? payload.game_id ?? "global");
    await sql`insert into gov_flags (key, value, updated_at) values (${`rtp:${key}`}, ${String(rtp ?? "")}, now()) on conflict (key) do update set value = excluded.value, updated_at = now()`;
    await log("RTP updated", String(rtp ?? ""));
    return { applied: true, action: "rtp", userId: userId || null, rtp };
  }
  if (type === "governance.session_invalidate" && userId) {
    await sql`insert into player_controls (user_id, session_epoch, updated_at, updated_by) values (${userId}, 1, now(), 'tower') on conflict (user_id) do update set session_epoch = player_controls.session_epoch + 1, updated_at = now(), updated_by = 'tower'`;
    await log("Session invalidated", "");
    return { applied: true, action: "session_invalidate", userId };
  }
  if (type === "governance.feature_flag") {
    const key = String(payload.key ?? payload.flag ?? "");
    if (key) {
      await sql`insert into gov_flags (key, value, updated_at) values (${key}, ${String(payload.value ?? "true")}, now()) on conflict (key) do update set value = excluded.value, updated_at = now()`;
    }
    return { applied: true, action: "feature_flag", key };
  }
  return { accepted: true, type };
}

export async function liveMap() {
  const empty = {
    activeSessions: [] as unknown[],
    liveEvents: [] as unknown[],
    stats: { totalOnline: 0, activeGames: 0, avgSessionDuration: 0, peakConcurrent: 0, totalWageredLive: 0, totalWonLive: 0, byDevice: {} as Record<string, number>, byCountry: {} as Record<string, number>, byGame: [] as { game: string; count: number }[] },
  };
  try {
    const { getSql } = await import("@/lib/db");
    const sql = await getSql();
    const players = await sql<{ user_id: string; display_name: string | null; current_game: string | null; current_game_title: string | null; status: string | null; session_wagered: string | number | null; last_seen: string; device: string | null }>`
      select user_id, display_name, current_game, current_game_title, status, session_wagered, last_seen::text as last_seen, device
      from player_presence order by last_seen desc limit 250`;
    const events = await sql<{ id: number; user_id: string; type: string; title: string; body: string | null; created_at: string }>`
      select id, user_id, type, title, body, created_at::text as created_at from gov_events order by created_at desc limit 40`.catch(() => []);
    const byGame = new Map<string, number>();
    let online = 0, wagered = 0;
    for (const p of players) {
      const g = p.current_game_title || p.current_game || "lobby";
      byGame.set(g, (byGame.get(g) ?? 0) + 1);
      if (p.status === "online") online += 1;
      wagered += num(p.session_wagered);
    }
    return {
      activeSessions: players.map((p) => ({ userId: p.user_id, displayName: p.display_name, game: p.current_game_title, gameId: p.current_game, status: p.status, wagered: num(p.session_wagered), lastSeen: p.last_seen, device: p.device })),
      liveEvents: events.map((e) => ({ id: e.id, userId: e.user_id, type: e.type, title: e.title, body: e.body, createdAt: e.created_at })),
      stats: { totalOnline: online, activeGames: byGame.size, avgSessionDuration: 0, peakConcurrent: online, totalWageredLive: wagered, totalWonLive: 0, byDevice: {} as Record<string, number>, byCountry: {} as Record<string, number>, byGame: [...byGame.entries()].map(([game, count]) => ({ game, count })) },
    };
  } catch {
    return empty;
  }
}
