import { createFileRoute } from "@tanstack/react-router";
import { env } from "@/lib/env.server";
import {
  answerCallback,
  handleCommand,
  rejectStarsCheckout,
  sendMessage,
} from "@/lib/telegram-bot.server";

/**
 * Telegram bot webhook. Fail-closed.
 * Secret check runs before any other work. No DB import at module scope.
 */

type TgFrom = { id?: number; first_name?: string; username?: string };
type TgChat = { id: number; type?: string };
type TgUpdate = {
  message?: { chat?: TgChat; from?: TgFrom; text?: string; successful_payment?: unknown };
  callback_query?: { id: string; data?: string; from?: TgFrom; message?: { chat?: TgChat } };
  pre_checkout_query?: { id: string };
};

function safeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

function authorized(request: Request): boolean {
  const secret = env("TELEGRAM_WEBHOOK_SECRET") || "";
  const got = request.headers.get("x-telegram-bot-api-secret-token") ?? "";
  if (!secret) return false;
  return safeEqual(got, secret);
}

async function route(update: TgUpdate): Promise<void> {
  if (update.pre_checkout_query) {
    await rejectStarsCheckout(update.pre_checkout_query.id);
    return;
  }
  if (update.message?.successful_payment) {
    const chatId = update.message.chat?.id;
    if (chatId) {
      await sendMessage({
        chatId,
        text: "Telegram Stars deposits are not enabled. Contact /support if you were charged.",
      });
    }
    return;
  }
  if (update.callback_query) {
    const q = update.callback_query;
    await answerCallback(q.id);
    const chatId = q.message?.chat?.id;
    if (chatId && q.data?.startsWith("cmd:")) {
      await handleCommand("/" + q.data.slice(4), chatId, q.from?.first_name);
    }
    return;
  }
  const msg = update.message;
  const chatId = msg?.chat?.id;
  const text = msg?.text?.trim();
  if (!chatId || !text) return;
  if (text.startsWith("/")) {
    const cmd = text.split(/[\s@]/)[0].toLowerCase();
    await handleCommand(cmd, chatId, msg?.from?.first_name);
    return;
  }
  if (msg?.chat?.type === "private") {
    await sendMessage({ chatId, text: "Use /help to see what I can do." });
  }
}

export const Route = createFileRoute("/api/telegram/webhook")({
  server: {
    handlers: {
      GET: async () => new Response("Method Not Allowed", { status: 405 }),
      POST: async ({ request }) => {
        if (!authorized(request)) return new Response("Unauthorized", { status: 401 });
        const update = (await request.json().catch(() => null)) as TgUpdate | null;
        if (!update) return Response.json({ ok: true });
        try {
          await route(update);
        } catch (e) {
          console.error("[telegram/webhook]", e);
        }
        return Response.json({ ok: true });
      },
    },
  },
});
