#!/usr/bin/env node
/**
 * Integration self-test — fake-vendor harness for the seamless-wallet
 * callbacks. Exercises, over HTTP against a running server:
 *
 *   1. Flexrix casino GIS   POST /api/flexrix/callback      (HMAC-SHA1)
 *   2. Flexrix sportsbook    POST /api/sportsbook/callback  (HMAC-SHA1)
 *   3. Governance Tower      POST /api/bridge/webhook       (HMAC-SHA256)
 *   4. Ops probes            GET  /api/operator/status|games
 *
 * The harness signs with the SAME env the server verifies with, so start
 * the server with throwaway test secrets (sandbox-only, never commit):
 *
 *   FLEXRIX_MERCHANT_KEY=FXC_selftest_local_only \
 *   FLEXRIX_API_SECRET=selftest-flexrix-secret-01 \
 *   FLEXRIX_SPORTS_SECRET=selftest-sports-secret-02 \
 *   GOVERNANCE_BRIDGE_SECRET=selftest-bridge-secret-03 \
 *   npm run dev
 *
 *   BASE_URL=http://127.0.0.1:8080 npm run test:integration
 *
 * Safety: refuses non-localhost targets unless SELFTEST_ALLOW_REMOTE=1.
 * Every run uses fresh player ids, so reruns never interfere with each other.
 */
import { createHmac, randomBytes } from "node:crypto";

const BASE = (process.env.BASE_URL ?? "http://127.0.0.1:8080").replace(/\/$/, "");
const MERCHANT = process.env.FLEXRIX_MERCHANT_KEY ?? "";
const CASINO_SECRET = process.env.FLEXRIX_API_SECRET ?? process.env.FLEXRIX_CASINO_SECRET ?? "";
const SPORTS_SECRET = process.env.FLEXRIX_SPORTS_SECRET ?? CASINO_SECRET;
const BRIDGE_SECRET = process.env.GOVERNANCE_BRIDGE_SECRET ?? "";

function fail(reason) {
  console.error(`\nSELFTEST ABORT: ${reason}`);
  process.exit(2);
}

try {
  const host = new URL(BASE).hostname.toLowerCase();
  const local = ["localhost", "127.0.0.1", "::1", ""].includes(host) || host.endsWith(".localhost");
  if (!local && process.env.SELFTEST_ALLOW_REMOTE !== "1") {
    fail(`refusing non-localhost target ${BASE} without SELFTEST_ALLOW_REMOTE=1`);
  }
} catch {
  fail(`invalid BASE_URL ${BASE}`);
}
if (!MERCHANT || !CASINO_SECRET) fail("FLEXRIX_MERCHANT_KEY + FLEXRIX_API_SECRET must be set (and match the server)");
if (!SPORTS_SECRET) fail("FLEXRIX_SPORTS_SECRET (or FLEXRIX_API_SECRET fallback) must be set");
if (BRIDGE_SECRET.length < 16) fail("GOVERNANCE_BRIDGE_SECRET (>=16 chars) must be set and match the server");

const RUN = `${Date.now().toString(36)}${randomBytes(3).toString("hex")}`;
const pid = (tag) => `selftest_${tag}_${RUN}`;
const txid = (tag) => `st_${tag}_${RUN}_${randomBytes(2).toString("hex")}`;

// ── signers (mirror src/lib/operator/flexrix-sign.ts + governance/bridge.ts) ──

function flexrixHashString(params) {
  return Object.keys(params)
    .sort()
    .map((k) => `${k}=${encodeURIComponent(String(params[k]))}`)
    .join("&");
}

function flexrixHeaders(flatParams, secret, merchant) {
  const ts = String(Math.floor(Date.now() / 1000));
  const nonce = randomBytes(16).toString("hex");
  const merged = { ...flatParams, "X-Merchant-Id": merchant, "X-Timestamp": ts, "X-Nonce": nonce };
  const sign = createHmac("sha1", secret).update(flexrixHashString(merged)).digest("hex");
  return { "X-Merchant-Id": merchant, "X-Timestamp": ts, "X-Nonce": nonce, "X-Sign": sign };
}

const flatten = (obj) => Object.fromEntries(Object.entries(obj).map(([k, v]) => [k, String(v)]));

function bridgeHeaders(raw, secret) {
  return {
    "X-Bridge-Signature": `sha256=${createHmac("sha256", secret).update(raw).digest("hex")}`,
    "X-Bridge-Timestamp": String(Math.floor(Date.now() / 1000)),
  };
}

// ── http ──

async function call(method, path, { headers = {}, body } = {}) {
  const res = await fetch(`${BASE}${path}`, {
    method,
    headers: { "content-type": "application/json", ...headers },
    body: body === undefined ? undefined : typeof body === "string" ? body : JSON.stringify(body),
  });
  const text = await res.text();
  let json = null;
  try {
    json = JSON.parse(text);
  } catch {
    /* non-json */
  }
  return { status: res.status, json, text: text.slice(0, 300) };
}

