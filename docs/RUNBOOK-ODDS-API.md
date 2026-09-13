# RUNBOOK — Attivazione The Odds API v4 (odds sportivi reali)

> Il connettore sostituisce il listato fittizio `SPORT_EVENTS` con quote reali
> di bookmaker. Senza chiave l'app continua a funzionare sul book curato:
> nessun deploy può rompersi per mancanza di credenziali.
>
> Verificato localmente con `npm run test:odds` (38 check contro un finto
> `api.the-odds-api.com`) e `src/lib/sports/odds-api.test.ts` (29 test sul
> mapping reale).

## 0. Cosa serve

Da The Odds API (piano a pagamento consigliato — vedi §2):

- `THE_ODDS_API_KEY` — la chiave ricevuta via email

Niente callback, niente whitelisting IP: è una API di sola lettura.

## 1. Configurazione

Su Vercel (Production). **Solo la chiave è obbligatoria**, il resto ha default
sicuri:

```
THE_ODDS_API_KEY=...                      # obbligatorio
THE_ODDS_API_SPORT=upcoming               # default: un solo call per tutta la board
THE_ODDS_API_REGIONS=eu                   # default eu; us,us2,uk,au,eu
THE_ODDS_API_MARKETS=h2h                  # default h2h; h2h,spreads,totals,outrights
THE_ODDS_API_TTL_MS=300000                # cache server: 5 minuti
THE_ODDS_API_MAX_EVENTS=40                # quante fixture mostrare
THE_ODDS_API_SCORES=false                 # true = overlay punteggi live (+1 credito/sport)
THE_ODDS_API_ODDS_FORMAT=decimal          # decimal | american
THE_ODDS_API_COOLDOWN_MS=60000            # pausa dopo un 429
```

Redeploy, poi verifica la readiness:

```bash
curl -s https://www.tols.fun/api/operator/status | python3 -c "
import json,sys; d=json.load(sys.stdin)
print('odds:', d['odds'], '| crediti residui:', d['oddsQuotaRemaining'],
      '| costo/refresh:', d['oddsCostPerRefresh'])"
# atteso: odds: True | costo/refresh: 1 (con i default)
```

## 2. Budget crediti (leggere prima di alzare i default)

Il vendor fattura `mercati × regioni` per ogni call `/odds`. Con i default
(`upcoming` + `h2h` + 1 regione) **un refresh costa 1 credito**, e la cache da
5 minuti limita il consumo a **12 crediti/ora al massimo**, indipendentemente
dal traffico: la cache è su `globalThis` con in-flight dedupe, quindi mille
visitatori nello stesso minuto pagano una sola call.

| Configurazione                             | Costo/refresh | Max/ora | Piano minimo sensato                  |
| ------------------------------------------ | ------------- | ------- | ------------------------------------- |
| `upcoming` + `h2h` + `eu` (default)        | 1             | 12      | free (500/mese) solo con TTL più alto |
| `upcoming` + `h2h,spreads,totals` + `eu`   | 3             | 36      | paid                                  |
| 4 sport specifici + 3 mercati + `us,uk,eu` | 36            | 432     | paid alto                             |

Regole operative:

- `/v4/sports` e `/v4/sports/{s}/events` **non consumano crediti**: usarli per
  esplorare (`GET /api/sportsbook/sports`).
- Una risposta vuota **non viene fatturata**.
- Ogni risposta espone `x-requests-remaining`: il connettore lo pubblica su
  `/api/operator/status` come `oddsQuotaRemaining`. Mettere un alert sotto il
  10% del piano.
- Dopo un `429` il connettore si ferma per `THE_ODDS_API_COOLDOWN_MS` e serve
  l'ultima board buona (`error: "rate_limited_cooldown"`), invece di insistere.

## 3. Verifica della board

```bash
curl -s https://www.tols.fun/api/sportsbook/events | python3 -c "
import json,sys; d=json.load(sys.stdin)
print('source:', d['source'], '| eventi:', d['count'], '| errore:', d['error'])
print('quota:', d['oddsApi'])
for e in d['events'][:5]:
    print(' ', e['league'], '|', e['home'], 'vs', e['away'], '|', e['markets']['ml'],
          '| live' if e.get('live') else '')"
# atteso: source: odds-api, error: None, quote decimali > 1
```

Cosa significa ogni campo:

