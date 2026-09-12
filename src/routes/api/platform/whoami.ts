import { createFileRoute } from "@tanstack/react-router";
import { requirePlatformAuth } from "@/lib/governance/platform-jwt";

export const Route = createFileRoute("/api/platform/whoami")({
  server: {
    handlers: {
      OPTIONS: async () =>
        new Response(null, {
          status: 204,
          headers: {
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Methods": "GET,OPTIONS",
            "Access-Control-Allow-Headers": "Authorization, Content-Type",
          },
        }),
      GET: async ({ request }) => {
        const auth = requirePlatformAuth(request);
        if ("response" in auth) return auth.response;
        return Response.json({
          success: true,
          data: {
            authenticated: true,
            claims: auth.claims,
            service: "tols-casino",
            note: "JWT valid — the Tower is authenticated.",
          },
        });
      },
    },
  },
});
