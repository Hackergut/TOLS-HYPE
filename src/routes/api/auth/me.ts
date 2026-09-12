import { createFileRoute } from "@tanstack/react-router";
import { handleGoogleLogout, handleGoogleMe } from "@/lib/auth/google-handlers.server";

export const Route = createFileRoute("/api/auth/me")({
  server: {
    handlers: {
      GET: async ({ request }) => handleGoogleMe(request),
      POST: async ({ request }) => handleGoogleLogout(request),
    },
  },
});
