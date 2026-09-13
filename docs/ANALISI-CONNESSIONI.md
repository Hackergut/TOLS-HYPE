# TOLS-HYPE — Analisi progetto e connessioni da integrare

> **Revisione verificata**: 2026-09-13 · Branch: `arena/01a09894-tols-hype` · HEAD: `a352d0b`
> Stack: TanStack Start + React 19 + Vite 8 + Tailwind v4 · Better Auth · Prisma 7 + Postgres (Neon) / PGLite fallback · Nitro su Vercel
> Ogni affermazione di questa revisione è stata ricontrollata sul codice a HEAD e, dove possibile, misurata a runtime (§7).

## 0. Correzioni rispetto alla revisione precedente

La versione precedente di questo documento (branch `arena/01a09817-tols-hype`) conteneva affermazioni non più vere. Sono state corrette qui, con la verifica puntuale:

| #   | Affermazione precedente                                                              | Realtà a HEAD (verificata)                                                                                                                                                                                                       |
| --- | ------------------------------------------------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | "Platform JWT verificato con `jose`" (§3.4)                                          | **Falso.** `src/lib/governance/platform-jwt.ts:1,56-57` usa `node:crypto` (`createPublicKey` + `createVerify("RSA-SHA256")`). `jose` è importato solo da `src/lib/auth/gate-identity.server.ts:6` e dal suo test.                |
| 2   | "`payment.ts` ha default diverso `tols-plum.vercel.app` — uniformare" (§3.3 da-fare) | **Già risolto.** `src/lib/operator/payment.ts:9` delega a `operatorServer().casinoOrigin`; il commento nel file vieta esplicitamente di riforkare il default. L'item era in contraddizione con la Fase 0 dello stesso documento. |
| 3   | "email/password **disabilitata** di default" (§3.7)                                  | **Falso.** `src/lib/auth/email-password.ts:10` → `export const emailAndPasswordEnabled = true`. Il login email/password **è attivo** e scrive nel DB Better Auth locale.                                                         |
| 4   | Header "Commit base: `4a97948`"                                                      | Quell'oggetto **non esiste in questo clone** (`git cat-file -t 4a97948` → fatal). Il repo ha un solo commit raggiungibile: `a352d0b` (merge della PR #1).                                                                        |
| 5   | "Test src 72/72", "test:unit 220 verdi"                                              | Misurato oggi: **76/76** src (18 suite) e **148/148** scripts → `test:unit` = **224 verdi**.                                                                                                                                     |
| 6   | "Serve UI switch `source==flexrix`" (§3.2)                                           | Vero ma incompleto: **nessun componente consuma `/api/sportsbook/events`**. L'UI sport importa `SPORT_EVENTS` staticamente da `src/lib/sports-book.ts:50`. L'endpoint è oggi solo una sonda.                                     |

---

## 1. Cos'è questo progetto

**TOLS-HYPE è una skin white-label del casinò TOLS** ("TOLS Originals" + lobby aggregata): frontend autonomo (`https://www.tols.fun`) con backend intercambiabile via env, senza riscrivere la UI.

Tre anime convivono nel repo:

| Anima                                                                                                                                                                  | Dove vive                                                                                                                                         | Stato                                                        |
| ---------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------ |
| **Originals giocabili in-app** (15 titoli: Crash, Roulette, Blackjack, Slots, Dice, Mines, Keno, Hi-Lo, Limbo, Plinko, Tower, Pool…) con RNG provably-fair HMAC-SHA256 | `src/lib/casino-api.ts`, `src/lib/fair*.ts`, `src/lib/rng.ts`, `src/components/games/*`, `src/routes/_shell/{originals,play.$slug,games.$id}.tsx` | ✅ Funzionante in locale (wallet play-money, DB PGLite)      |
| **Lobby remota via aggregatori** (slot/live di terze parti in iframe)                                                                                                  | `src/lib/operator/*` (9 adapter), `src/routes/api/operator/*`, `src/routes/api/flexrix/*`, `src/routes/api/sportsbook/*`                          | ⚠️ Codice pronto, bloccato su credenziali + rete outbound    |
| **Ponte di governance** verso `gov.tols.fun` (KYC, limiti, RTP, ledger Solana, bonus, support)                                                                         | `src/lib/governance/*`, `src/routes/api/bridge/*`, `src/routes/api/platform/*`, `src/routes/api/treasury.ts`                                      | ⚠️ Codice pronto, bloccato su segreto condiviso + chiave JWT |

Il resto (auth Better Auth, wallet SQL/Prisma, notifiche push, cashier, pagine legali/AML/responsible, VIP, promo, sport UI, token page) è l'infrastruttura da operatore reale.

## 2. Architettura in breve

```
Browser (React 19 + TanStack Router)
  ├─ Originals → serverFn casino-api.ts → wallet.server.ts (Prisma) → Postgres/PGLite
  │            └→ fair.server.ts (HMAC seeds) + pushSettledBet → gov.tols.fun
  ├─ Lobby remota → rpc.ts (listRemoteGames/launchRemoteGame) → registry.ts → 1 dei 9 adapter
  │            └→ iframe (aggregator-frame.tsx / flexrix-frame.tsx) con URL di launch firmata
  └─ Wallet seamless INBOUND ← vendor (Flexrix/Sportsbook/Softswiss/…) → /api/*/callback → debit/credit

Server (Nitro su Vercel, preset vercel — serverDir ./server)
  ├─ /api/operator/*      → catalogo + launch + wallet generico (adapter attivo) + status ops
  ├─ /api/flexrix/*       → wallet GIS (HMAC-SHA1) + launch-demo
  ├─ /api/sportsbook/*    → wallet sport (HMAC-SHA1) + sessione JWT HS256 + eventi
  ├─ /api/bridge/*        → webhook HMAC-SHA256 verso/da Governance Tower
  ├─ /api/platform/*      → health/whoami (JWT RS256 Tower → Casino)
  ├─ /api/treasury        → lettura Solana RPC + push solana_ledger al Tower
  └─ /api/auth/*          → Better Auth (broker Grok OAuth + Google OAuth diretto + email/password)
```

