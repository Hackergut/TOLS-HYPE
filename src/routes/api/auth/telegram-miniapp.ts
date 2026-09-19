import { createFileRoute } from "@tanstack/react-router";
import { handleTelegramMiniApp } from "@/lib/auth/telegram-handlers.server";

export const Route = createFileRoute("/api/auth/telegram/miniapp")({
  server: {
    handlers: {
      POST: async ({ request }) => handleTelegramMiniApp(request),
      GET: async () => new Response("Method Not Allowed", { status: 405 }),
    },
  },
});