| Campo    | Valore                                   | Significato                                               |
| -------- | ---------------------------------------- | --------------------------------------------------------- |
| `source` | `odds-api`                               | feed reale attivo                                         |
| `source` | `tols`                                   | chiave assente **o** vendor irraggiungibile → book curato |
| `error`  | `null`                                   | tutto ok                                                  |
| `error`  | `odds_api_401`                           | chiave sbagliata/scaduta                                  |
| `error`  | `odds_api_429` / `rate_limited_cooldown` | quota o burst: aspettare                                  |
| `error`  | `unreachable`                            | DNS/TLS/timeout verso il vendor                           |

## 4. Punteggi live (opzionale)

`THE_ODDS_API_SCORES=true` aggiunge i punteggi alle fixture in corso. Costa
**1 credito per sport chiave** (max 4 sport per refresh, cache 60s), quindi
valutare prima di attivarlo.

Endpoint dedicato, per diagnostica e per la futura settlement reale:

```bash
curl -s "https://www.tols.fun/api/sportsbook/scores?sport=basketball_nba&daysFrom=1"
```

`sport` è obbligatorio (400 altrimenti): la rotta non fa mai fan-out autonomo
sulla board, perché ogni chiave costa crediti.

## 5. Come arrivano le quote in UI

```
The Odds API  ──GET /v4/sports/upcoming/odds──▶  odds-api.server.ts (cache 5')
                                                     │  best price per outcome
                                                     ▼
                       src/lib/sports/odds-api.ts  (mapping → SportEvent)
                                                     │  merge col book curato
                                                     ▼
                       GET /api/sportsbook/events  { source, events, oddsApi }
                                                     │
                       useLiveEvents()  ──▶  /sports, /dashboard, tab-bar mobile
                                                     │
                       placeSportBet  ──▶  resolveOutcome ?? resolveApiOutcome
```

Punti che contano in produzione:

- **Best price**: per ogni outcome viene presa la quota **più alta** tra tutti i
  bookmaker della risposta (le quote `*_lay` degli exchange sono ignorate: non
  è un mercato che la UI vende).
- **Ordine**: moneyline sempre `[home, draw?, away]`; il pareggio c'è solo se il
  vendor lo quota (soccer sì, NFL no).
- **Eventi non renderizzabili vengono scartati**, non mostrati mezzi rotti:
  senza moneyline, senza id, con `home == away`, sport non mappato o mercato
  `outrights` → la fixture non entra in board.
- **Settlement**: una scommessa su un evento del feed reale viene risolta dal
  feed (`resolveApiOutcome`); se l'evento non è né nel book curato né nella
  cache del feed resta `Market closed`. Mai una quota inventata.

## 6. Troubleshooting

| Sintomo                             | Causa probabile                                  | Azione                                                                |
| ----------------------------------- | ------------------------------------------------ | --------------------------------------------------------------------- |
| `source: "tols"` con `odds: false`  | chiave non impostata                             | verificare `THE_ODDS_API_KEY` su Vercel e redeployare                 |
| `source: "tols"` con `odds: true`   | vendor irraggiungibile o board vuota             | leggere `error` e `oddsApi.lastError` su `/api/operator/status`       |
| `odds_api_401`                      | chiave errata, scaduta o piano esaurito          | controllare il piano; la chiave non è mai loggata                     |
| Board ferma ma `fetchedAt` vecchio  | cooldown dopo 429                                | aspettare `THE_ODDS_API_COOLDOWN_MS`; alzare il TTL se succede spesso |
| Nessuna quota spread/totals         | mercati non disponibili per quello sport/regione | il vendor li copre soprattutto su sport US e regioni `us`/`us2`       |
| Costo crediti più alto del previsto | regioni/mercati moltiplicati                     | `cost = mercati × regioni`; verificare `oddsCostPerRefresh`           |

## 7. Test di regressione

```bash
npm run test:unit      # include src/lib/sports/odds-api.test.ts (29 test)
npm run test:odds      # 38 check end-to-end contro un finto vendor
```

`test:odds` richiede un dev server avviato con il connettore puntato al fake:

```bash
THE_ODDS_API_KEY=selftest_odds_key \
THE_ODDS_API_BASE=http://127.0.0.1:8099 \
THE_ODDS_API_SPORT=upcoming THE_ODDS_API_REGIONS=us \
THE_ODDS_API_MARKETS=h2h,spreads,totals THE_ODDS_API_SCORES=true \
npm run dev

THE_ODDS_API_KEY=selftest_odds_key BASE_URL=http://127.0.0.1:8080 npm run test:odds
```

Cosa copre: mapping (best price, moneyline 2/3 vie, spread, totals, in-play),
passthrough quota, cache (3 page load = 0 call extra), rotta sports, rotta
scores + validazione 400, errori vendor (500/429), circuit breaker, assenza di
leak della chiave nelle risposte, e il contratto query visto dal vendor.
