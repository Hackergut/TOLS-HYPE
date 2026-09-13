import { createFileRoute } from "@tanstack/react-router";
import { flexrixConfigured, flexrixBase, flexrixSign } from "@/lib/operator/flexrix-sign";
import { oddsApiStatus, sportsBoard } from "@/lib/sports/odds-api.server";

/**
 * Sportsboard feed.
 *
 *   source: "odds-api" → The Odds API v4 (real bookmaker odds, best price)
 *           "tols"     → curated in-repo book (fallback / no API key)
 *
 * `events` is always renderable: when the live feed is empty or the vendor is
 * unreachable the curated book is served instead, so the UI never blanks out.
 * The Flexrix sports probe is opt-in (`?probe=flexrix`) — it costs an extra
 * upstream call and nothing in the UI reads it by default.
 */
export const Route = createFileRoute("/api/sportsbook/events")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const url = new URL(request.url);
        const board = await sportsBoard();

        let flexrix: unknown = null;
        let flexrixError: string | null = null;
        if (url.searchParams.get("probe") === "flexrix" && flexrixConfigured()) {
          try {
            const q = { page: "1", per_page: "50", lang: "en" };
            const { headers } = flexrixSign(q);
            const r = await fetch(`${flexrixBase()}/v1/sports/events?page=1&per_page=50&lang=en`, {
              headers,
              signal: AbortSignal.timeout(8000),
            });
            const text = await r.text();
            if (r.ok) flexrix = JSON.parse(text);
            else flexrixError = `Flexrix ${r.status}`;
          } catch (e) {
            flexrixError = e instanceof Error ? e.message : "flexrix sports failed";
          }
        }

        return Response.json(
          {
            source: board.source,
            error: board.error,
            fetchedAt: board.fetchedAt,
            count: board.events.length,
            events: board.events,
            oddsApi: oddsApiStatus(),
            ...(flexrix !== null || flexrixError !== null ? { flexrix, flexrixError } : {}),
          },
          { headers: { "Cache-Control": "no-store" } },
        );
      },
    },
  },
});
