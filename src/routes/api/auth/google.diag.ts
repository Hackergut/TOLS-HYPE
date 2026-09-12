import { createFileRoute } from "@tanstack/react-router";
import { handleGoogleDiag } from "@/lib/auth/google-handlers.server";

export const Route = createFileRoute("/api/auth/google/diag")({
  server: {
    handlers: {
      GET: async () => handleGoogleDiag(),
    },
  },
});
