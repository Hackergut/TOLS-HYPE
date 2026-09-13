import { createFileRoute } from "@tanstack/react-router";
import { getScores, oddsApiConfigured } from "@/lib/sports/odds-api.server";
import { mapScoreEvent } from "@/lib/sports/odds-api";

/**
 * Live / recently completed scores from The Odds API v4 (`/scores`).
 *
 * Billed: 1 credit per call, 2 with `daysFrom` (completed games). That is why
 * the sport key is mandatory — this route never fans out over the whole board
 * on its own. Event ids match the odds feed, so a score can be joined onto a
 * listed event client-side.
 */
export const Route = createFileRoute("/api/sportsbook/scores")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        if (!oddsApiConfigured()) {
          return Response.json(
            { ok: false, error: "THE_ODDS_API_KEY not set", scores: [] },
            { status: 503, headers: { "Cache-Control": "no-store" } },
          );
        }
        const url = new URL(request.url);
        const sport = url.searchParams.get("sport")?.trim() ?? "";
        if (!/^[a-z0-9_]{2,64}$/i.test(sport)) {
          return Response.json(
            {
              ok: false,
              error: "sport is required (a sport_key from /api/sportsbook/sports, e.g. basketball_nba)",
              scores: [],
            },
            { status: 400, headers: { "Cache-Control": "no-store" } },
          );
        }
        const daysFromRaw = Number(url.searchParams.get("daysFrom"));
        const daysFrom = Number.isFinite(daysFromRaw) && daysFromRaw > 0 ? Math.min(3, Math.round(daysFromRaw)) : undefined;
        const rows = await getScores(sport, daysFrom);
        const now = new Date();
        const scores = rows
          .map((row) => mapScoreEvent((row ?? {}) as Parameters<typeof mapScoreEvent>[0], now))
          .filter((s): s is NonNullable<typeof s> => Boolean(s));
        return Response.json(
          { ok: true, sport, daysFrom: daysFrom ?? null, count: scores.length, scores },
          { headers: { "Cache-Control": "no-store" } },
        );
      },
    },
  },
});
