import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { authMiddleware } from "@/lib/auth/middleware";
import { getSql } from "@/lib/db";
import type { BetRound } from "@/lib/bet-history";

export const saveBetRound = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator(
    z.object({
      id: z.string(),
      gameId: z.string(),
      title: z.string(),
      kind: z.string(),
      win: z.boolean(),
      label: z.string(),
      stake: z.number(),
      payout: z.number(),
      multiplier: z.number(),
      currency: z.string(),
      fair: z
        .object({
          serverHash: z.string(),
          clientSeed: z.string(),
          nonce: z.number(),
        })
        .nullable()
        .optional(),
      view: z.unknown().nullable().optional(),
      at: z.number(),
    }),
  )
  .handler(async ({ context, data }) => {
    const sql = await getSql();
    await sql`
      insert into bet_rounds (
        id, user_id, game_id, title, kind, win, label, stake, payout, multiplier,
        currency, server_hash, client_seed, nonce, view, created_at
      )
      values (
        ${data.id}, ${context.userId}, ${data.gameId}, ${data.title}, ${data.kind},
        ${data.win}, ${data.label}, ${data.stake}, ${data.payout}, ${data.multiplier},
        ${data.currency}, ${data.fair?.serverHash ?? null}, ${data.fair?.clientSeed ?? null},
        ${data.fair?.nonce ?? null}, ${data.view ? JSON.stringify(data.view) : null},
        ${new Date(data.at).toISOString()}
      )
      on conflict (id) do nothing
    `;
    return { ok: true };
  });

export const listBetRounds = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .handler(async ({ context }): Promise<BetRound[]> => {
    const sql = await getSql();
    const rows = await sql<{
      id: string;
      game_id: string;
      title: string;
      kind: string;
      win: boolean;
      label: string;
      stake: number;
      payout: number;
      multiplier: number;
      currency: string;
      server_hash: string | null;
      client_seed: string | null;
      nonce: number | null;
      view: string | null;
      created_at: string;
    }>`
      select id, game_id, title, kind, win, label, stake, payout, multiplier, currency,
             server_hash, client_seed, nonce, view, created_at
      from bet_rounds
      where user_id = ${context.userId}
      order by created_at desc
      limit 100
    `;
    return rows.map((r) => ({
      id: r.id,
      gameId: r.game_id,
      title: r.title,
      kind: r.kind,
      win: Boolean(r.win),
      label: r.label,
      stake: Number(r.stake),
      payout: Number(r.payout),
      multiplier: Number(r.multiplier),
      currency: r.currency,
      fair:
        r.server_hash && r.client_seed != null && r.nonce != null
          ? { serverHash: r.server_hash, clientSeed: r.client_seed, nonce: r.nonce }
          : null,
      view: r.view ? (JSON.parse(r.view) as BetRound["view"]) : null,
      at: new Date(r.created_at).getTime(),
    }));
  });
