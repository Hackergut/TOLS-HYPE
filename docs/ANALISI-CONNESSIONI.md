# TOLS-HYPE — Analisi progetto e connessioni da integrare

> Data analisi: 2026-09-13 · Branch: `arena/01a09817-tols-hype` · Commit base: `4a97948`
> Stack: TanStack Start + React 19 + Vite + Tailwind v4 · Better Auth · Prisma + Postgres (Neon) / PGLite fallback · Deploy Vercel

## 1. Cos'è questo progetto

**TOLS-HYPE è una skin white-label del casinò TOLS** ("TOLS Originals" + lobby aggregata), pensata per girare come frontend autonomo (`https://www.tols.fun`) ma con backend intercambiabile via env, senza riscrivere la UI.

Tre anime convivono nel repo:

| Anima | Dove vive | Stato |
|---|---|---|
| **Originals giocabili in-app** (Crash, Roulette, Blackjack, Slots, Dice, Mines, Keno, Hi-Lo, Limbo, Plinko, Tower, Pool) con RNG provably-fair | `src/lib/casino-api.ts`, `src/lib/fair*.ts`, `src/components/games/*`, `src/routes/_shell/originals*`, `play.$slug`, `games.$id` | ✅ Funzionante in locale (wallet play-money) |
| **Lobby remota via aggregatori** (slot/live di terze parti in iframe) | `src/lib/operator/*` (9 adapter), `src/routes/api/operator/*`, `src/routes/api/flexrix/*`, `src/routes/api/sportsbook/*` | ⚠️ Codice pronto, in attesa di credenziali/secure-callback |
| **Ponte di governance** verso `gov.tols.fun` (KYC, limiti, RTP, ledger Solana, bonus, support) | `src/lib/governance/*`, `src/routes/api/bridge/*`, `src/routes/api/platform/*`, `src/routes/api/treasury.ts` | ⚠️ Codice pronto, in attesa di segreti condivisi + JWT |

Il resto (auth Better Auth, wallet SQL/Prisma, notifiche push, cashier, pagine legali/AML/responsible, VIP, promo, sport UI, token page) è l'infrastruttura da operatore reale.

## 2. Architettura in breve

```
Browser (React 19 + TanStack Router)
  ├─ Originals → serverFn casino-api.ts → wallet.server.ts (Prisma) → Postgres/PGLite
  │            └→ fair.server.ts (HMAC seeds) + pushBridgeEvent → gov.tols.fun
  ├─ Lobby remota → rpc.ts (listRemoteGames/launchRemoteGame) → registry.ts → 1 dei 9 adapter
  │            └→ iframe (aggregator-frame.tsx / flexrix-frame.tsx) con URL di launch firmata
  └─ Wallet seamless INBOUND ← vendor (Flexrix/Sportsbook/Softswiss/…) → /api/*/callback → debit/credit

Server (Nitro su Vercel, preset vercel — serverDir ./server)
  ├─ /api/operator/*      → catalogo + launch + wallet generico (adapter attivo)
  ├─ /api/flexrix/*       → wallet GIS (HMAC-SHA1) + launch-demo
  ├─ /api/sportsbook/*    → wallet sport (HMAC-SHA1) + sessione JWT + eventi
  ├─ /api/bridge/*        → webhook HMAC-SHA256 verso/da Governance Tower
  ├─ /api/platform/*      → health/whoami (JWT Tower → Casino)
  ├─ /api/treasury        → lettura Solana RPC + push solana_ledger al Tower
  └─ /api/auth/*          → Better Auth (Grok broker OAuth + Google OAuth diretto)
```

DB: `migrations/*.sql` (auth Better Auth + wallets/transactions + notifications + fair_seeds + bet_rounds) applicate sia su Neon in build (`scripts/migrate.mjs`) sia su PGLite in dev/preview. Prisma copre solo `wallets` + `transactions`; il resto usa `getSql()` (Kysely/SQL grezzo).

## 3. Mappa delle connessioni (da integrare / verificare)