**DB**: `migrations/*.sql` applicate sia su Neon in build (`scripts/migrate.mjs`) sia su PGLite in dev/preview (`src/lib/db.ts`, non ricorsivo: `migrations/auth/` è opt-in). Tabelle reali verificate nei file:

- `0001_auth.sql` → `"user"`, `"session"`, `"account"`, `"verification"` (Better Auth)
- `0002_casino.sql` → `wallets`, `transactions`, `game_rounds`
- `0003_notifications.sql` → `notifications`, `push_subscriptions`, `notification_prefs`
- `0004_fair.sql` → `fair_seeds`
- `0005_bets.sql` → `bet_rounds`

Prisma (`prisma/schema.prisma`) copre **solo** `wallets` + `transactions`; tutto il resto passa da `getSql()` (Kysely/SQL grezzo).

## 3. Mappa delle connessioni (da integrare / verificare)

### 3.1 FLEXRIX HUB — Casinò (priorità P0) 🔴

- **Codice**: `operator/adapters/flexrix.ts`, `flexrix-sign.ts`, `flexrix-wallet.ts`, `routes/api/flexrix/callback.ts`, `routes/api/flexrix/launch-demo.ts`, `routes/api/operator/games.ts`
- **Protocollo**: REST `https://api.upaflex.online` + header `X-Merchant-Id / X-Timestamp / X-Nonce / X-Sign` (HMAC-SHA1 su query ordinate + URL-encoded). `flexrixVerify` tollera **due** hash string (URL-encoded e raw) — utile in certificazione, da fissare poi su una sola.
- **Wallet inbound GIS**: `balance/bet/win/refund/rollback` con idempotenza su `note` del ledger (`findByNote`) e seed automatico `test_player*` → 1000 USDT.
- **Env**: `FLEXRIX_API_BASE`, `FLEXRIX_MERCHANT_KEY` (formato `FXC_*`), `FLEXRIX_API_SECRET` (alias `FLEXRIX_CASINO_SECRET`)
- **Default attivo**: `AGGREGATOR_KIND=flexrix` è default sia client (`operator/config.ts:37`) sia server (`operator/env.server.ts:7`).
- **Quota lobby**: `lobby-quota.ts:16-17` — max 30 titoli illustrati/studio, cap 800, esclusi tavoli live turchi e studio Nolimit.
- **Demo senza chiavi**: `launch-demo` (balance 5000 USD fake) funziona anche non configurato.
- **Da fare**:
  1. Inserire merchant key + secret reali su Vercel (in sandbox `flexrixConfigured()==true` solo con secret usa-e-getta).
  2. Registrare presso Flexrix il callback `POST {CASINO_ORIGIN}/api/flexrix/callback` e superare la certificazione.
  3. Verificare mapping valute: `USDT/SOL → USD` in launch; il wallet GIS opera su `USDT`.
  4. Verificare `GET /api/operator/games` → `flexrix.configured=true, count>0, error=null` (oggi in sandbox: `error:"fetch failed"`, vedi §7).
  5. ⚠️ Confermare col vendor il contratto HTTP sugli errori: oggi una firma errata risponde **HTTP 200 + `INTERNAL_ERROR`** (`flexrix-wallet.ts:38`, `status = 200` di default), mentre lo sportsbook risponde **401** (§3.2). Due convenzioni diverse nella stessa integrazione.

### 3.2 FLEXRIX SPORTSBOOK (priorità P0) 🔴

- **Codice**: `operator/sportsbook.server.ts`, `routes/api/sportsbook/{callback,callback.$action,session,events}.ts`, `components/sports/flexrix-frame.tsx`
- **Protocollo**: iframe `https://sports.flexrix.com/en/sports?token=<JWT HS256>&lang=en&language=en` (SSO `sportsSsoToken`, exp 1h) + wallet HMAC-SHA1 sugli stessi header Flexrix.
- **Env**: `FLEXRIX_SPORTS_ORIGIN`, `FLEXRIX_SPORTS_SECRET` (fallback `FLEXRIX_API_SECRET`), `FLEXRIX_SPORTS_JWT_SECRET` (fallback secret sport)
- **Da fare**:
  1. Ottenere origin + secret sport reali da Flexrix.
  2. Registrare callback `POST {origin}/api/sportsbook/callback[/$action]`.
  3. ~~Eventi reali~~ → **risolto 2026-09-13**: la board arriva da The Odds API v4 (§3.14) e `/api/sportsbook/events` è ora consumato dalla UI (`useLiveEvents` su `/sports`, `/dashboard`, tab-bar mobile). Il probe Flexrix resta ma è opt-in (`?probe=flexrix`): costa una call a monte e non ha consumer.
  4. `flexrix-frame.tsx:4` parte con `src` hardcoded `https://sports.flexrix.com/en/sports` (ignora `FLEXRIX_SPORTS_ORIGIN`) e fa `.replace("/tr/","/en/")` sull'URL ricevuto: da allineare a `sportsbookOrigin()`.
  5. Test SSO: `GET /api/sportsbook/session` deve dare `url` con token del player reale (oggi `sub:"guest"` se non loggato — verificato, §7).

