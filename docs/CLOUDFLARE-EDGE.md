# TOLS Cloudflare Workers edge

See `workers/edge/README.md` for deploy steps.

Linear: TOLS-17. GitHub: [PR #12](https://github.com/Hackergut/TOLS-HYPE/pull/12).

**Not live.** www.tols.fun is Vercel HYPE. No Cloudflare connector in this workspace.

## Routing rule

Attach the worker only to:

- `GET /brand/*`
- `GET /api/health` `/api/geo`
- `POST /api/telegram/webhook`
- `GET /edge/health`

Do **not** put the whole zone orange-cloud in front of `/api/flexrix/callback` until Flexrix recert.

If you later proxy all of www, keep cookies on `/api/auth/*` and wallet paths. Public cache paths must stay cookieless.

## Money

Casino ledger / Neon = SoT. KV/D1 = cache only.
