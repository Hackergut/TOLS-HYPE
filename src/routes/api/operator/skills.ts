import { createFileRoute } from "@tanstack/react-router";
import { operatorStatus } from "@/lib/operator/operator.server";

export const Route = createFileRoute("/api/operator/skills")({
  server: {
    handlers: {
      GET: async () => Response.json(await operatorStatus()),
    },
  },
});
