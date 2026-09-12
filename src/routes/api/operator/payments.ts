import { createFileRoute } from "@tanstack/react-router";
import { publicCashierLinks } from "@/lib/operator/payments";

export const Route = createFileRoute("/api/operator/payments")({
  server: {
    handlers: {
      GET: async () => Response.json(publicCashierLinks()),
    },
  },
});
