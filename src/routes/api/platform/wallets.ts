import { createFileRoute } from "@tanstack/react-router";
import { listWallets } from "@/lib/governance/platform-desk.server";
import { jsonErr, platformCors, platformOptions } from "@/lib/governance/platform-http";
import { requirePlatformScope } from "@/lib/governance/platform-jwt";

export const Route = createFileRoute("/api/platform/wallets")({
  server: {
    handlers: {
      OPTIONS: platformOptions,
      GET: async ({ request }) => {
        const auth = requirePlatformScope(request, "wallets:read");
        if ("response" in auth) return auth.response;
        try {
          const url = new URL(request.url);
          const result = await listWallets(Number(url.searchParams.get("limit") || 100));
          return Response.json(
            { success: true, data: result.wallets, totals: result.totals },
            { headers: platformCors },
          );
        } catch (e) {
          return jsonErr(e instanceof Error ? e.message : String(e), 500);
        }
      },
    },
  },
});
