import { createFileRoute } from "@tanstack/react-router";
import { operatorServer } from "@/lib/operator/env.server";
import { requireUserId } from "@/lib/auth/verify.server";
import { createSportTicket, listSportTickets } from "@/lib/sports/settlement.server";
import { snapshotBalances } from "@/lib/wallet.server";

/**
 * Self-test scaffolding, inert unless `SPORT_SELFTEST=1`.
 *
 * Why it exists: tickets are placed through the `placeSportBet` server
 * function, and TanStack Start's RPC frame encoding is internal to the
 * framework, so a shell harness cannot drive a placement. This route calls the
 * SAME shipping function (`createSportTicket`) so the settlement loop can be
 * exercised end to end against a real database row and a real wallet credit.
 *
 * Without the flag every method is a 404, so a deployed app never exposes a
 * route that mints tickets. `scripts/odds-api-selftest.mjs` requires it; CI
 * sets it alongside the other throwaway self-test secrets.
 */
export const Route = createFileRoute("/api/selftest/sport-ticket")({
  server: {
    handlers: {
      GET: async () => {
        if (process.env.SPORT_SELFTEST !== "1") return new Response(null, { status: 404 });
        const userId = await requireUserId();
        return Response.json(
          { ok: true, balances: await snapshotBalances(userId), tickets: await listSportTickets(userId, 20) },
          { headers: { "Cache-Control": "no-store" } },
        );
      },
      POST: async ({ request }) => {
        if (process.env.SPORT_SELFTEST !== "1") return new Response(null, { status: 404 });
        const secret = operatorServer().webhookSecret;
        const got = request.headers.get("authorization") ?? "";
        if (!secret || (got !== secret && got !== `Bearer ${secret}`)) {
          return Response.json({ ok: false, error: "Unauthorized" }, { status: 401 });
        }
        const userId = await requireUserId();
        const body = (await request.json()) as {
          stake: number;
          price: number;
          mode?: "single" | "combo";
          currency?: string;
          legs: unknown[];
        };
        const id = await createSportTicket({
          userId,
          currency: body.currency ?? "USDT",
          stake: body.stake,
          mode: body.mode ?? "combo",
          price: body.price,
          legs: body.legs as never,
        });
        return Response.json({ ok: true, id, balances: await snapshotBalances(userId) }, { headers: { "Cache-Control": "no-store" } });
      },
    },
  },
});
