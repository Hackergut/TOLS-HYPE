import { createFileRoute } from "@tanstack/react-router";
import { listRemoteGames } from "@/lib/operator/operator.server";
import { CATALOG } from "@/lib/operator/catalog";

export const Route = createFileRoute("/api/operator/games")({
  server: {
    handlers: {
      GET: async () => {
        const remote = await listRemoteGames();
        return Response.json({ originals: CATALOG, remote });
      },
    },
  },
});
