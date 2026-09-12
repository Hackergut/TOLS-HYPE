import { createFileRoute } from "@tanstack/react-router";
import { flexrixConfigured, flexrixBase, flexrixSign } from "@/lib/operator/flexrix-sign";
import { SPORT_EVENTS } from "@/lib/sports-book";

export const Route = createFileRoute("/api/sportsbook/events")({
  server: {
    handlers: {
      GET: async () => {
        let remote: unknown = null;
        let error: string | null = null;
        if (flexrixConfigured()) {
          try {
            const q = { page: "1", per_page: "50", lang: "en" };
            const { headers } = flexrixSign(q);
            const url = `${flexrixBase()}/v1/sports/events?page=1&per_page=50&lang=en`;
            const r = await fetch(url, { headers, signal: AbortSignal.timeout(8000) });
            const text = await r.text();
            if (r.ok) remote = JSON.parse(text);
            else error = `Flexrix ${r.status}`;
          } catch (e) {
            error = e instanceof Error ? e.message : "flexrix sports failed";
          }
        }
        return Response.json({
          source: remote ? "flexrix" : "tols",
          error,
          events: SPORT_EVENTS,
          flexrix: remote,
        });
      },
    },
  },
});
