import { createFileRoute } from "@tanstack/react-router";
import { corsHeaders, handleFlexrixWallet } from "@/lib/operator/flexrix-wallet";

async function parseBody(request: Request): Promise<Record<string, unknown>> {
  const ct = request.headers.get("content-type") ?? "";
  if (ct.includes("application/json")) {
    return ((await request.json().catch(() => ({}))) as Record<string, unknown>) ?? {};
  }
  const text = await request.text();
  return Object.fromEntries(new URLSearchParams(text));
}

function headersOf(request: Request): Record<string, string> {
  const headers: Record<string, string> = {};
  request.headers.forEach((v, k) => {
    headers[k.toLowerCase()] = v;
  });
  return headers;
}

function json(body: unknown, status = 200) {
  return Response.json(body, { status, headers: corsHeaders() });
}

export const Route = createFileRoute("/api/flexrix/callback")({
  server: {
    handlers: {
      OPTIONS: async () => new Response(null, { status: 204, headers: corsHeaders() }),
      HEAD: async () => new Response(null, { status: 200, headers: corsHeaders() }),
      GET: async () => json({ ok: true, service: "flexrix-callback" }),
      POST: async ({ request }) => {
        const { status, json: body } = await handleFlexrixWallet(await parseBody(request), headersOf(request));
        return json(body, status);
      },
    },
  },
});
