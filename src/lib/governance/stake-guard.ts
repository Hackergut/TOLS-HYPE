import { getSql } from "@/lib/db";
import { CURRENCY_META, type Currency } from "@/lib/games-catalog";

/** Min/max stake plus governance block and wager cap. Same gate for every game. */
export async function guardStake(userId: string, currency: Currency, amount: number) {
  if (amount === 0) return;
  const meta = CURRENCY_META[currency];
  if (amount < meta.minBet) throw new Error(`Minimum bet is ${meta.minBet} ${currency}`);
  if (amount > meta.maxBet) throw new Error(`Maximum bet is ${meta.maxBet} ${currency}`);
  const sql = await getSql();
  const rows = await sql<{ blocked: boolean; block_reason: string | null; wager_limit: string | null }>`
    select blocked, block_reason, wager_limit::text as wager_limit
    from player_controls
    where user_id = ${userId}
  `.catch(() => [] as { blocked: boolean; block_reason: string | null; wager_limit: string | null }[]);
  const row = rows[0];
  if (!row) return;
  if (row.blocked) throw new Error(row.block_reason || "Account blocked by governance");
  if (row.wager_limit != null && row.wager_limit !== "") {
    const limit = Number(row.wager_limit);
    if (Number.isFinite(limit) && amount > limit) {
      throw new Error(`Governance wager limit is ${limit} ${currency}`);
    }
  }
}
