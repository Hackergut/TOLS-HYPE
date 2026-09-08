import { createFileRoute } from "@tanstack/react-router";
import { resolveAdapter } from "@/lib/operator/registry";
import { operatorServer } from "@/lib/operator/env.server";

export const Route = createFileRoute("/api/operator/launch")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const cfg = operatorServer();
        if (cfg.webhookSecret) {
          const got = request.headers.get("authorization") ?? request.headers.get("x-operator-secret") ?? "";
          if (got !== cfg.webhookSecret && got !== `Bearer ${cfg.webhookSecret}`) {
            return Response.json({ error: "Unauthorized" }, { status: 401 });
          }
        }
        const body = (await request.json()) as { gameId?: string; userId?: string; currency?: string };
        if (!body.gameId || !body.userId) {
          return Response.json({ error: "gameId and userId required" }, { status: 400 });
        }
        const result = await resolveAdapter().launch({
          gameId: body.gameId,
          userId: body.userId,
          currency: body.currency ?? "USDT",
        });
        return Response.json(result, { status: result.error ? 400 : 200 });
      },
    },
  },
});
