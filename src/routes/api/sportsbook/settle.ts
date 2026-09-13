import { createFileRoute } from "@tanstack/react-router";
import { operatorServer } from "@/lib/operator/env.server";
import { openTicketStats, settleSportBets } from "@/lib/sports/settlement.server";

/**
 * Settle open sport tickets from the vendor's final scores.
 *
 * Explicit rather than piggybacked on a page load: settlement moves money and
 * spends `/scores` credits, so it is an operator action (or a cron), not a
 * side effect of someone opening /sports. Protected by `OPERATOR_WEBHOOK_SECRET`
 * when one is set — the same convention as `/api/operator/launch`.
 *
 * Idempotent: a ticket is claimed with `status = 'pending'` before it is paid,
 * so running this twice (or concurrently) cannot pay twice.
 */
export const Route = createFileRoute("/api/sportsbook/settle")({
  server: {
    handlers: {
      GET: async () =>
        Response.json(
          {
            ok: true,
            service: "tols-sport-settlement",
            hint: "POST to settle open tickets from The Odds API /scores. GET reports the backlog.",
            ...(await openTicketStats()),
          },
          { headers: { "Cache-Control": "no-store" } },
        ),
      POST: async ({ request }) => {
        const secret = operatorServer().webhookSecret;
        if (secret) {
          const got = request.headers.get("authorization") ?? request.headers.get("x-operator-secret") ?? "";
          if (got !== secret && got !== `Bearer ${secret}`) {
            return Response.json({ ok: false, error: "Unauthorized" }, { status: 401 });
          }
        }
        const url = new URL(request.url);
        const limitRaw = Number(url.searchParams.get("limit"));
        const limit = Number.isFinite(limitRaw) && limitRaw > 0 ? Math.min(500, Math.round(limitRaw)) : 200;
        try {
          const summary = await settleSportBets(limit);
          return Response.json({ ok: true, ...summary }, { headers: { "Cache-Control": "no-store" } });
        } catch (err) {
          return Response.json(
            { ok: false, error: err instanceof Error ? err.message : "settlement failed" },
            { status: 500, headers: { "Cache-Control": "no-store" } },
          );
        }
      },
    },
  },
});
