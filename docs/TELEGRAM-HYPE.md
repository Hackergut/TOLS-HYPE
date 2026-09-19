# TOLS-HYPE Telegram Mini App

Parent Linear: TOLS-17. Official player bot: **@tolshypebot** only.

## Live vs this branch

| Surface | Production today | This branch |
| --- | --- | --- |
| Login widget `GET /api/auth/telegram` | 200, bot=tolshypebot | unchanged |
| Mini App initData `POST /api/auth/telegram/miniapp` | missing | added |
| Webhook `POST /api/telegram/webhook` | 404 | fail-closed 401 without secret |
| Diag `GET /api/telegram/diag` | missing | flags only, no secrets |
| SDK `telegram-web-app.js` | absent | loaded in root |
| `frame-ancestors` | absent | vercel.json |

## HMAC (do not mix)

- Widget: key = SHA256(bot_token) \u2014 `verifyTelegramWidget`
- Mini App: key = HMAC-SHA256("WebAppData", bot_token) \u2014 `validateTelegramInitData`

## Env (Vercel HYPE, never commit)

```
TELEGRAM_BOT_TOKEN=
TELEGRAM_BOT_NAME=tolshypebot
TELEGRAM_WEBHOOK_SECRET=          # openssl rand -hex 32
TELEGRAM_CHANNEL_HANDLE=tolsfun
TELEGRAM_SUPPORT_HANDLE=
APP_URL=https://www.tols.fun
```

Webhook rejects every request when `TELEGRAM_WEBHOOK_SECRET` is unset.

## BotFather (owner must tap)

1. Allowed URLs (Login Widget): `https://www.tols.fun` and `https://www.tols.fun/api/auth/telegram/callback`
2. `/newapp` \u2192 @tolshypebot \u2192 URL `https://www.tols.fun`
3. Menu button \u2192 Mini App same URL
4. `setWebhook` after merge:

```
https://api.telegram.org/bot$TOKEN/setWebhook
?url=https://www.tols.fun/api/telegram/webhook
&secret_token=$TELEGRAM_WEBHOOK_SECRET
```

## Commands

/start /play /wallet /promo /channel /support /help

`/balance` never prints a number. Stars checkout is rejected.

## Channel

`t.me/tolsfun` is currently a Contact handle, not a proven public channel.
Owner creates/converts the channel in Telegram, adds @tolshypebot as admin with post rights, then sets `TELEGRAM_CHANNEL_HANDLE`.

Bio must include 18+ and BeGambleAware. No guaranteed-win copy.

## Cloudflare

Optional later. Money SoT stays the casino ledger. No D1 balances. Connector is not available in this workspace.