### 3.3 tols-casino-next — origine live / bridge SSO (priorità P0) 🟠

- **Codice**: `operator/adapters/tols-next.ts`, `operator/sso.ts`, `operator/payments.ts`, `operator/payment.ts`
- **Flussi**:
  - Lobby proxy: `GET {CASINO_ORIGIN}/api/games-lobby?featured=true` + `?category=live`
  - Launch: `POST /api/flexrix/launch` (autenticato) → fallback `GET /api/flexrix/launch-demo` → fallback `POST /api/vendor/launch`
  - Player SSO: `mintSkinSso` (HMAC-SHA256, `base64url(payload).sig`) → `POST /api/bridge/player-sso` (header `x-bridge-signature: sha256=…`) → fallback `GET /api/bridge/sso?token=` → cookie `tols_session`
  - Cashier reale: link `{CASINO_ORIGIN}/deposit` e `/account/wallet` (`publicCashierLinks`); `/api/casino-deposits` è dichiarato retired (410) **su Next** — in questo repo non esiste la route, c'è solo il commento in `payments.ts:3`
- **Env**: `CASINO_ORIGIN` / `APP_URL` / `CASINO_URL` (default `https://www.tols.fun`), `SKIN_SSO_SECRET` (alias `GOVERNANCE_BRIDGE_SECRET`, min 16 char)
- **Da fare**:
  1. Condividere `SKIN_SSO_SECRET` identico tra skin, Next e Tower.
  2. Test end-to-end: login skin → launch gioco Next → verifica `tols_session` valida.
  3. Decidere il percorso di produzione: `flexrix` diretto vs `tols-next` (sono alternativi via `AGGREGATOR_KIND`, ma entrambi finiscono su Flexrix con mapping valute diverso: `USD` in launch vs `USDT` nel wallet GIS).

### 3.4 GOVERNANCE TOWER — gov.tols.fun (priorità P1) 🟠

