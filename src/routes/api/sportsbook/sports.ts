import { createFileRoute } from "@tanstack/react-router";
import { listOddsSports, oddsApiConfigured } from "@/lib/sports/odds-api.server";
import { sportKindFor, type ApiSport } from "@/lib/sports/odds-api";

/**
 * The Odds API v4 `/sports` — the in-season sport list, i.e. the valid
 * `sport_key` values for the odds and scores endpoints. Free: this endpoint
 * does not count against the usage quota, so it is safe to expose.
 */
export const Route = createFileRoute("/api/sportsbook/sports")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        if (!oddsApiConfigured()) {
          return Response.json(
            { ok: false, error: "THE_ODDS_API_KEY not set", sports: [] },
            { status: 503, headers: { "Cache-Control": "no-store" } },
          );
        }
        const all = new URL(request.url).searchParams.get("all") === "true";
        const rows = (await listOddsSports(all)) as ApiSport[];
        const sports = rows.map((s) => ({
          key: String(s.key ?? ""),
          title: String(s.title ?? ""),
          group: String(s.group ?? ""),
          active: Boolean(s.active),
          hasOutrights: Boolean(s.has_outrights),
          /** The TOLS board this key would appear on (null = not surfaced). */
          bucket: sportKindFor(s.key),
        }));
        return Response.json(
          { ok: true, count: sports.length, sports },
          { headers: { "Cache-Control": "public, max-age=3600" } },
        );
      },
    },
  },
});
