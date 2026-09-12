import { createFileRoute } from "@tanstack/react-router";
import { handleFlexrixWallet } from "@/lib/operator/flexrix-wallet";

async function formBody(request: Request): Promise<Record<string, string>> {
  const ct = request.headers.get("content-type") ?? "";
  if (ct.includes("application/json")) {
    const json = (await request.json().catch(() => ({}))) as Record<string, unknown>;
    return Object.fromEntries(Object.entries(json).map(([k, v]) => [k, v == null ? "" : String(v)]));
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

export const Route = createFileRoute("/api/flexrix/callback")({
  server: {
    handlers: {
      GET: async () =>
        Response.json({
          ok: true,
          path: "/api/flexrix/callback",
          hint: "Register this URL as flexrixCasinoCallbackUrl. POST action=balance|bet|win|refund|rollback",
        }),
      POST: async ({ request }) => {
        const { status, json } = await handleFlexrixWallet(await formBody(request), headersOf(request));
        return Response.json(json, { status });
      },
    },
  },
});
