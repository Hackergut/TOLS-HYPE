# TOLS-HYPE (tols.fun) — Analysis & Debug Report

> Date: 2026-09-14 · Branch: `main` · Base commit: `d1024cf` ("fix(bridge): also read Tower public key from /api/platform/health")

## 1. What the project is

TOLS-HYPE is the white-label casino hub that serves **www.tols.fun**: TanStack Start
(React 19, Vite 8, Nitro on Vercel) + Tailwind v4 + Better Auth + Prisma/Postgres
(Neon) with a PGLite fallback for preview. It has three functional layers:

| Layer | Where | State on `main` |
|---|---|---|
| In-app **Originals** (Crash, Roulette, Blackjack, Slots, Dice, Mines, Keno, Hi-Lo, Limbo, Plinko, Tower, Pool) with provably-fair RNG | `src/lib/casino-api.ts`, `src/lib/fair*`, `src/components/games/*` | Working (play-money wallet) |
| **Remote lobby** via aggregators (Flexrix default, 9 adapters) | `src/lib/operator/*`, `src/routes/api/operator|flexrix|sportsbook/*` | Code ready, waiting for real keys/callback registration |
| **Governance bridge** to `gov.tols.fun` (HMAC-SHA256 + RS256 platform JWT) | `src/lib/governance/*`, `src/routes/api/bridge|platform/*` | Code ready, last 4 commits on `main` are bridge fixes |

Full connection map and env inventory: `docs/ANALISI-CONNESSIONI.md`.

## 2. Verification results (before fixes)

