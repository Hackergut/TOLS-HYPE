/**
 * TOLS Cloudflare edge — cache + Telegram webhook front-door.
 *
 * Money SoT stays on www.tols.fun (HYPE / Neon ledger).
 * This worker MUST NOT read or write wallets, Flexrix callbacks,
 * platform HMAC, or Mini App initData.
 */

export interface Env {
  ORIGIN: string;
  EDGE_CACHE?: KVNamespace;
  TELEGRAM_WEBHOOK_SECRET?: string;
}

const CACHEABLE_GET = [
  /^\/brand\//,
  /^\/favicon\.svg$/,
  /^\/__grok\//,
];

const SHORT_CACHE_GET = [/^\/api\/health$/, /^\/api\/geo$/, /^\/api\/compliance\/geo$/];

const NEVER_CACHE = [
  /^\/api\/auth/,
  /^\/api\/flexrix/,
  /^\/api\/platform/,
  /^\/api\/bridge/,
  /^\/api\/operator/,
  /^\/api\/wallet/,
  /^\/api\/withdraw/,
  /^\/api\/deposit/,
  /^\/api\/sportsbook/,
  /^\/api\/affiliate/,
];

function originOf(env: Env): string {
  return (env.ORIGIN || "https://www.tols.fun").replace(/\/$/, "");
}

function matches(path: string, rules: RegExp[]): boolean {
  return rules.some((r) => r.test(path));
}

function safeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

function denyMoney(path: string, method: string): boolean {
  if (method !== "GET" && method !== "HEAD" && matches(path, NEVER_CACHE)) return true;
  return false;
}

async function proxy(request: Request, env: Env, extra: HeadersInit = {}): Promise<Response> {
  const url = new URL(request.url);
  const target = new URL(url.pathname + url.search, originOf(env));
  const headers = new Headers(request.headers);
  headers.set("x-tols-edge", "1");
  headers.delete("cookie"); // edge is not a session proxy except webhook/auth passthrough below
  const init: RequestInit = {
    method: request.method,
    headers,
    body: request.method === "GET" || request.method === "HEAD" ? undefined : request.body,
    redirect: "manual",
  };
  const res = await fetch(target.toString(), init);
  const out = new Headers(res.headers);
  for (const [k, v] of Object.entries(extra)) out.set(k, v);
  out.set("x-tols-edge", "cf");
  return new Response(res.body, { status: res.status, statusText: res.statusText, headers: out });
}

async function cachedGet(request: Request, env: Env, ttlSec: number): Promise<Response> {
  const url = new URL(request.url);
  const key = `v1:${url.pathname}`;
  if (env.EDGE_CACHE) {
    const hit = await env.EDGE_CACHE.get(key, "arrayBuffer");
    const meta = await env.EDGE_CACHE.get(`${key}:meta`, "json") as { type?: string; status?: number } | null;
    if (hit && meta) {
      return new Response(hit, {
        status: meta.status || 200,
        headers: {
          "content-type": meta.type || "application/octet-stream",
          "cache-control": `public, max-age=${ttlSec}`,
          "x-tols-edge": "kv-hit",
        },
      });
    }
  }
  const res = await proxy(request, env, { "cache-control": `public, max-age=${ttlSec}` });
  if (env.EDGE_CACHE && res.ok) {
    const buf = await res.clone().arrayBuffer();
    await env.EDGE_CACHE.put(key, buf, { expirationTtl: ttlSec });
    await env.EDGE_CACHE.put(`${key}:meta`, JSON.stringify({
      type: res.headers.get("content-type"),
      status: res.status,
    }), { expirationTtl: ttlSec });
  }
  return res;
}

async function telegramWebhook(request: Request, env: Env): Promise<Response> {
  if (request.method === "GET" || request.method === "HEAD") {
    return new Response("Method Not Allowed", { status: 405 });
  }
  if (request.method !== "POST") {
    return new Response("Method Not Allowed", { status: 405 });
  }
  const secret = env.TELEGRAM_WEBHOOK_SECRET || "";
  const got = request.headers.get("x-telegram-bot-api-secret-token") ?? "";
  if (!secret || !safeEqual(got, secret)) {
    return new Response("Unauthorized", { status: 401 });
  }
  const target = `${originOf(env)}/api/telegram/webhook`;
  const headers = new Headers(request.headers);
  headers.set("x-tols-edge", "tg-webhook");
  const res = await fetch(target, { method: "POST", headers, body: request.body });
  // Always 200 to Telegram once the secret matched — origin errors are logged, not retried for hours.
  if (!res.ok) {
    console.error("[tols-edge] origin webhook", res.status);
    return Response.json({ ok: true, forwarded: false, origin: res.status });
  }
  return new Response(res.body, { status: 200, headers: { "content-type": res.headers.get("content-type") || "application/json" } });
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);
    const path = url.pathname;

    if (path === "/api/telegram/webhook" || path === "/tg/webhook") {
      return telegramWebhook(request, env);
    }

    if (path === "/edge/health") {
      return Response.json({
        ok: true,
        service: "tols-edge",
        origin: originOf(env),
        kv: Boolean(env.EDGE_CACHE),
        webhookSecret: Boolean(env.TELEGRAM_WEBHOOK_SECRET),
        ts: new Date().toISOString(),
      });
    }

    // Never cache or terminate money / session / aggregator paths at the edge.
    if (matches(path, NEVER_CACHE)) {
      return proxy(request, env, { "cache-control": "private, no-store" });
    }

    if (request.method === "GET" || request.method === "HEAD") {
      if (matches(path, CACHEABLE_GET)) return cachedGet(request, env, 3600);
      if (matches(path, SHORT_CACHE_GET)) return cachedGet(request, env, 15);
    }

    return proxy(request, env);
  },
};
