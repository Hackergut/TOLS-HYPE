import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/api/operator/skills")({
  server: {
    handlers: {
      GET: async () => new Response(null, { status: 404 }),
    },
  },
});
