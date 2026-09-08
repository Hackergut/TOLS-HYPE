import { createFileRoute } from "@tanstack/react-router";
import { paymentEndpoints } from "@/lib/operator/payments";

export const Route = createFileRoute("/api/operator/payments")({
  server: {
    handlers: {
      GET: async () => Response.json(paymentEndpoints()),
    },
  },
});
