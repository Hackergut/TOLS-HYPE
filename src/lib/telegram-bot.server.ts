import { env } from "@/lib/env.server";

/** Thin Bot API client. Never throws. No DB imports at module scope. */

const API = "https://api.telegram.org";

type InlineButton =
  | { text: string; url: string }
  | { text: string; web_app: { url: string } };

function botToken(): string | undefined {
  return env("TELEGRAM_BOT_TOKEN");
}

export function appUrl(): string {
  return (env("APP_URL") || env("VITE_APP_URL") || "https://www.tols.fun").replace(/\/$/, "");
}

export function channelHandle(): string {
  return (env("TELEGRAM_CHANNEL_HANDLE") || "tolsfun").replace(/^@/, "");
}

export function supportHandle(): string | undefined {
  const h = env("TELEGRAM_SUPPORT_HANDLE")?.replace(/^@/, "").trim();
  return h || undefined;
}

export async function tg(method: string, body: Record<string, unknown>): Promise<boolean> {
  const token = botToken();
  if (!token) return false;
  try {
    const res = await fetch(`${API}/bot${token}/${method}`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(body),
    });
    return res.ok;
  } catch {
    return false;
  }
}

function esc(s: string): string {
  return s.replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]!));
}

function webApp(text: string, path = "/?tg=1"): InlineButton {
  return { text, web_app: { url: `${appUrl()}${path}` } };
}

function playKeyboard(): InlineButton[][] {
  return [
    [webApp("Open TOLS", "/?tg=1")],
    [webApp("Casino", "/casino?tg=1"), webApp("Slots", "/slots?tg=1")],
    [webApp("Live", "/live?tg=1"), webApp("Sports", "/sports?tg=1")],
    [{ text: "Channel", url: `https://t.me/${channelHandle()}` }],
  ];
}

export async function sendMessage(opts: {
  chatId: number;
  text: string;
  buttons?: InlineButton[][];
}): Promise<void> {
  await tg("sendMessage", {
    chat_id: opts.chatId,
    text: opts.text,
    parse_mode: "HTML",
    disable_web_page_preview: true,
    reply_markup: opts.buttons ? { inline_keyboard: opts.buttons } : undefined,
  });
}

export async function answerCallback(id: string): Promise<void> {
  await tg("answerCallbackQuery", { callback_query_id: id });
}

export async function rejectStarsCheckout(id: string): Promise<void> {
  await tg("answerPreCheckoutQuery", {
    pre_checkout_query_id: id,
    ok: false,
    error_message: "Deposits via Telegram Stars are not enabled.",
  });
}

export async function handleCommand(cmd: string, chatId: number, firstName?: string): Promise<void> {
  const name = firstName ? esc(firstName) : "there";
  const buttons = playKeyboard();
  const support = supportHandle();

  switch (cmd) {
    case "/start":
      await sendMessage({
        chatId,
        text:
          `Welcome to <b>TOLS</b>, ${name}.\n\n` +
          `18+ only. Play responsibly \u2014 <a href="https://www.begambleaware.org">BeGambleAware.org</a>.\n\n` +
          `Open the Mini App below. We never ask for seed phrases, passwords or 2FA codes.`,
        buttons,
      });
      return;
    case "/play":
      await sendMessage({ chatId, text: "Pick a section.", buttons });
      return;
    case "/balance":
    case "/wallet":
      await sendMessage({
        chatId,
        text: "Your balance lives in the casino, where Telegram identity is verified. Open the wallet below.",
        buttons: [[webApp("Open wallet", "/?section=wallet&tg=1")]],
      });
      return;
    case "/promo":
      await sendMessage({
        chatId,
        text: "Current promotions are listed inside the app. Terms apply. 18+.",
        buttons: [[webApp("Promotions", "/promotions?tg=1")]],
      });
      return;
    case "/channel":
      await sendMessage({
        chatId,
        text: `Official channel: @${esc(channelHandle())}`,
        buttons: [[{ text: "Open channel", url: `https://t.me/${channelHandle()}` }]],
      });
      return;
    case "/support": {
      const rows: InlineButton[][] = [];
      if (support) rows.push([{ text: "Contact support", url: `https://t.me/${support}` }]);
      rows.push([{ text: "Help centre", url: `${appUrl()}/help` }]);
      await sendMessage({
        chatId,
        text: "Need a hand? We never ask for your password, seed phrase or 2FA codes.",
        buttons: rows,
      });
      return;
    }
    case "/help":
      await sendMessage({
        chatId,
        text:
          "<b>TOLS commands</b>\n\n" +
          "/start \u2014 open the casino\n" +
          "/play \u2014 sections\n" +
          "/wallet \u2014 open wallet in Mini App\n" +
          "/promo \u2014 promotions\n" +
          "/channel \u2014 official channel\n" +
          "/support \u2014 help\n\n" +
          "18+ \u00b7 BeGambleAware.org",
        buttons: [[webApp("Open TOLS")]],
      });
      return;
    default:
      await sendMessage({ chatId, text: "Unknown command. Try /help." });
  }
}
