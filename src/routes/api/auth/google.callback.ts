import { createFileRoute } from "@tanstack/react-router";
import { handleGoogleCallback } from "@/lib/auth/google-handlers.server";

export const Route = createFileRoute("/api/auth/google/callback")({
  server: {
    handlers: {
      GET: async ({ request }) => handleGoogleCallback(request),
    },
  },
});