const flexrixPost = (body, secret = CASINO_SECRET, merchant = MERCHANT) =>
  call("POST", "/api/flexrix/callback", {
    headers: flexrixHeaders(flatten(body), secret, merchant),
    body,
  });

const sportsPost = (body, secret = SPORTS_SECRET) =>
  call("POST", "/api/sportsbook/callback", {
    headers: flexrixHeaders(flatten(body), secret, MERCHANT),
    body,
  });

const bridgePost = (obj, secret = BRIDGE_SECRET, tsOverride) => {
  const raw = JSON.stringify(obj);
  const headers = bridgeHeaders(raw, secret);
  if (tsOverride !== undefined) headers["X-Bridge-Timestamp"] = tsOverride;
  return call("POST", "/api/bridge/webhook", { headers, body: raw });
};

// ── assertions ──

let passed = 0;
const failures = [];
function check(name, cond, detail = "") {
  if (cond) {
    passed++;
    console.log(`  ok - ${name}`);
  } else {
    failures.push(name);
    console.log(`  FAIL - ${name}${detail ? ` :: ${detail}` : ""}`);
  }
}

// ── suites ──

async function suiteFlexrix() {
  console.log("Flexrix casino GIS (/api/flexrix/callback)");
  const player = pid("casino");

  const pong = await call("GET", "/api/flexrix/callback");
  check("GET pong", pong.status === 200 && pong.json?.service === "flexrix-callback", pong.text);

  const b0 = await flexrixPost({ action: "balance", player_id: player });
  check("signed balance returns a number", b0.status === 200 && typeof b0.json?.balance === "number", b0.text);
  const start = Number(b0.json?.balance ?? NaN);

  const betTx = txid("bet");
  const bet = await flexrixPost({
    action: "bet",
    player_id: player,
    amount: 10,
    currency: "USDT",
    transaction_id: betTx,
    game_uuid: "selftest-game",
  });
  // Fresh players start at 0: fund via a win first when needed.
  let funded = start;
  if (bet.json?.error_code === "INSUFFICIENT_FUNDS") {
    const fund = await flexrixPost({
      action: "win",
      player_id: player,
      amount: 100,
      currency: "USDT",
      transaction_id: txid("fund"),
      game_uuid: "selftest-game",
    });
    funded = Number(fund.json?.balance ?? NaN);
    check("fund player via win", fund.status === 200 && funded === start + 100, fund.text);
    const bet2 = await flexrixPost({
      action: "bet",
      player_id: player,
      amount: 10,
      currency: "USDT",
      transaction_id: betTx,
      game_uuid: "selftest-game",
    });
    check("bet debits 10", bet2.status === 200 && Number(bet2.json?.balance) === funded - 10, bet2.text);
  } else {
    check("bet debits 10", bet.status === 200 && Number(bet.json?.balance) === start - 10, bet.text);
    funded = start;
  }
  const afterBet = funded - 10;

  const replay = await flexrixPost({
    action: "bet",
    player_id: player,
    amount: 10,
    currency: "USDT",
    transaction_id: betTx,
    game_uuid: "selftest-game",
  });
  check(
    "replayed txn is idempotent (no double debit)",
    replay.status === 200 && Number(replay.json?.balance) === afterBet,
    replay.text,
  );

  const win = await flexrixPost({
    action: "win",
    player_id: player,
    amount: 25,
    currency: "USDT",
    transaction_id: txid("win"),
    game_uuid: "selftest-game",
  });
  check("win credits 25", win.status === 200 && Number(win.json?.balance) === afterBet + 25, win.text);

  const over = await flexrixPost({
    action: "bet",
    player_id: player,
    amount: 1_000_000_000,
    currency: "USDT",
    transaction_id: txid("over"),
  });
  check("over-bet is INSUFFICIENT_FUNDS", over.json?.error_code === "INSUFFICIENT_FUNDS", over.text);

  const refBetTx = txid("refbet");
  await flexrixPost({ action: "bet", player_id: player, amount: 5, currency: "USDT", transaction_id: refBetTx });
  const before = await flexrixPost({ action: "balance", player_id: player });
  const refund = await flexrixPost({
    action: "refund",
    player_id: player,
    amount: 5,
    currency: "USDT",
    transaction_id: txid("refund"),
    bet_transaction_id: refBetTx,
  });
  check(
    "refund restores the bet",
    refund.status === 200 && Number(refund.json?.balance) === Number(before.json?.balance) + 5,
    refund.text,
  );

  const winTx = txid("winref");
  await flexrixPost({ action: "win", player_id: player, amount: 3, currency: "USDT", transaction_id: winTx });
  const badRefund = await flexrixPost({
    action: "refund",
    player_id: player,
    amount: 3,
    currency: "USDT",
    transaction_id: txid("badrefund"),
    bet_transaction_id: winTx,
  });
  check("refunding a win is rejected", badRefund.json?.error_code === "INTERNAL_ERROR", badRefund.text);

  const rb = await flexrixPost({
    action: "rollback",
    player_id: player,
    amount: 0,
    currency: "USDT",
    transaction_id: txid("rb"),
  });
  check("rollback(0) acks with transaction_id", rb.status === 200 && typeof rb.json?.transaction_id === "string", rb.text);

  const tampered = await flexrixPost(
    { action: "balance", player_id: player },
    "wrong-secret-00000000000000000000",
  );
  check("bad signature is rejected", typeof tampered.json?.error_code === "string", tampered.text);

  const cert = `selftest_test_player_${RUN}`;
  const seeded = await flexrixPost({ action: "balance", player_id: cert });
  check("cert test_player is seeded to 1000", seeded.status === 200 && Number(seeded.json?.balance) === 1000, seeded.text);
}

