import { createFileRoute } from "@tanstack/react-router";
import { env } from "@/lib/env.server";

export const Route = createFileRoute("/api/telegram/diag")({
  server: {
    handlers: {
      GET: async () =>
        Response.json({
          ok: true,
          v: "tg-mini-1",
          widget: Boolean(env("TELEGRAM_BOT_TOKEN")),
          webhookSecret: Boolean(env("TELEGRAM_WEBHOOK_SECRET")),
          botName: env("TELEGRAM_BOT_NAME") || null,
          channel: env("TELEGRAM_CHANNEL_HANDLE") || "tolsfun",
          stars: false,
        }),
    },
  },
});
