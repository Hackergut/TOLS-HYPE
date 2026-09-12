import { createFileRoute } from "@tanstack/react-router";
import { listRemoteGames } from "@/lib/operator/operator.server";
import { CATALOG } from "@/lib/operator/catalog";
import { flexrixConfigured } from "@/lib/operator/flexrix-sign";

export const Route = createFileRoute("/api/operator/games")({
  server: {
    handlers: {
      GET: async () => {
        let remote: Awaited<ReturnType<typeof listRemoteGames>> = [];
        let error: string | null = null;
        try {
          remote = await listRemoteGames();
        } catch (err) {
          error = err instanceof Error ? err.message : "Flexrix list failed";
        }
        return Response.json({
          originals: CATALOG,
          remote,
          flexrix: { configured: flexrixConfigured(), count: remote.length, error },
        });
      },
    },
  },
});
