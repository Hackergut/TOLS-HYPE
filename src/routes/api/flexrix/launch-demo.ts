import { createFileRoute } from "@tanstack/react-router";
import { flexrixBase } from "@/lib/operator/flexrix-sign";

export const Route = createFileRoute("/api/flexrix/launch-demo")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const url = new URL(request.url);
        const slug = url.searchParams.get("slug") ?? "";
        if (!slug) return Response.json({ error: "slug required" }, { status: 400 });
        const qs = new URLSearchParams({
          balance: url.searchParams.get("balance") ?? "5000",
          currency: url.searchParams.get("currency") ?? "USD",
          lang: url.searchParams.get("lang") ?? "en",
        });
        try {
          const res = await fetch(`${flexrixBase()}/v1/native/${encodeURIComponent(slug)}/launch-demo?${qs}`, {
            method: "POST",
            signal: AbortSignal.timeout(12_000),
          });
          const json = (await res.json()) as { url?: string; error?: string };
          if (!json.url) return Response.json({ error: json.error ?? "Demo launch failed" }, { status: 400 });
          return Response.json({ url: json.url });
        } catch (err) {
          return Response.json({ error: err instanceof Error ? err.message : "Demo launch failed" }, { status: 502 });
        }
      },
    },
  },
});
