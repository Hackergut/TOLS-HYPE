# Official TOLS Telegram channel

`t.me/tolsfun` is a **user/contact** handle (Send Message). It is not a public channel. Do not treat it as the official feed until it shows Join + subscriber count.

Telegram does not convert a user account into a channel. Create a **new public channel**.

## Recommended handle

If `@tolsfun` stays a person: use `@tolsofficial` or `@tolsfunchannel`.
If you can free `@tolsfun` later, set `TELEGRAM_CHANNEL_HANDLE` after the transfer.

## Create (owner, 2 minutes)

1. Telegram → New Channel → Public.
2. Name: `TOLS`
3. Username: pick one that is free. Note it.
4. Photo: TOLS mark (square).
5. Description / bio:

```
Official TOLS channel. 18+ only.
Play responsibly · BeGambleAware.org
Casino: www.tols.fun
Bot / Mini App: @tolshypebot
We never ask for seed phrases, passwords or 2FA.
```

6. Add `@tolshypebot` as administrator with **Post messages**.
7. Pin the first post below.
8. Vercel env `TELEGRAM_CHANNEL_HANDLE=<handle without @>` then redeploy.
9. Footer / Connect currently hardcode `t.me/tolsfun`. After the handle exists, tell us and we switch the links.

## First pin (copy as-is)

```
TOLS official channel.

18+ only. Gambling is entertainment — never stake more than you can lose.
Help: https://www.begambleaware.org

Play: @tolshypebot
Site: https://www.tols.fun

We never DM first asking for money, seed phrases, or codes.
```

No “guaranteed win”, no fake jackpot screenshots, no Stars deposit claims.

## What we cannot do from this workspace

- Create or convert Telegram channels
- Call BotFather
- `setWebhook` (needs bot token)
- Merge PR 11 while Vercel blocks the Git author on team tols-hype
