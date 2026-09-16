import { createFileRoute } from "@tanstack/react-router";
import { handleAffiliatePostback } from "@/lib/affiliate/postback.server";

const CORS = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET,POST,OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Webhook-Secret",
};

export const Route = createFileRoute("/api/affiliate/postback")({
    server: {
          handlers: {
                  OPTIONS: async () => new Response(null, { status: 204, headers: CORS }),
                  GET: async () =>
                            Response.json(
                              {
                                            ok: true,
                                            service: "tols-affiliate-postback",
                                            hint: "POST JSON { subid, event, amount?, secret }",
                                            exampleSubid: "tg_123456789",
                              },
                              { headers: CORS },
                                      ),
                  POST: async ({ request }) => {
                            const res = await handleAffiliatePostback(request);
                            const headers = new Headers(res.headers);
                            for (const [k, v] of Object.entries(CORS)) headers.set(k, v);
                            return new Response(res.body, { status: res.status, headers });
                  },
          },
    },
});
