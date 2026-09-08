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
        const body: unknown = await request.json();
        const result = await inboundWallet(body, headers);
        if (result.error === "Unrecognized wallet payload" && body && typeof body === "object") {
          const fallback = await seamlessWallet(body as SeamlessRequest, headers);
          return Response.json(fallback, { status: fallback.ok ? 200 : 400 });
        }
        return Response.json(result, { status: result.ok ? 200 : 400 });
      },
    },
  },
});
