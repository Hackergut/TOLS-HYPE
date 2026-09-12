import { createFileRoute } from "@tanstack/react-router";
import { inboundWallet } from "@/lib/operator/operator.server";

async function bodyFrom(request: Request): Promise<unknown> {
  const ct = request.headers.get("content-type") ?? "";
  if (ct.includes("application/x-www-form-urlencoded")) {
    const text = await request.text();
    return Object.fromEntries(new URLSearchParams(text));
  }
  try {
    return await request.json();
  } catch {
    return {};
  }
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
      GET: async () => Response.json({ ok: true, path: "/api/flexrix/callback" }),
      POST: async ({ request }) => {
        const result = await inboundWallet(await bodyFrom(request), headersOf(request));
        return Response.json(result, { status: result.ok ? 200 : 400 });
      },
    },
  },
});
