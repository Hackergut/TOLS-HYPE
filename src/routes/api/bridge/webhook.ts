import { createFileRoute } from "@tanstack/react-router";
import { handleBridgeWebhook } from "@/lib/governance/webhook.server";

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET,POST,OPTIONS,HEAD",
  "Access-Control-Allow-Headers":
    "Content-Type, Authorization, X-Bridge-Signature, X-Bridge-Timestamp, X-Webhook-Signature, X-Tower-Signature, X-Governance-Signature, X-Bridge-Source, X-Casino-Origin, X-Platform-Public-Key, X-Bridge-Path",
};

export const Route = createFileRoute("/api/bridge/webhook")({
  server: {
    handlers: {
      OPTIONS: async () => new Response(null, { status: 204, headers: CORS }),
      HEAD: async () => new Response(null, { status: 200, headers: CORS }),
      GET: async () =>
        Response.json(
          {
            success: true,
            reachable: true,
            service: "tols-casino-bridge-webhook",
            ts: new Date().toISOString(),
            hint: "POST with X-Bridge-Signature: sha256=<hmac> and X-Bridge-Timestamp",
          },
          { headers: CORS },
        ),
      POST: async ({ request }) => handleBridgeWebhook(request),
    },
  },
});