### 3.1 FLEXRIX HUB — Casinò (priorità P0) 🔴
- **Codice**: `operator/adapters/flexrix.ts`, `flexrix-sign.ts`, `flexrix-wallet.ts`, `routes/api/flexrix/callback.ts`, `routes/api/flexrix/launch-demo.ts`, `routes/api/operator/games.ts`
- **Protocollo**: REST `https://api.upaflex.online` + header `X-Merchant-Id / X-Timestamp / X-Nonce / X-Sign` (HMAC-SHA1 su query ordinate + URL-encoded). Wallet inbound GIS: `getPlayerInfo/debit/credit/rollback` con idempotenza su `note` ledger.
- **Env richieste**: `FLEXRIX_API_BASE`, `FLEXRIX_MERCHANT_KEY` (formato `FXC_*`), `FLEXRIX_API_SECRET` (alias `FLEXRIX_CASINO_SECRET`)
- **Default attivo**: `AGGREGATOR_KIND=flexrix` è già il default sia client che server → la lobby chiama Flexrix appena le chiavi esistono.
- **Quota lobby**: `lobby-quota.ts` — max 30 slot/studio illustrati, cap 800, esclusi tavoli live turchi e studio Nolimit.
- **Demo senza chiavi**: `launch-demo` (balance 5000 USD fake) funziona anche non configurato.
- **Da fare**:
  1. Inserire merchant key + secret reali (oggi `flexrixConfigured()==false` → solo demo).
  2. Registrare presso Flexrix il callback `POST {CASINO_ORIGIN}/api/flexrix/callback` e superare la certificazione (`test_player:*` auto-seedati a 1000 USDT in `flexrix-wallet.ts`).
  3. Verificare mapping valute: `USDT/SOL → USD` in launch; wallet GIS opera su `USDT`.
  4. Verificare `GET /api/operator/games` → `flexrix.configured=true, count>0, error=null`.

### 3.2 FLEXRIX SPORTSBOOK (priorità P0) 🔴
- **Codice**: `operator/sportsbook.server.ts`, `routes/api/sportsbook/callback*.ts`, `session.ts`, `events.ts`, `components/sports/flexrix-frame.tsx`
- **Protocollo**: iframe `https://sports.flexrix.com/en/sports?token=<JWT HS256>&lang=en` (SSO, `sportsSsoToken`, exp 1h) + wallet HMAC-SHA1 sugli stessi header Flexrix.
- **Env**: `FLEXRIX_SPORTS_ORIGIN`, `FLEXRIX_SPORTS_SECRET` (fallback `FLEXRIX_API_SECRET`), `FLEXRIX_SPORTS_JWT_SECRET`
- **Da fare**:
  1. Ottenere origin + secret sport reali da Flexrix.
  2. Registrare callback `POST {origin}/api/sportsbook/callback[/$action]`.
  3. Decidere sorgente eventi: oggi `/api/sportsbook/events` ritorna sempre `SPORT_EVENTS` locali (mock in `sports-book.ts`) con `flexrix` solo come debug — serve UI switch `source==flexrix` o listato reale.
  4. Test SSO: `GET /api/sportsbook/session` deve dare `url` con token (oggi guest se non loggato).

### 3.3 tols-casino-next — origine live / bridge SSO (priorità P0) 🟠
- **Codice**: `operator/adapters/tols-next.ts`, `operator/sso.ts`, `operator/payments.ts`, `operator/payment.ts`
- **Flussi**:
  - Lobby proxy: `GET {CASINO_ORIGIN}/api/games-lobby?featured=true` + `?category=live`
  - Launch: `POST /api/flexrix/launch` (autenticato) → fallback `GET /api/flexrix/launch-demo` → fallback `POST /api/vendor/launch`
  - Player SSO: `mintSkinSso` (HMAC-SHA256, `base64url(payload).sig`) → `POST /api/bridge/player-sso` (header `x-bridge-signature: sha256=…`) → fallback `GET /api/bridge/sso?token=` → cookie `tols_session`
  - Cashier reale: link `{CASINO_ORIGIN}/deposit` e `/account/wallet` (`publicCashierLinks`); `/api/casino-deposits` è dichiarato **retired (410)**
- **Env**: `CASINO_ORIGIN` / `APP_URL` (default `https://www.tols.fun`), `SKIN_SSO_SECRET` (alias `GOVERNANCE_BRIDGE_SECRET`, min 16 char)
- **Da fare**:
  1. Allineare `CASINO_ORIGIN` su tutti gli ambienti (attenzione: `payment.ts` ha default diverso `tols-plum.vercel.app` — uniformare).
  2. Condividere `SKIN_SSO_SECRET` identico tra skin, Next e Tower.
  3. Test end-to-end: login skin → launch gioco Next → verifica `tols_session` valida.
  4. Nota: gli adapter `flexrix` e `tols-next` sono alternativi (`AGGREGATOR_KIND` ne seleziona uno) ma entrambi puntano a Flexrix: decidere quale è il percorso produzione (diretto vs via Next).

