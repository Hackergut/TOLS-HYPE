import { createFileRoute } from "@tanstack/react-router";
import { inboundWallet, seamlessWallet } from "@/lib/operator/operator.server";
import type { SeamlessRequest } from "@/lib/operator/types";

export const Route = createFileRoute("/api/operator/wallet")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const headers: Record<string, string> = {};
        request.headers.forEach((v, k) => {
          headers[k.toLowerCase()] = v;
        });
        let body: unknown;
        try {
          body = await request.json();
        } catch {
          return Response.json({ ok: false, error: "Invalid JSON" }, { status: 400 });
        }
        const result = await inboundWallet(body, headers);
        if (result.error === "Unrecognized wallet payload" && body && typeof body === "object") {
          const fallback = await seamlessWallet(body as SeamlessRequest, headers);
          return Response.json(fallback, {
            status: fallback.ok ? 200 : fallback.error === "Unauthorized" ? 401 : 400,
          });
        }
        return Response.json(result, {
          status: result.ok ? 200 : result.error === "Unauthorized" ? 401 : 400,
        });
      },
    },
  },
});