- **Codice**: `governance/bridge.ts`, `governance/webhook.server.ts`, `governance/platform-jwt.ts`, `governance/db-ping.server.ts`, `operator/adapters/governance.ts`, `operator/governance.ts`
- **Outbound** (casino → tower, HMAC-SHA256 `X-Bridge-Signature: sha256=…` + `X-Bridge-Timestamp`, skew 5'): `casino.bet/win/deposit_confirmed/withdrawal_*/session_*/health`, `solana_ledger`, `bridge.sync_request` → `POST /api/platform/webhooks` (fallback `/webhook`); health probe `GET /api/platform/health` → fallback `/api/health`.
- **Inbound** (tower → casino, `POST /api/bridge/webhook`): firma obbligatoria tranne `ping` (→ `pong`), timestamp obbligatorio, tipi noti in `KNOWN_INBOUND`.
  ⚠️ **Solo `governance.wallet_adjust` e `governance.bonus_credit` hanno effetto reale** (`webhook.server.ts:68-84`): gli altri tipi (`rtp_update`, `limits_update`, `feature_flag`, `session_invalidate`, `player_block`, `support_*`) rispondono `accepted:true` senza fare nulla. Manca il layer di persistenza (nessuna tabella `limits`/`rtp_overrides`).
- **Platform JWT** (tower → casino): `GET /api/platform/whoami` verifica Bearer **RS256 con `node:crypto`** (`platform-jwt.ts:1,56-57`) — non `jose`. `PLATFORM_JWT_PUBLIC_KEY` (PEM o base64 di PEM), issuer default `tols-governance`, audience default `tols-casino`. Chiave mancante → 503 con hint.
- **Env**: `GOVERNANCE_TOWER_URL` (alias `GOVERNANCE_URL`/`VITE_GOVERNANCE_URL`/`TOWER_URL`, default `https://gov.tols.fun`), `GOVERNANCE_BRIDGE_SECRET` (alias `GOVERNANCE_WEBHOOK_SECRET`/`GOVERNANCE_API_KEY`/`SKIN_SSO_SECRET`), `PLATFORM_JWT_PUBLIC_KEY[/ISSUER/AUDIENCE]`
- **Da fare**:
  1. Configurare secret ≥16ch + chiave pubblica JWT su entrambi i lati.
  2. Verificare `GET /api/platform/health` → `ok:true, db.ok, bridge.jwtConfigured:true` e `GET /api/bridge/health` → `link.status:"live"`.
  3. Implementare (o dichiarare out-of-scope) gli effetti inbound non monetari.

### 3.5 EUROVIRTUALS / BETKRAFT (priorità P2) 🟡

- **Codice**: `operator/adapters/eurovirtuals.ts`
- **Stato**: punta a staging `https://api.staging.betkraft.co.uk` (`EV_API_BASE`), `GET /games` con `Bearer EV_API_KEY`; il launch è delegato a `{CASINO_ORIGIN}/api/eurovirtuals/launch`, **endpoint che non esiste in questo repo** (deve vivere su Next o va creato).
- **Env**: `EV_API_BASE`, `EV_API_KEY`, `EV_APP_KEY` — quest'ultima è **letta e mai usata** (unica occorrenza: `operator/env.server.ts:35`).
- **Da fare**: ottenere credenziali prod, chiarire la spec wallet, implementare o puntare il launch endpoint reale.

### 3.6 Aggregatori generici — REST / Softswiss / Slotegrator / Legacy (priorità P2) 🟡

- **Codice**: `operator/adapters/{rest,softswiss,slotegrator,legacy}.ts`, `operator/http.ts`
- **Uso**: white-label verso altri operatori. `AGGREGATOR_KIND`, base `AGGREGATOR_URL`, chiave `AGGREGATOR_API_KEY`, id `AGGREGATOR_OPERATOR_ID`, firma inbound `OPERATOR_WEBHOOK_SECRET`/`VENDOR_CALLBACK_SECRET`, mappa giochi legacy `LEGACY_GAME_MAP` (JSON).
- **Nota**: `aggregatorFetch` cade su `AGGREGATOR_URL || GOVERNANCE_URL || SUPABASE_URL` — se non si imposta `AGGREGATOR_URL`, le chiamate finiscono sul Tower. Da rendere esplicito prima di attivare un vendor.
- **Da fare**: solo se serve un secondo fornitore — validare la spec per-vendor contro la documentazione reale.

### 3.7 Auth — Better Auth + broker Grok + Google + email/password (priorità P1) 🟠

- **Codice**: `lib/auth/*`, `routes/api/auth/*`, `routes/login.tsx`
- **Stato cruciale**: `.grok/app-env.json` ha `VITE_AUTH_ENABLED=false` → in preview gira l'utente fittizio `dev-user`; in produzione (Vercel, senza quella flag) il login è reale.
- **Provider attivi**: broker Grok OAuth (`grok-google`, `grok-x`) + Google OAuth diretto (`/api/auth/google*`) + **email/password ABILITATO** (`email-password.ts:10` → `true`, scrive nel DB Better Auth locale).
- **Sicurezza verificata**: `GET /api/auth/google/diag` → `{"googleEnabled":false,"bypassState":false}`; il callback rifiuta lo scambio code con state invalida (`google-handlers.server.ts:105-110`, redirect `?google=error&reason=bad_state`).
- **Isolamento multi-skin**: `isolation.server.ts` + `gate-identity.server.ts` (unico punto che usa `jose`).
- **Da fare**:
  1. Impostare `GOOGLE_CLIENT_ID/SECRET` su Vercel (oggi `googleEnabled:false`).
  2. Test login prod (non preview) + `GET /api/auth/me`.
  3. Decidere se email/password deve restare attivo in prod: è acceso di default **e la UI esiste già** (`routes/login.tsx:51-60,107-112` con `authClient.signUp.email` / `signIn.email`, più il form in `components/games/guest-game-preview.tsx:193-196`). Resta da verificare rate limiting/lockout e la policy di recupero password, che Better Auth non abilita di default.
  4. A `VITE_AUTH_ENABLED=true`, `authMiddleware` diventa obbligatorio ovunque: verificare che nessuna serverFn anonima si rompa (`npm run check:auth`).

### 3.8 Database — Neon Postgres vs PGLite (priorità P1) 🟠

- **Codice**: `lib/db.ts`, `lib/prisma.server.ts`, `prisma/schema.prisma`, `migrations/*.sql`, `scripts/migrate.mjs`
- **Comportamento**: `DATABASE_URL` presente e con user `postgres.<project-ref>` → Neon (`@prisma/adapter-pg`); altrimenti PGLite (dati persi al restart, `_migrations` tracciate). `prisma.server.ts` ha un doppio guard: user senza punto → warning + PGLite; auth fallita (28P01) → warning + PGLite.
- **Env**: `DATABASE_URL` (alias `PRISMA_DATABASE_URL`), `SUPABASE_URL` + `SUPABASE_SERVICE_ROLE_KEY`/`ANON_KEY` (**mai usate per query**: finiscono solo come header `apikey`/`authorization` in `aggregatorFetch`).
- **Da fare**:
  1. Provisionare Neon prod e impostare `DATABASE_URL` su Vercel (oggi sandbox = PGLite effimero, `db:"pglite"`).
  2. Verificare `_migrations` dopo il build (`npm run db:migrate` è già nello script `build`).
  3. Decidere: rimuovere l'opzione `supabase` o implementarla davvero.
  4. `STARTING_BALANCES` sono tutti **0** (`games-catalog.ts:14-19`): il faucet play-money è `cashier(deposit)` con cap 5000 USDT / 5 ETH / 0.5 BTC (`casino-api.ts:79`). Per prod reale serve deposito on-chain/fiat (§3.10).

### 3.9 Solana Treasury + Ledger (priorità P1) 🟠

- **Codice**: `lib/treasury.server.ts`, `governance/solana-ledger.ts`, `routes/api/treasury.ts`
- **Flusso**: `GET /api/treasury` → JSON-RPC `getBalance` su `SOL_RPC_URL` (default mainnet-beta pubblico) per `TREASURY_SOL_ADDRESS` → push `solana_ledger` al Tower (silenzioso se fallisce).
- **Env**: `TREASURY_SOL_ADDRESS` (+ alias `VITE_*`), `TREASURY_USDT_ADDRESS` (fallback = SOL address), `TREASURY_BTC/ETH_ADDRESS`, `SOL_RPC_URL`
- **Da fare**: impostare address reali (oggi `addresses:{}`, `ready:false`), usare RPC dedicato, verificare `ready:true` e arrivo evento al Tower.

### 3.10 Pagamenti / Buy-crypto (priorità P1) 🟠

- **Codice**: `operator/payments.ts`, `operator/payment.ts`, `components/wallet/*`
- **Stato**: cashier interno = play-money; buy-crypto widget = Moonpay di default ma **solo `provider` + `publishable key` letti da env, nessun SDK montato** (`payment.ts:buyCryptoWidget`); depositi reali delegati a `{CASINO_ORIGIN}/deposit`.
- **Env**: `BUY_PROVIDER`/`NEXT_PUBLIC_BUY_PROVIDER`, `BUY_API_KEY`/`NEXT_PUBLIC_BUY_API_KEY`
- **Da fare**: integrare SDK Moonpay (o provider scelto) nel cashier, oppure completare il redirect a Next; definire il flusso withdrawal reale (oggi solo ledger interno).

### 3.11 Push notifications (priorità P2) 🟡

- **Codice**: `lib/notifications/*`, `public/sw.js`, `migrations/0003_notifications.sql`
- **Trigger automatici verificati** in `wallet.server.ts:102-131`: vincite notevoli (`win` ≥ 25 USDT / 0.0005 BTC / 0.01 ETH) e ogni `deposit`.
- **Env**: `VAPID_PRIVATE_KEY` (obbligatoria per inviare; senza → skip silenzioso), `VAPID_PUBLIC_KEY`/`VITE_VAPID_PUBLIC_KEY` (fallback: chiave legacy in `vapid.ts:11`, **da considerare compromessa** perché la privata era in source), `VAPID_SUBJECT` (default `mailto:support@tols.fun`)
- **Da fare**: generare coppia VAPID prod, verificare `sw.js` registrato e permessi browser, test `sendPushToUser`.

### 3.12 Onchain EVM — viem/Base (priorità P3) 🟢

- **Codice**: `lib/onchain/*`, `components/ui/{chain-select,network-logo,asset-input}.tsx`
- **Stato**: UI chain-select (Ethereum/Base/Arbitrum/Optimism/Polygon) + `viem` read-only; gateway avatar IPFS/Arweave pubblici. Nessun contratto chiamato, nessuna firma tx.
- **Da fare**: solo se si vuole deposito/withdrawal on-chain diretto dalla skin.

### 3.13 App-data / Connector Gate (Grok) (priorità P3) 🟢

- **Codice**: `lib/app-data/*`
- **Stato**: infrastruttura per leggere dati viewer (calendar/mail/file) via gate quando l'app gira dentro Grok; irrilevante per il casinò prod.

### 3.14 THE ODDS API v4 — odds sportivi reali (priorità P0) 🟢 **INTEGRATO 2026-09-13**

- **Codice**: `sports/odds-api.ts` (mapping puro, testabile), `sports/odds-api.server.ts` (env + fetch + cache + quota), `sports/use-live-events.ts` (hook client), `routes/api/sportsbook/{events,sports,scores}.ts`
- **Host**: `https://api.the-odds-api.com` (`THE_ODDS_API_BASE`), percorsi sotto `/v4`. Spec V4 completa; i test usano i suoi esempi come fixture.
- **Flusso**: `GET /v4/sports/upcoming/odds?regions=&markets=&oddsFormat=decimal` → best price per outcome su tutti i bookmaker (le `*_lay` degli exchange sono ignorate) → `SportEvent` → merge col book curato (il feed vince, dedupe per fixture) → `GET /api/sportsbook/events` → `useLiveEvents()` → `/sports`, `/dashboard`, tab-bar mobile. Settlement: una gamba dal feed apre un ticket pending risolto dai referti `/scores` (`sports/settlement.ts`); il book curato resta RNG provably-fair e paga subito.
- **Endpoint vendor usati**: `/v4/sports` (gratis), `/v4/sports/{s}/odds` (`mercati × regioni`), `/v4/sports/{s}/scores` (1, o 2 con `daysFrom`). `/v4/sports/{s}/events` (gratis) non ancora usato.
- **Protezioni**: cache `globalThis` con TTL (default 5') + in-flight dedupe → **1 call per TTL indipendentemente dal traffico**; circuit breaker dopo un 429 (`THE_ODDS_API_COOLDOWN_MS`, default 60s) che serve l'ultima board buona; zero call senza chiave; quota esposta su `/api/operator/status`; chiave mai nelle risposte.
- **Env**: `THE_ODDS_API_KEY` (unica obbligatoria), `THE_ODDS_API_BASE`, `_SPORT` (`upcoming`), `_REGIONS` (`eu`), `_MARKETS` (`h2h`), `_TTL_MS` (300000), `_SPORTS_TTL_MS`, `_SCORES_TTL_MS`, `_COOLDOWN_MS` (60000), `_MAX_EVENTS` (40), `_SCORES` (`false`), `_ODDS_FORMAT` (`decimal`), `_TIMEOUT_MS` (10000)
- **Stato verificato**: senza chiave → `source:"tols"` (book curato, 14 eventi) e `/scores` 503 con messaggio esplicito; con chiave → `source:"odds-api"`, feed in testa, dedupe (`Arsenal vs Liverpool` compare una volta sola), quota passthrough. Harness: 38 check (§7).
- **Da fare**:
  1. Inserire `THE_ODDS_API_KEY` su Vercel e scegliere regioni/mercati in base al piano (budget crediti: `docs/RUNBOOK-ODDS-API.md` §2).
  2. Verificare in prod `/api/sportsbook/events` → `source:"odds-api"` e `/api/operator/status` → `oddsQuotaRemaining`.
  3. ~~Decidere la settlement reale~~ **fatto**: `POST /api/sportsbook/settle` risolve i ticket dai referti `/scores`, con claim idempotente prima dell'accredito (`docs/RUNBOOK-ODDS-API.md` §8). Resta da schedularlo (cron) in produzione.
  4. Allarme quota sotto il 10% del piano.

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
GOVERNANCE_TOWER_URL=https://gov.tols.fun  # alias GOVERNANCE_URL / TOWER_URL
GOVERNANCE_BRIDGE_SECRET=...        # alias GOVERNANCE_WEBHOOK_SECRET / GOVERNANCE_API_KEY
PLATFORM_JWT_PUBLIC_KEY=... PLATFORM_JWT_ISSUER=tols-governance PLATFORM_JWT_AUDIENCE=tols-casino

# The Odds API v4 (odds sportivi reali — solo la chiave è obbligatoria)
THE_ODDS_API_KEY=...
THE_ODDS_API_SPORT=upcoming   THE_ODDS_API_REGIONS=eu   THE_ODDS_API_MARKETS=h2h
THE_ODDS_API_TTL_MS=300000    THE_ODDS_API_MAX_EVENTS=40  THE_ODDS_API_SCORES=false
THE_ODDS_API_COOLDOWN_MS=60000  THE_ODDS_API_ODDS_FORMAT=decimal  THE_ODDS_API_BASE=

# EuroVirtuals
EV_API_BASE=https://api.staging.betkraft.co.uk  EV_API_KEY=...  EV_APP_KEY=  # ← letta, mai usata

# DB / Auth / Push / Chain
DATABASE_URL=postgresql://...       # alias PRISMA_DATABASE_URL
SUPABASE_URL=... SUPABASE_SERVICE_ROLE_KEY=...   # oggi non usate nelle query
GOOGLE_CLIENT_ID=... GOOGLE_CLIENT_SECRET=...
BETTER_AUTH_SECRET=... BETTER_AUTH_URL=... GROK_AUTH_CLIENT_ID/SECRET/ISSUER=...
VAPID_PUBLIC_KEY=... VAPID_PRIVATE_KEY=... VAPID_SUBJECT=mailto:...
SOL_RPC_URL=... TREASURY_SOL_ADDRESS=... TREASURY_USDT/BTC/ETH_ADDRESS=...
BUY_PROVIDER=moonpay BUY_API_KEY=...  # alias NEXT_PUBLIC_*

# White-label UI (VITE_*)
VITE_OPERATOR_NAME=TOLS VITE_OPERATOR_LEGAL= VITE_OPERATOR_LICENSE= VITE_OPERATOR_SUPPORT=
VITE_SKIN_*  (NAME/LOGO/WORDMARK/PRIMARY/LIME/BACKGROUND)
VITE_AUTH_ENABLED=false             # preview; in prod il deployer la mette true
```

## 5. Piano d'azione

**Fase 0 — Igiene ✅ (ereditata, riverificata a HEAD)**

- [x] `CASINO_ORIGIN` single source: `payment.ts:9` delega a `operatorServer()`.
- [x] Callback sportsbook dinamico: `session.ts` usa `operatorServer().casinoOrigin` (verificato: `https://www.tols.fun/api/sportsbook/callback`).
- [x] Label onesta backend `supabase` → "Supabase (REST fallback only)" + test (`config.test.ts`).
- [x] Percorso Flexrix documentato: `flexrix` diretto = prod, `tols-next` = fallback.

**Hardening ✅ (ereditato, riverificato)**

- [x] VAPID: privata solo da env, skip graceful; pubblica risolvibile con fallback legacy. ⚠️ vecchia coppia da ruotare (privata esposta in git history).
- [x] Idempotenza `seamlessWallet` su `txnId` (bet/win) — allineata a `flexrix-wallet.ts`.
- [x] `operatorStatus` = readiness probe booleano (`GET /api/operator/status`).
- [x] `sportsConfigured()` + callback sport che esige firma HMAC quando il secret c'è.
- [x] Login-CSRF Google chiuso (`bypassState:false`).
- [x] `with-app-env.mjs`: rimosso `shell:true` su POSIX.

**Nuovo in questa revisione — da fare (codice)**

- [ ] **Coerenza errori vendor**: scegliere una convenzione tra `HTTP 200 + error_code` (GIS casino) e `HTTP 401` (sportsbook) e applicarla a entrambi dopo conferma Flexrix.
- [ ] **`flexrix-frame.tsx`**: usare `sportsbookOrigin()` invece dell'URL hardcoded iniziale.
- [ ] **`isRemoteGamesEnabled()`** (`env.server.ts:40`): mai chiamata, e comunque sempre `true` perché `governanceUrl`/`casinoOrigin` hanno default non vuoti → rimuoverla o darle una condizione vera.
- [ ] **Webhook governance non monetari**: implementare effetti o rispondere `not_implemented` invece di `accepted:true`.
- [ ] **`EV_APP_KEY`**: usarlo (firma) o eliminarlo dall'inventario.
- [ ] **Email/password**: decisione esplicita (UI dedicata + rate limit, oppure `false`).

**Integrazione The Odds API v4 ✅ 2026-09-13** (branch `arena/01a09894-tols-hype`)

- [x] Connettore server con cache TTL + in-flight dedupe + circuit breaker 429 + contabilità quota.
- [x] Mapping puro e testato (29 test): best price, moneyline 2/3 vie, spread, totals, in-play, formati american/decimal, costo quota, sanitizzazione parametri.
- [x] Rotte: `/api/sportsbook/events` (board reale + fallback), `/api/sportsbook/sports` (gratis), `/api/sportsbook/scores` (punteggi, `sport` obbligatorio).
- [x] UI collegata: `useLiveEvents()` su `/sports`, `/dashboard` e tab-bar mobile; il book curato resta il pavimento.
- [x] Settlement: `placeSportBet` apre ticket **pending** sulle gambe del feed (stake addebitato, pagamento al fischio finale); le gambe curate restano RNG istantaneo; ticket misto rifiutato.
- [x] Settlement reale: `sport_bets` (migration `0006`), motore puro `sports/settlement.ts` (16 test: ml/spread/totals/btts/dc, void, push, ricalcolo multipliche), `settleSportBets` con claim condizionale prima del `credit`, rotta `POST /api/sportsbook/settle` protetta da `OPERATOR_WEBHOOK_SECRET`, backlog su `GET`.
- [x] Readiness: `odds`, `oddsQuotaRemaining`, `oddsCostPerRefresh` su `/api/operator/status`.
- [x] Harness `npm run test:odds` (67 check contro un finto vendor, ciclo settlement incluso) + wiring CI.
- [x] Runbook `docs/RUNBOOK-ODDS-API.md` (config, budget crediti, verifica, troubleshooting).

**Fase 1 — Lobby reale (P0)**

- [ ] Flexrix: chiavi → callback registrato → cert `test_player` → `GET /api/operator/games` verde.
- [ ] Sportsbook Flexrix: secret+JWT → callback → sessione SSO. (Eventi reali già coperti da The Odds API, §3.14.)
- [ ] SSO skin↔Next: segreto condiviso → launch autenticato E2E.

**Fase 2 — Soldi veri (P1)**

- [ ] Neon prod + migrate + verifica ledger sotto carico (idempotenza `findByNote` su `transaction_id`).
- [ ] Tower: secret+JWT → health verde → test `wallet_adjust`/`bonus_credit` (gli altri tipi oggi no-op).
- [ ] Treasury Solana reale + RPC dedicato.
- [ ] Cashier: Moonpay SDK o redirect Next + flusso withdrawal definito.

**Fase 3 — Operatività (P2)**

- [ ] VAPID prod + test push · Auth prod (Google/broker) + `whoami` · EuroVirtuals solo se confermato.
- [ ] Smoke su dev e su build (`npm test`, `npm run test:integration`, `browser-smoke.mjs`) + probe `/api/platform/health`, `/api/bridge/health`, `/api/treasury`, `/api/operator/{status,games}`.

**Blocco noto (non risolvibile in sandbox)**

- ⏳ Il sandbox **non ha rete outbound**: `curl` verso `api.upaflex.online`, `www.google.com` e `gov.tols.fun/api/platform/health` restituisce tutti codice `000` (TLS fallito, exit 35). Lista giochi/launch/Tower reali sono verificabili **solo da Vercel**. Nessuna doc pubblica Flexrix (API B2B privata): lo schema HMAC va confermato col primo 200 reale o con l'account manager.

## 6. Rischi principali

1. **Doppio percorso Flexrix** (`flexrix` diretto vs `tols-next` via Next) con mapping valute diverso (`USD` vs `USDT`) → riconciliare prima della prod o i saldi divergeranno.
2. **Preview = PGLite effimero + `dev-user`**: qualunque test soldi/saldi in preview non è rappresentativo della prod.
3. **Webhook governance parzialmente finti**: 7 tipi su 9 rispondono `accepted:true` senza effetto → il Tower può credere di aver applicato limiti/blocchi.
4. **`EV_APP_KEY` e `SUPABASE_*` lette ma inutilizzate** → specifiche incomplete, non attivare in prod senza verifica.
5. **Convenzioni HTTP divergenti sugli errori vendor** (200+error_code vs 401) → un vendor che ritenta su 4xx/5xx può comportarsi diversamente tra casino e sport.
6. **Callback aperti in GET** per health-check: ok, ma i POST devono restare firmati (Flexrix HMAC, Tower HMAC+timestamp, operator secret) — mai abbassare a `*` senza firma.
7. **Chiave VAPID legacy in source** (pubblica) con privata storicamente esposta → rotazione obbligatoria prima del go-live.
8. **Quota The Odds API**: il costo è `mercati × regioni` per refresh. Alzare `THE_ODDS_API_MARKETS`/`_REGIONS` o abbassare `_TTL_MS` moltiplica la spesa: con i default (1 credito / 5') il tetto è 12 crediti/ora, con 3 mercati × 3 regioni e TTL 30s sarebbero 1080/ora. Monitorare `oddsQuotaRemaining`.
9. ~~**Quote reali + esiti simulati**~~ **risolto**: le scommesse sul feed reale pagano solo dal punteggio finale del vendor (`/scores`), con claim idempotente che impedisce il doppio accredito. Il RNG provably-fair resta soltanto sul book curato, che non espone quote di bookmaker. **Resta aperto**: `settleSportBets` va schedulato (cron/operatore) — senza uno scheduler i ticket restano pending anche a partita finita, e un `credit` fallito finisce in `summary.errors` e va gestito a mano (nessun retry automatico, per non rischiare doppi accrediti).

## 7. Verifiche misurate oggi (2026-09-13, HEAD `a352d0b`)

### 7.1 Check del progetto

| Comando                                                             | Esito                                                                         |
| ------------------------------------------------------------------- | ----------------------------------------------------------------------------- |
| `npm run typecheck` (`tsc --noEmit`)                                | exit 0, nessun errore                                                         |
| `npm run test:unit`                                                 | **253 pass / 0 fail** (148 scripts + 105 src, di cui 29 sul mapping Odds API) |
| `npm run test:odds` (fake The Odds API v4)                          | **38 check, tutti verdi**                                                     |
| `node --test scripts/grok-pwa-plugin.test.mjs`                      | 47 test, **39 pass / 8 fail** (drift branding piattaforma, noto e deliberato) |
| `npm run test:integration` contro dev server con secret usa-e-getta | **`selftest: 47 passed, 0 failed`**                                           |
| `npm run build`                                                     | exit 0 (vite build + db:migrate + ensure-vercel-output)                       |

Il self-test copre via HTTP: GIS Flexrix (balance/bet/win/refund/rollback, idempotenza replay, `INSUFFICIENT_FUNDS`, seed `test_player`→1000, firma errata), sportsbook (balance/credit/debit, firma errata → 401, firma mancante → 401), bridge Tower (ping→pong, `bonus_credit` firmato, firma errata → 401, timestamp stale → 401, tipo sconosciuto → 400), operator generico (wallet/launch/callback con e senza secret, JSON invalido → 400, garbage → fail-closed), superficie `/api/auth/*`, probe ops.

### 7.2 Stato reale delle connessioni (dev server su `0.0.0.0:8080`, secret usa-e-getta)

```
GET /api/health
  {"ok":true,"casino":"https://www.tols.fun","governance":"https://gov.tols.fun","db":{"ok":true,"latencyMs":2}}

GET /api/operator/status
  aggregator:"flexrix"  db:"pglite"  flexrix:true  sports:true  sso:true
  governance:false  bridgeSecret:true  webhookSecret:true
  treasury:false  vapid:false  google:false  payments:"local-wallet"  supabase:false

GET /api/operator/games
  originals:15  remote:0
  flexrix:{"configured":true,"count":0,"error":"fetch failed","merchantSet":true,"merchantFxc":true,"merchantLen":23}

GET /api/sportsbook/session
  url: https://sports.flexrix.com/en/sports?token=<HS256 sub:"guest" exp:1h>&lang=en&language=en
  callback: https://www.tols.fun/api/sportsbook/callback

GET /api/sportsbook/events
  {"source":"tols","error":"fetch failed","events":[…mock…]}

GET /api/treasury
  {"ok":true,"chain":"solana","addresses":{},"sol":null,"ready":false}

GET /api/bridge/health
  tower.reachable:false ("fetch failed")  link.status:"offline"
  secretReady:true  jwtReady:false  db.ok:true
  envPresent:{GOVERNANCE_TOWER_URL:false,APP_URL:false,GOVERNANCE_BRIDGE_SECRET:true,PLATFORM_JWT_PUBLIC_KEY:false}

GET /api/auth/google/diag
  {"ok":true,"v":"g3","googleEnabled":false,"bypassState":false,"dest":"/"}
```

### 7.3 Comportamenti HTTP sugli errori di firma (misurati)

| Endpoint                                                  | Firma errata                                                         |
| --------------------------------------------------------- | -------------------------------------------------------------------- |
| `POST /api/flexrix/callback`                              | **HTTP 200** `{"error_code":"INTERNAL_ERROR"}`                       |
| `POST /api/sportsbook/callback`                           | **HTTP 401** `{"error_code":"INTERNAL_ERROR"}`                       |
| `POST /api/bridge/webhook` (tipo non-`ping`, non firmato) | **HTTP 401** `{"success":false,"error":"Invalid bridge signature…"}` |

### 7.4 The Odds API v4 — evidenze (harness `npm run test:odds`, 38 check)

Dev server con `THE_ODDS_API_BASE` puntato a un finto `api.the-odds-api.com` in
`127.0.0.1:8099`; ogni asserzione passa dalle rotte reali, non da una
reimplementazione.

```
Sportsboard feed (/api/sportsbook/events)
  ok - source is the live feed              ok - best moneyline, home first ([1.36,3.4])
  ok - spread mapped from points            ok - totals mapped
  ok - three-way moneyline [home,draw,away] ([2.2,3.4,1.75])
  ok - in-play detected + elapsed minute    ok - curated book still merged underneath
  ok - live feed listed ahead of curated
Quota accounting
  ok - quota passthrough                    ok - remaining credits surfaced
  ok - cost per refresh = markets x regions (3)
Caching
  ok - 3 extra page loads cost 0 extra vendor calls
Sport list / Scores
  ok - bucket per sport_key                 ok - unmapped sport has no bucket
  ok - missing sport is 400                 ok - malformed sport is 400
  ok - scores keyed home/away regardless of payload order
  ok - no key is leaked in the response
Upstream failures
  ok - vendor 500 degrades to empty list    ok - vendor 429 degrades to empty list
  ok - rate limit arms the circuit breaker  ok - board still renders during cooldown
  ok - no vendor call during cooldown
Ops probe
  ok - odds connector reported              ok - status never contains the key
Vendor contract
  ok - regions / markets / oddsFormat=decimal come da specifica
```

Stato **senza chiave** (dev server privo di `THE_ODDS_API_KEY`), misurato:

```
GET /api/sportsbook/events
  source:"tols"  count:14  error:null  oddsApi.configured:false  costPerRefresh:1
GET /api/sportsbook/scores?sport=basketball_nba
  HTTP 503  {"ok":false,"error":"THE_ODDS_API_KEY not set","scores":[]}
GET /api/operator/status
  {"odds":false,"oddsQuotaRemaining":null,"oddsCostPerRefresh":1}
```

Stato **con chiave** (verso il fake), misurato:

```
GET /api/sportsbook/events
  source:"odds-api"  count:15  error:null
  primi 4: Arsenal vs Liverpool (live) · Tampa Bay Buccaneers vs Dallas Cowboys
           · AC Milan vs Sporting CP (curato) · Manchester City vs Chelsea (curato)
  → il dedupe per fixture funziona: "Arsenal vs Liverpool" del book curato non duplica
```
