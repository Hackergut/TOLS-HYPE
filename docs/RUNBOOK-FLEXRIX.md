# RUNBOOK — Attivazione Flexrix (casino + sportsbook)

> Pre-requisito: Grado 2 completato (`npm run test:integration` 47/47 con secret usa-e-getta).
> Questo runbook copre il passaggio da chiavi fake a chiavi reali.

## 0. Cosa dare a Flexrix / cosa farti dare

**Da Flexrix (account manager):**
- `FLEXRIX_MERCHANT_KEY` (formato `FXC_…`)
- `FLEXRIX_API_SECRET` (HMAC-SHA1 casino)
- `FLEXRIX_SPORTS_SECRET` + `FLEXRIX_SPORTS_JWT_SECRET` (se separati; altrimenti riusa l'API secret)
- `FLEXRIX_SPORTS_ORIGIN` (default nel codice: `https://sports.flexrix.com`)
- Conferma del formato wallet GIS: action `balance|bet|win|refund|rollback`, header `X-Merchant-Id/X-Timestamp/X-Nonce/X-Sign`

**A Flexrix (nostri endpoint — sostituisci l'origin se non è prod):**
- Wallet casino: `POST https://www.tols.fun/api/flexrix/callback`
- Wallet sport: `POST https://www.tols.fun/api/sportsbook/callback`
- Return URL player: `https://www.tols.fun/` (passata a ogni launch)

## 1. Configurazione

Imposta su Vercel (Production) — mai nel repo:

```
FLEXRIX_MERCHANT_KEY=FXC_...
FLEXRIX_API_SECRET=...
FLEXRIX_SPORTS_SECRET=...        # o riusa FLEXRIX_API_SECRET
FLEXRIX_SPORTS_JWT_SECRET=...    # o riusa FLEXRIX_SPORTS_SECRET
AGGREGATOR_KIND=flexrix          # default già flexrix, esplicito è meglio
CASINO_ORIGIN=https://www.tols.fun
OPERATOR_WEBHOOK_SECRET=...      # secret generico /api/operator/* (generane uno)
```

Redeploy, poi verifica la readiness (tutto booleano, niente secret in chiaro):

```bash
curl -s https://www.tols.fun/api/operator/status | python3 -m json.tool
# atteso: flexrix:true sports:true db:"neon" webhookSecret:true
```

## 2. Lobby reale

```bash
curl -s https://www.tols.fun/api/operator/games | python3 -c "
import json,sys; d=json.load(sys.stdin)
print('remote:', len(d['remote']), 'flexrix:', d['flexrix'])"
# atteso: flexrix.configured:true count:>0 error:null
```

Note lobby: max 30 titoli illustrati/studio, cap 800 (`lobby-quota.ts`),
esclusi tavoli live turchi e studio Nolimit. Se `count:0` con `error:null`
controlla le chiavi; se `error:"Flexrix 401"` la firma è rifiutata (chiavi
sbagliate o clock skew > 5 minuti).

## 3. Demo in browser (senza soldi)

Apri un gioco qualsiasi dalla lobby non loggato: con chiavi assenti/errate il
launch cade su `/v1/native/{slug}/launch-demo` (balance 5000 USD fake).
Se la demo non carica, il problema è di rete verso `api.upaflex.online`,
non del wallet.

## 4. Certificazione (test_player)

Flexrix chiamerà il callback con player `test_player:*`. Il codice li
auto-seeda a **1000 USDT** alla prima chiamata (`flexrix-wallet.ts`).
Procedura:

1. Avvisa Flexrix che `POST /api/flexrix/callback` è pronto.
2. Loro eseguono: `balance` → `bet` → `win` → `refund` → `rollback`.
3. Verifica nei log Vercel: nessun `BAD_SIGNATURE` (controlla NTP/skew),
   nessun `UNKNOWN_PLAYER` (il seed crea i wallet da solo).
4. Replay dello stesso `transaction_id` deve ritornare lo stesso saldo
   senza doppio movimento (idempotenza — coperta dal self-test).

Errori che vedranno loro (GIS): `INSUFFICIENT_FUNDS`, `UNKNOWN_PLAYER`,
`INTERNAL_ERROR` (firme errate, timestamp stale, payload maleformati).

## 5. Sport

1. `GET /api/sportsbook/session` loggato deve dare `url` con `?token=`
   (JWT HS256, exp 1h). Senza secret dà l'URL base senza token.
2. L'iframe punta a `{FLEXRIX_SPORTS_ORIGIN}/en/sports` (solo `/en/`,
   mai `/tr/` — il frontend normalizza).
3. Il wallet sport opera in **USDT** ma risponde `currency:"USD"`:
   1 USDT = 1 USD. Riconcilia su questa base.

## 6. Go-live checklist

- [ ] `/api/operator/status`: `flexrix:true sports:true db:neon`
- [ ] `/api/operator/games`: `count>0 error:null`
- [ ] Launch reale loggato: URL Flexrix (non demo), bet visibile nel ledger
- [ ] Cert `test_player` superata lato Flexrix
- [ ] Orologio server ok (firme HMAC tollerano ±5 min)
- [ ] `OPERATOR_WEBHOOK_SECRET` impostato (chiude `/api/operator/*` a 401 senza header)

## 7. Rollback

Lobby remota rotta? Torna agli Originals senza deploy di codice:

```
AGGREGATOR_KIND=local
```

oppure via Next (fallback documentato): `AGGREGATOR_KIND=tols-next`
+ `SKIN_SSO_SECRET` condiviso (vedi ANALISI §3.3).

## 8. Troubleshooting rapido

| Sintomo | Causa probabile | Fix |
|---|---|---|
| `flexrix.error: "Flexrix 401"` | chiavi errate | ricontrolla merchant/secret su Vercel |
| `BAD_SIGNATURE` nei log | clock skew > 5' o secret diverso | NTP + riallinea secret con Flexrix |
| `INSUFFICIENT_FUNDS` a sproposito | mapping USDT→USD | il launch converte USDT/SOL→USD; il wallet GIS è in USDT |
| `count:0 error:null` | chiavi assenti | `flexrix.configured:false` → env mancanti |
| Lobby con buchi | quota 30/studio, no-cover scartate | atteso (`lobby-quota.ts`) |
| Bet doppi | retry vendor | idempotenza su `transaction_id` — se accade, bug: apri issue con `txnId` |

Self-test pre-certificazione (locale, chiavi usa-e-getta):

```bash
FLEXRIX_MERCHANT_KEY=FXC_selftest_local_only \
FLEXRIX_API_SECRET=selftest-flexrix-secret-01 \
FLEXRIX_SPORTS_SECRET=selftest-sports-secret-02 \
GOVERNANCE_BRIDGE_SECRET=selftest-bridge-secret-03 \
OPERATOR_WEBHOOK_SECRET=selftest-webhook-secret-04 \
npm run dev &

BASE_URL=http://127.0.0.1:8080 npm run test:integration
# atteso: 47 passed, 0 failed
```
