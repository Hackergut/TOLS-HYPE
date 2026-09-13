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
        let body: unknown;
        try {
          body = await request.json();
        } catch {
          return Response.json({ ok: false, error: "Invalid JSON" }, { status: 400 });
        }
        const result = await inboundWallet(body, headers);
        return Response.json(result, {
          status: result.ok ? 200 : result.error === "Unauthorized" ? 401 : 400,
        });
      },
    },
  },
});
