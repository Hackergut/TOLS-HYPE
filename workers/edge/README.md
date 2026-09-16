# TOLS Cloudflare edge

Linear: TOLS-18 (parent TOLS-17 / TOLS-16). Corrects TOLS-12: **D1 is not money SoT.**

Live origin stays `https://www.tols.fun` (Vercel HYPE). This worker is an optional front-door.

## What it does

| Path | Behaviour |
| --- | --- |
| `GET /brand/*` | KV cache 1h |
| `GET /api/health` `/api/geo` | KV cache 15s |
| `POST /api/telegram/webhook` or `/tg/webhook` | secret header check, then forward to origin |
| `GET /edge/health` | worker self-check, no secrets |
| `/api/auth/*` `/api/flexrix/*` `/api/platform/*` `/api/wallet*` | pass-through, `Cache-Control: no-store` |

## What it must never do

- Hold balances, bonus, or bets in KV/D1
- Terminate Flexrix or platform HMAC
- Validate Mini App `initData` (HMAC stays on HYPE)
- Cache authenticated HTML

## Deploy (owner — Cloudflare account required)

Connector is not available in this Grok workspace. From a machine with Wrangler:

```bash
cd workers/edge
npx wrangler login
npx wrangler kv namespace create EDGE_CACHE
# paste id into wrangler.toml
npx wrangler secret put TELEGRAM_WEBHOOK_SECRET   # same value as HYPE Vercel
npx wrangler deploy
```

Then either:

1. Point `edge.tols.fun` at the worker and keep www on Vercel, **or**
2. Put Cloudflare proxy in front of www.tols.fun and route only `/brand/*` + `/api/telegram/webhook` to this worker (Page Rules / Workers Routes). Do not orange-cloud Flexrix callback until recert.

BotFather `setWebhook` after Mini App PR 11 is live:

```
https://edge.tols.fun/api/telegram/webhook
```

with the same `secret_token`.

## Test without deploy

```bash
cd workers/edge
npx wrangler dev
curl -i http://127.0.0.1:8787/edge/health
curl -i http://127.0.0.1:8787/api/telegram/webhook   # 405 GET / 401 POST without secret
```
