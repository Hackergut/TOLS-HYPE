import { createFileRoute } from "@tanstack/react-router";
import { loadSportsEvents } from "@/lib/operator/sports-flexrix";

export const Route = createFileRoute("/api/sportsbook/events")({
  server: {
    handlers: {
      GET: async () => {
        const data = await loadSportsEvents();
        return Response.json(data);
      },
    },
  },
});
