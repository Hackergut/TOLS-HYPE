import { createFileRoute } from "@tanstack/react-router";
import { handleSportsbookWallet } from "@/lib/operator/sportsbook.server";

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, HEAD, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, X-Merchant-Id, X-Timestamp, X-Nonce, X-Sign, Authorization",
};

async function bodyOf(request: Request): Promise<Record<string, unknown>> {
  const ct = request.headers.get("content-type") ?? "";
  if (ct.includes("json")) return ((await request.json().catch(() => ({}))) as Record<string, unknown>) ?? {};
  return Object.fromEntries(new URLSearchParams(await request.text()));
}

function hdr(request: Request) {
  const h: Record<string, string> = {};
  request.headers.forEach((v, k) => {
    h[k.toLowerCase()] = v;
  });
  return h;
}

export const Route = createFileRoute("/api/sportsbook/callback/$action")({
  server: {
    handlers: {
      OPTIONS: async () => new Response(null, { status: 204, headers: CORS }),
      POST: async ({ request, params }) => {
        const { status, json } = await handleSportsbookWallet(params.action, await bodyOf(request), hdr(request));
        return Response.json(json, { status, headers: CORS });
      },
    },
  },
});
