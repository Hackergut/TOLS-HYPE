import { createFileRoute } from "@tanstack/react-router";
import { inboundWallet } from "@/lib/operator/operator.server";

export const Route = createFileRoute("/api/operator/callback")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const headers: Record<string, string> = {};
        request.headers.forEach((v, k) => {
          headers[k.toLowerCase()] = v;
        });
        const body: unknown = await request.json();
        const result = await inboundWallet(body, headers);
        return Response.json(result, { status: result.ok ? 200 : 400 });
      },
    },
  },
});