### 3.4 GOVERNANCE TOWER — gov.tols.fun (priorità P1) 🟠
- **Codice**: `governance/bridge.ts`, `governance/webhook.server.ts`, `governance/platform-jwt.ts`, `governance/db-ping.server.ts`, `operator/adapters/governance.ts`, `operator/governance.ts`
- **Outbound** (casino → tower, HMAC-SHA256 `X-Bridge-Signature: sha256=…` + `X-Bridge-Timestamp`, skew 5'): `casino.bet/win/deposit_confirmed/withdrawal_*/session_*/health`, `solana_ledger`, `bridge.sync_request` → `POST /api/platform/webhooks` (fallback `/webhook`); health probe `GET /api/platform/health` → fallback `/api/health`.
- **Inbound** (tower → casino, `POST /api/bridge/webhook`): `governance.rtp_update/limits_update/feature_flag/session_invalidate/wallet_adjust/player_block/support_*/bonus_credit` + `ping→pong`. Firma obbligatoria tranne `ping`.
- **Platform JWT** (tower → casino): `GET /api/platform/whoami` verifica Bearer con `jose` (`PLATFORM_JWT_PUBLIC_KEY`, issuer `tols-governance`, aud `tols-casino`).
- **Env**: `GOVERNANCE_TOWER_URL` (alias `GOVERNANCE_URL`/`VITE_GOVERNANCE_URL`, default `https://gov.tols.fun`), `GOVERNANCE_BRIDGE_SECRET` (alias `GOVERNANCE_WEBHOOK_SECRET`/`GOVERNANCE_API_KEY`/`SKIN_SSO_SECRET`), `PLATFORM_JWT_PUBLIC_KEY[/ISSUER/AUDIENCE]`
- **Da fare**:
  1. Configurare secret ≥16ch + chiave pubblica JWT su entrambi i lati.
  2. Verificare `GET /api/platform/health` → `ok:true, db.ok, bridge.jwtConfigured:true` e `GET /api/bridge/health`.
  3. Test firma inbound con script HMAC (il repo ha `governance/bridge.test.ts` come riferimento).
  4. Mappare effetti inbound (`wallet_adjust`, `player_block`, `rtp_update`…) — oggi l'handler esiste ma va verificato contro tabelle reali (manca p.es. tabella `limits`/`rtp_overrides`).

### 3.5 EUROVIRTUALS / BETKRAFT (priorità P2) 🟡
- **Codice**: `operator/adapters/eurovirtuals.ts`
- **Stato**: punta a staging `https://api.staging.betkraft.co.uk` (`EV_API_BASE`), `GET /games` con `Bearer EV_API_KEY`; launch delegato a `{CASINO_ORIGIN}/api/eurovirtuals/launch` (**endpoint che non esiste in questo repo** — deve vivere su Next o va creato).
- **Env**: `EV_API_BASE`, `EV_API_KEY`, `EV_APP_KEY` (letta ma mai usata → verificare firma attesa)
- **Da fare**: ottenere credenziali prod, chiarire spec wallet (oggi `action/balance/bet/win/rollback` generica), implementare o puntare il launch endpoint reale.

### 3.6 Aggregatori generici — REST / Softswiss / Slotegrator / Legacy (priorità P2) 🟡
- **Codice**: `operator/adapters/{rest,softswiss,slotegrator,legacy}.ts`, `operator/http.ts`
- **Uso**: white-label verso altri operatori. Selezionabili via `AGGREGATOR_KIND`, base `AGGREGATOR_URL`, chiave `AGGREGATOR_API_KEY`, id `AGGREGATOR_OPERATOR_ID`, firma inbound `OPERATOR_WEBHOOK_SECRET`/`VENDOR_CALLBACK_SECRET`, mappa giochi legacy `LEGACY_GAME_MAP` (JSON).
- **Da fare**: solo se serve un secondo fornitore — la spec per-vendor (Softswiss `/v2/casino/games…`, Slotegrator `/games/init`, legacy `/api/startGame` + `amount_cents`) va validata contro la documentazione reale del vendor prima dell'attivazione.

### 3.7 Auth — Better Auth + Grok broker + Google (priorità P1) 🟠
- **Codice**: `lib/auth/*`, `routes/api/auth/*`, `routes/login.tsx`, `lib/app-data/*`
- **Stato cruciale**: `.grok/app-env.json` ha `VITE_AUTH_ENABLED=false` → in preview gira l'utente fittizio `dev-user`; in produzione (Vercel, senza quella flag) il login è reale.
- **Provider**: broker Grok OAuth (`GROK_PROVIDERS`, popup in preview / redirect in prod) + Google OAuth diretto (`/api/auth/google*`, handlers in `google-handlers.server.ts`) + email/password **disabilitata di default** (`email-password.ts`).
- **Isolamento multi-skin**: `isolation.server.ts` + `gate-identity.server.ts` mappano l'identità per non mescolare utenti tra skin.
- **Da fare**:
  1. Verificare variabili broker Google (`GOOGLE_CLIENT_ID/SECRET` o equivalenti in `google-oauth.ts`) su Vercel.
  2. Test login prod (non preview) + `GET /api/auth/me`.
  3. Decidere se abilitare email/password (serve UI signup/signin dedicata).
  4. A `VITE_AUTH_ENABLED=true`, `authMiddleware` diventa obbligatorio ovunque — verificare che nessuna serverFn anonima si rompa.

### 3.8 Database — Neon Postgres vs PGLite (priorità P1) 🟠
- **Codice**: `lib/db.ts`, `lib/prisma.server.ts`, `prisma/schema.prisma`, `migrations/*.sql`, `scripts/migrate.mjs`
- **Comportamento**: se `DATABASE_URL` presente → Neon (`@prisma/adapter-pg` + `pg`); altrimenti PGLite in-memory (dati persi al restart, con `_migrations` tracking).
- **Tabelle**: `user/session/account/verification` (Better Auth) · `wallets/transactions` (Prisma) · `game_rounds/bet_rounds` · `notifications/push_subscriptions/notification_prefs` · `fair_seeds`.
- **Env**: `DATABASE_URL` (alias `PRISMA_DATABASE_URL`), `SUPABASE_URL` + `SUPABASE_SERVICE_ROLE_KEY`/`ANON_KEY` (letti ma **mai usate per query** — backend `supabase` in `config.ts` è solo etichetta).
- **Da fare**:
  1. Provisionare Neon/Prisma Postgres prod e impostare `DATABASE_URL` su Vercel (oggi preview = PGLite effimero).
  2. Eseguire `npm run db:migrate` in build (già nello script `build`) e verificare `_migrations`.
  3. Decidere: rimuovere opzione `supabase` o implementarla davvero (oggi fuorviante in `operatorStatus`).
  4. `STARTING_BALANCES` sono tutti 0 → il faucet play-money è `cashier(deposit)` con cap; per prod reale serve deposito on-chain/fiat (vedi §3.10).

### 3.9 Solana Treasury + Ledger (priorità P1) 🟠
- **Codice**: `lib/treasury.server.ts`, `governance/solana-ledger.ts`, `routes/api/treasury.ts`
- **Flusso**: `GET /api/treasury` → JSON-RPC `getBalance` su `SOL_RPC_URL` (default mainnet-beta pubblico) per `TREASURY_SOL_ADDRESS` → push `solana_ledger` al Tower (silenzioso se fallisce).
- **Env**: `TREASURY_SOL_ADDRESS` (+ alias `VITE_*`), `TREASURY_USDT_ADDRESS` (fallback = SOL address), `TREASURY_BTC/ETH_ADDRESS`, `SOL_RPC_URL`
- **Da fare**: impostare address reali, usare RPC dedicato (quello pubblico è rate-limited), verificare `ready:true` e arrivo evento al Tower.

### 3.10 Pagamenti / Buy-crypto (priorità P1) 🟠
- **Codice**: `operator/payments.ts`, `operator/payment.ts`, `components/wallet/*`
- **Stato**: cashier interno = play-money (`cashier` serverFn con cap 5000 USDT / 0.5 BTC / 5 ETH); buy-crypto widget = Moonpay di default ma **solo `provider + publishable key` letti da env, nessun SDK montato**; depositi reali delegati a `{CASINO_ORIGIN}/deposit`.
- **Env**: `BUY_PROVIDER`/`NEXT_PUBLIC_BUY_PROVIDER`, `BUY_API_KEY`/`NEXT_PUBLIC_BUY_API_KEY`
- **Da fare**: integrare SDK Moonpay (o provider scelto) nel `cashier-dialog`, oppure completare redirect a Next; definire flusso withdrawal reale (oggi solo ledger interno).

### 3.11 Push notifications (priorità P2) 🟡
- **Codice**: `lib/notifications/*`, `public/sw.js`, `migrations/0003_notifications.sql`
- **Trigger automatici**: vincite notevoli (`win` ≥ soglia) e depositi (`wallet.server.ts` → `notifyUser`).
- **Env**: `VAPID_PUBLIC_KEY` (+ `VAPID_PRIVATE_KEY`, `VAPID_SUBJECT` in `push.server.ts`)
- **Da fare**: generare coppia VAPID prod, verificare `sw.js` registrato e permessi browser, test `sendPushToUser`.

### 3.12 Onchain EVM — viem/Base (priorità P3) 🟢
- **Codice**: `lib/onchain/*`, `components/ui/{chain-select,network-logo,asset-input}.tsx`
- **Stato**: UI chain-select (Ethereum/Base/Arbitrum/Optimism/Polygon, default Base 8453) + `viem` client read-only; nessun contratto chiamato, nessuna firma tx nel repo.
- **Da fare**: solo se si vuole deposito/withdrawal on-chain diretto dalla skin — altrimenti resta vetrina.

### 3.13 App-data / Connector Gate (Grok) (priorità P3) 🟢
- **Codice**: `lib/app-data/*`
- **Stato**: infrastruttura per leggere dati viewer (calendar/mail/file) via gate quando l'app gira dentro Grok; irrilevante per il casinò prod, utile solo se si costruiscono superfici "account" dentro Grok.
- **Da fare**: niente, salvo casi d'uso specifici.

## 4. Inventario env (checklist unica)

```
# Aggregatore (sceglierne uno: flexrix=default)
AGGREGATOR_KIND=flexrix|tols-next|eurovirtuals|governance|rest|softswiss|slotegrator|legacy|local
AGGREGATOR_URL= AGGREGATOR_API_KEY= AGGREGATOR_OPERATOR_ID=
OPERATOR_WEBHOOK_SECRET=            # alias VENDOR_CALLBACK_SECRET
LEGACY_GAME_MAP='{"old-id":"pulse-slots"}'
OPERATOR_BACKEND=local|sql|prisma|supabase|governance|aggregator

# Flexrix casino + sport
FLEXRIX_API_BASE=https://api.upaflex.online
FLEXRIX_MERCHANT_KEY=FXC_...
FLEXRIX_API_SECRET=...              # alias FLEXRIX_CASINO_SECRET
FLEXRIX_SPORTS_ORIGIN=https://sports.flexrix.com
FLEXRIX_SPORTS_SECRET=... FLEXRIX_SPORTS_JWT_SECRET=...

# Origine live + SSO skin↔Next↔Tower (stesso segreto ovunque, ≥16ch)
CASINO_ORIGIN=https://www.tols.fun  # alias APP_URL / CASINO_URL
SKIN_SSO_SECRET=...                 # alias GOVERNANCE_BRIDGE_SECRET

# Governance Tower + Platform JWT
GOVERNANCE_TOWER_URL=https://gov.tols.fun  # alias GOVERNANCE_URL
GOVERNANCE_BRIDGE_SECRET=...        # alias GOVERNANCE_WEBHOOK_SECRET / GOVERNANCE_API_KEY
PLATFORM_JWT_PUBLIC_KEY=... PLATFORM_JWT_ISSUER=tols-governance PLATFORM_JWT_AUDIENCE=tols-casino

# EuroVirtuals
EV_API_BASE=https://api.staging.betkraft.co.uk  EV_API_KEY=...  EV_APP_KEY=...

# DB / Auth / Push / Chain
DATABASE_URL=postgresql://...       # alias PRISMA_DATABASE_URL
SUPABASE_URL=... SUPABASE_SERVICE_ROLE_KEY=...   # oggi non usate nelle query
GOOGLE_CLIENT_ID=... GOOGLE_CLIENT_SECRET=...    # vedi google-oauth.ts
VAPID_PUBLIC_KEY=... VAPID_PRIVATE_KEY=... VAPID_SUBJECT=mailto:...
SOL_RPC_URL=... TREASURY_SOL_ADDRESS=... TREASURY_USDT/BTC/ETH_ADDRESS=...
BUY_PROVIDER=moonpay BUY_API_KEY=...  # alias NEXT_PUBLIC_*

# White-label UI (VITE_*)
VITE_OPERATOR_NAME=TOLS VITE_OPERATOR_LEGAL= VITE_OPERATOR_LICENSE= VITE_OPERATOR_SUPPORT=
VITE_SKIN_*  (NAME/LOGO/WORDMARK/PRIMARY/LIME/BACKGROUND)
VITE_AUTH_ENABLED=false             # preview; rimuovere in prod per login reale
```

## 5. Piano d'azione consigliato

**Fase 0 — Igiene ✅ COMPLETATA 2026-09-13** (commit su `arena/01a09817-tols-hype`)
- [x] Uniformare default `CASINO_ORIGIN` → `payment.ts` ora delega a `operatorServer().casinoOrigin` (single source); rimosso default driftato `tols-plum.vercel.app`.
- [x] Callback sportsbook dinamico: `session.ts` non hardcoda più `https://www.tols.fun/...` ma usa `operatorServer().casinoOrigin`.
- [x] Label onesta per backend `supabase` → "Supabase (REST fallback only)" + test che la fissa.
- [x] Rimosso `return` irraggiungibile in `flexrix-sign.ts` + fix errore TS7053 (typecheck ora verde).
- [x] Percorso Flexrix: decisione documentata — `flexrix` diretto = prod, `tols-next` = fallback; switch via `AGGREGATOR_KIND`.
- [ ] Rimuovere o implementare backend `supabase` (oggi solo label) → rinviato: ora è dichiarato come REST-fallback, implementazione client reale solo se richiesta.

**Hardening prod-safety ✅ COMPLETATO 2026-09-13**
- [x] VAPID: rimossa chiave privata hardcoded da `push.server.ts` (ora solo `VAPID_PRIVATE_KEY` da env, skip graceful se assente); chiave pubblica risolvibile via `VAPID_PUBLIC_KEY`/`VITE_VAPID_PUBLIC_KEY` con fallback legacy. ⚠️ **La vecchia coppia va ruotata in prod** (privata esposta nella git history).
- [x] Idempotenza `seamlessWallet` (bet/win): replay con stesso `txnId` ritornano il saldo senza doppio movimento — allineato a `flexrix-wallet.ts`.
- [x] `operatorStatus` esteso a readiness probe: `db, casinoOrigin, flexrix, sports, sso, governance, bridgeSecret, webhookSecret, treasury, vapid, google`.
- [x] Nuovo export `sportsConfigured()`; nuovi test `config.test.ts` + `vapid.test.ts` (17/17 verdi nel blocco toccato; typecheck + build verdi).
- [x] Pre-esistenti NON toccati e ancora rossi: 13 test `scripts/*.mjs` (PWA share-card, app-env) + 2 file test `src/` (app-data, gate-identity).

**Fase 1 — Lobby reale (P0)**
- [ ] Flexrix: chiavi → callback registrato → cert `test_player` → `GET /api/operator/games` verde.
- [ ] Sportsbook: secret+JWT → callback → sessione SSO → eventi reali (o switch UI tols/flexrix).
- [ ] SSO skin↔Next: segreto condiviso → launch autenticato E2E.

**Fase 2 — Soldi veri (P1)**
- [ ] Neon prod + migrate + verifica ledger sotto carico (idempotenza `findByNote` su `transaction_id`).
- [ ] Tower: secret+JWT → health verde → test wallet_adjust/player_block/bonus_credit.
- [ ] Treasury Solana reale + RPC dedicato.
- [ ] Cashier: Moonpay SDK o redirect Next + flusso withdrawal definito.

**Fase 3 — Operatività (P2)**
- [ ] VAPID prod + test push · Auth prod (Google/broker) + `whoami` · EuroVirtuals solo se confermato.
- [ ] Suite di smoke: `npm test` + `browser-smoke.mjs` su dev e su build (`preview:restart`), più probe esterne su `/api/platform/health`, `/api/bridge/health`, `/api/treasury`, `/api/operator/games`.

## 6. Rischi principali

1. **Doppio percorso Flexrix** (`flexrix` diretto vs `tols-next` via Next) con mapping valute diverso (`USD` vs `USDT`) → riconciliare prima della prod o i saldi divergeranno.
2. **Preview = PGLite effimero + `dev-user`**: qualunque test soldi/saldi in preview non è rappresentativo della prod.
3. **`EV_APP_KEY` e `SUPABASE_*` lette ma inutilizzate** → specifiche incomplete, non attivare in prod senza verifica.
4. **Callback aperti in GET** per health-check: ok, ma i POST devono restare firmati (Flexrix HMAC, Tower HMAC+timestamp, operator secret) — non abbassare mai a `*` senza firma.
5. **`/api/casino-deposits` retired (410)**: qualsiasi client vecchio che lo chiama va migrato su `/deposit` di Next.
