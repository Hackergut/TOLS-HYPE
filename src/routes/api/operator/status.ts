import { createFileRoute } from "@tanstack/react-router";
import { getOperatorStatus } from "@/lib/operator/status.server";

export const Route = createFileRoute("/api/operator/status")({
  server: {
    handlers: {
      GET: async () =>
        Response.json(await getOperatorStatus(), {
          headers: { "Cache-Control": "no-store" },
        }),
    },
  },
});