async function suiteSportsbook() {
  console.log("Flexrix sportsbook (/api/sportsbook/callback)");
  const player = pid("sports");

  const pong = await call("GET", "/api/sportsbook/callback");
  check("GET pong", pong.status === 200 && pong.json?.service === "sportsbook-callback", pong.text);

  const b0 = await sportsPost({ action: "balance", player_id: player });
  check(
    "signed balance returns USD balance",
    b0.status === 200 && typeof b0.json?.balance === "number" && b0.json?.currency === "USD",
    b0.text,
  );

  const fund = await sportsPost({ action: "credit", player_id: player, amount: 20, transaction_id: txid("sfund") });
  check("credit funds 20", fund.status === 200 && Number(fund.json?.balance) === 20, fund.text);

  const debit = await sportsPost({ action: "debit", player_id: player, amount: 5, transaction_id: txid("sdebit") });
  check("debit takes 5", debit.status === 200 && Number(debit.json?.balance) === 15, debit.text);

  const win = await sportsPost({ action: "credit", player_id: player, amount: 5, transaction_id: txid("swin") });
  check("credit restores 5", win.status === 200 && Number(win.json?.balance) === 20, win.text);

  const wrong = await sportsPost({ action: "balance", player_id: player }, "wrong-secret-00000000000000000000");
  check("wrong signature is 401", wrong.status === 401, wrong.text);

  const unsigned = await call("POST", "/api/sportsbook/callback", { body: { action: "balance", player_id: player } });
  check("missing signature is 401 while secret configured", unsigned.status === 401, unsigned.text);
}

async function suiteBridge() {
  console.log("Governance bridge (/api/bridge/webhook)");
  const user = pid("tower");

  const health = await call("GET", "/api/bridge/webhook");
  check("GET reachable", health.status === 200 && health.json?.reachable === true, health.text);

  const ping = await call("POST", "/api/bridge/webhook", { body: { type: "ping" } });
  check("unsigned ping gets pong", ping.status === 200 && ping.json?.type === "pong", ping.text);

  const bonus = await bridgePost({
    type: "governance.bonus_credit",
    payload: { userId: user, amount: 7, currency: "USDT", reason: "selftest" },
  });
  check(
    "signed bonus_credit credits 7 USDT",
    bonus.status === 200 && bonus.json?.success === true && Number(bonus.json?.balances?.USDT) === 7,
    bonus.text,
  );

  const badSig = await bridgePost(
    { type: "governance.bonus_credit", payload: { userId: user, amount: 1, currency: "USDT" } },
    "wrong-secret-00000000000000000000",
  );
  check("bad bridge signature is 401", badSig.status === 401, badSig.text);

  const staleReal = await bridgePost(
    { type: "governance.wallet_adjust", payload: { userId: user, amount: 1, currency: "USDT" } },
    BRIDGE_SECRET,
    String(Math.floor(Date.now() / 1000) - 3600),
  );
  check("stale timestamp is 401", staleReal.status === 401, staleReal.text);

  const unknown = await bridgePost({ type: "casino.nope", payload: {} });
  check("unknown event type is 400", unknown.status === 400, unknown.text);
}

async function suiteOps() {
  console.log("Ops probes");
  const status = await call("GET", "/api/operator/status");
  const s = status.json ?? {};
  check("operator/status reflects test secrets", status.status === 200 && s.flexrix === true && s.sports === true, status.text);
  check("bridge secret visible, webhook secret absent", s.bridgeSecret === true && s.webhookSecret === false, status.text);
  check("db reports pglite in sandbox", s.db === "pglite", status.text);

  const games = await call("GET", "/api/operator/games");
  check(
    "operator/games serves originals, flexrix attempted",
    games.status === 200 && Array.isArray(games.json?.originals) && games.json.originals.length > 0,
    games.text,
  );
  check(
    "flexrix error surfaces (fake merchant)",
    games.json?.flexrix?.configured === true && typeof games.json?.flexrix?.error === "string",
    games.text,
  );
}

const suites = [suiteFlexrix, suiteSportsbook, suiteBridge, suiteOps];
for (const suite of suites) {
  try {
    await suite();
  } catch (err) {
    failures.push(`${suite.name}: ${err instanceof Error ? err.message : String(err)}`);
    console.log(`  FAIL - ${suite.name} threw: ${err instanceof Error ? err.message : err}`);
  }
}

console.log(`\nselftest: ${passed} passed, ${failures.length} failed`);
if (failures.length) {
  for (const f of failures) console.log(`  - ${f}`);
  process.exit(1);
}
