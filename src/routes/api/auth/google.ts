import { createFileRoute } from "@tanstack/react-router";
import { handleGoogleStart } from "@/lib/auth/google-handlers.server";

export const Route = createFileRoute("/api/auth/google")({
  server: {
    handlers: {
      GET: async ({ request }) => handleGoogleStart(request),
    },
  },
});