| Gate | Result |
|---|---|
| `npm ci` (822 pkgs) | ✅ (needs workspace-local npm cache in this sandbox; global cache EPERM) |
| `npm run typecheck` | ✅ green on unmodified `main` |
| src unit tests (`node --test`, 12 files) | ✅ **83/83** on unmodified `main` |
| script tests (148, excluding the 8 deliberately-red `grok-pwa-plugin`) | ⚠️ 132/148 — all **16 failures are sandbox artifacts**: those CLI-wrapper tests spawn child processes and this Windows sandbox denies `child_process.spawn` (`EPERM`, syscall `spawn`). Same tests pass in the repo's CI (`.github/workflows/ci.yml`, ubuntu-latest). |
| `npm run build` | ✅ green (requires an environment allowing Vite's Windows `net use` spawn during config load) |
| `npm run test:integration` (fake-vendor harness vs dev server) | ✅ **47/47** |

## 3. Bugs found and fixed (all on `main`, verified after each fix)

### 🔴 3.1 Dice payout exploit — EV > 100% (`src/lib/casino-api.ts`)
`playInstant` validated `target` up to 1,000,000 but computed the multiplier from
the **clamped** chance (`min(98, max(1, …))`) while the win check compared the
**raw** target. With `target = 1,000,000` + "under": multiplier clamps to 99/98
≈ 1.01x, but `roll < 1,000,000` wins on every roll (dice rolls are 0.00–99.99) —
a guaranteed ~+1% expected value per bet (mirror image with "over" and
`target < 2`). Infinite money printer for any scripted client.

**Fix:** clamp the *target* into the honest payout domain [2, 98] and derive both
the chance, the multiplier (`99/chance`) and the win check from that one clamped
value → house edge is a constant 1% for every requestable target.

### 🔴 3.2 Double cash-out / double settle races (`src/lib/casino-api.ts`)
`cashOutCrash`, `cashOutMines`, `cashTower`, the `done` branch of `pickTower` and
blackjack's `settle()` credited the payout **before** flipping the round from
`status='open'`. Two concurrent requests both read `open`, both credit — double
payout from one bet.

**Fix:** claim-then-credit. The settle is now an atomic conditional
`UPDATE game_rounds SET status='settled' … WHERE … AND status='open' RETURNING 1`;
the caller that receives the row credits the payout, the loser gets
"Round already settled". (`RETURNING` works on both Neon/pg and PGLite, and the
`Sql` helper returns rows, so row-count parity is preserved across backends.)

### 🔴 3.3 Hi-Lo cash-out resurrection loop (`src/lib/casino-api.ts`)
Hi-Lo keeps rounds `open` by design and gates on `payload.live`. A cash-out and a
subsequent guess could interleave: cash-out flips `live=false` (pays), the
in-flight guess wrote `live=true` back from its stale read → the paid-out round
became live again → cash out again → infinite loop with a single bet.

**Fix:** cash-out flips `live` with an atomic guard
(`payload::jsonb->>'live' = 'true'` + `RETURNING 1`) and pays only the winner;
`playHilo` guards its write on the live-state it actually read
(`coalesce(payload::jsonb->>'live','false') = <wasLive>`), so a flipped round
cannot be resurrected.

### 🔴 3.4 Tower pick race (`src/lib/casino-api.ts`)
Parallel `pickTower` calls on the same row could probe several columns
simultaneously (the losing/death pick only settles if it wins the write race)
and the top-row completion could double-credit.

**Fix:** each pick claims the row atomically
(`… AND status='open' AND payload::jsonb->>'row' = <read row> RETURNING 1`);
losers get "Round state changed", the winner (and only the winner) settles or
advances, top-row credit happens after the claim.

### 🔴 3.5 Blackjack concurrent double/stand (`src/lib/casino-api.ts`)
Two concurrent `double` actions both passed the two-cards check, both debited,
both settled — payout 4x on 2x staked. Interleaved double+stand had the same class
of corruption.

**Fix:** every `blackjackAction` first claims the round exclusively
(`status='open'` → `status='locked'`, `RETURNING 1`). The action runs under the
claim; `settle()` writes from `locked`; a `hit` releases the claim back to `open`;
any failure path (including insufficient balance on double) releases the claim in
`catch` so the round never wedges. A crash mid-action leaves the round `locked`,
which every reader already treats as not-open (no exploit; see residual risks).

### 🟠 3.6 Wallet TOCTOU: overdraw & lost updates (`src/lib/wallet.server.ts`)
`debit`/`credit` did read-then-write inside a Prisma transaction. Two concurrent
bets could both pass the balance check and drive the balance negative (overdraw);
two concurrent credits could lose an increment.

**Fix:** atomic conditional updates — `debit` uses
`updateMany({ where: { userId, currency, balance: { gte: amount } }, data: { balance: { decrement: amount } } })`
(count 0 → "Insufficient balance"), `credit` uses `increment`. The ledger row is
created only after the balance mutation wins, inside the same transaction.

### 🟠 3.7 Provably-fair nonce race + seed-insert race (`src/lib/fair.server.ts`)
`takeFairRng` read the nonce, incremented it and drew from the **old** nonce: two
concurrent bets drew identical floats from the same nonce (breaks the
provably-fair contract and the verification math). Also, the first-ever insert
into `fair_seeds` crashed with a primary-key conflict when two requests raced.

**Fix:** nonce consumption is now atomic —
`UPDATE fair_seeds SET nonce = nonce+1 WHERE user_id=… RETURNING nonce-1 AS used_nonce, server_seed, server_hash, client_seed`
(each concurrent call owns its own nonce); the seed insert uses
`ON CONFLICT (user_id) DO NOTHING` followed by a re-read.

## 4. Environment notes (not repo bugs)

1. **Windows sandbox**: `child_process.spawn` is denied → 16 CLI-wrapper script
   tests fail here (`write-atomic`, `with-app-env`, `brand-check`,
   `check-auth-invariant`) though they pass on Linux CI; Vite's config loader
   spawns `net use` on Windows, so `build`/`dev` need a spawn-capable
   environment. On Vercel/CI both are non-issues.
2. **`npm run test:unit` uses POSIX `$(ls … | grep -v …)`** — it works on Linux CI
   but is broken on Windows shells. Cross-platform runners would need a small
   Node list-builder script (left untouched to avoid CI churn).
3. **Global npm cache EPERM** in this sandbox → `npm ci --cache <workspace>/.npm-cache`.
4. **Prisma engine install-scripts** blocked by this sandbox's npm policy
   (`@prisma/engines` postinstall) — irrelevant for typecheck/build since the
   generated client is committed, but a bare `prisma migrate` here would need
   script approval.

## 5. Residual risks / recommendations (beyond this round's fixes)

1. **`pushSettledBet` / `pushBridgeEvent` are fire-and-forget** (`void …`): on
   Vercel the function may freeze/terminate before the fetch resolves → bridge
   events (`casino.bet/win`, `solana_ledger`) can be silently lost. Migrate to
   Nitro `waitUntil` or a durable queue if the Tower ledger must be complete.
2. **Blackjack `locked` recovery**: a hard crash mid-action leaves a round
   `locked` (treated as not-open — no exploit, but the stake stays parked). A TTL
   sweeper or ops SQL (`UPDATE … SET status='open' WHERE status='locked' AND
   updated < now()-interval '5 minutes'`) would self-heal.
3. **`drawUnique` (Math.random-based) is dead code** in `casino-api.ts` and
   `crashElapsedFor` an unused import — lint warnings; safe to delete.
4. **Flexrix/Tower real-key activation** remains the P0 from the runbook
   (`docs/RUNBOOK-FLEXRIX.md`): env on Vercel → callback registration →
   `test_player` certification → `/api/operator/status` green.
5. **VAPID key rotation** still outstanding (old private key was exposed in git
   history per the 2026-09-13 log).

## 6. Post-fix verification

| Gate | Result |
|---|---|
| `npm run typecheck` | ✅ exit 0 |
| src unit tests | ✅ 83/83 |
| `npm run test:integration` vs dev server (PGLite) | ✅ **47/47** (wallet debit/credit/rollback, idempotency, HMAC paths all green after the Prisma rewrite) |
| `npm run build` | ✅ exit 0 |
| eslint on the three edited files | ✅ 0 errors (2 pre-existing warnings) |