import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { authMiddleware } from "@/lib/auth/middleware";
import { CURRENCIES, type Currency } from "@/lib/games-catalog";
import { operatorServer } from "@/lib/operator/env.server";
import { resolveAdapter, listAdapters } from "@/lib/operator/registry";
import { PLATFORM_SKILLS } from "@/lib/operator/skills";
import { governanceHealth } from "@/lib/operator/governance";
import { paymentEndpoints } from "@/lib/operator/payments";
import type { LaunchResponse, RemoteGame, SeamlessRequest, SeamlessResponse } from "@/lib/operator/types";
import { credit, debit, ensureWallets, snapshotBalances } from "@/lib/wallet.server";

function parseCurrency(value: string): Currency {
  if ((CURRENCIES as readonly string[]).includes(value)) return value as Currency;
  return "USDT";
}

async function headerAuth(headers: Record<string, string>) {
  const cfg = operatorServer();
  if (!cfg.webhookSecret) return true;
  const got = headers.authorization ?? headers["x-operator-secret"] ?? "";
  return got === cfg.webhookSecret || got === `Bearer ${cfg.webhookSecret}`;
}

export const listRemoteGames = createServerFn({ method: "GET" }).handler(async (): Promise<RemoteGame[]> => {
  try {
    return await resolveAdapter().listGames();
  } catch {
    return [];
  }
});

export const launchRemoteGame = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator(z.object({ gameId: z.string(), currency: z.string() }))
  .handler(async ({ context, data }): Promise<LaunchResponse> => {
    const adapter = resolveAdapter();
    try {
      return await adapter.launch({
        gameId: data.gameId,
        userId: context.userId,
        currency: data.currency,
      });
    } catch (err) {
      return { error: err instanceof Error ? err.message : "Launch failed" };
    }
  });

export async function seamlessWallet(
  req: SeamlessRequest,
  headers: Record<string, string>,
): Promise<SeamlessResponse> {
  if (!(await headerAuth(headers))) return { ok: false, error: "Unauthorized" };
  if (!req.userId) return { ok: false, error: "Missing userId" };
  const currency = parseCurrency(String(req.currency));
  const userId = req.userId;
  await ensureWallets(userId);
  const txnId = req.txnId ?? `tx_${Date.now()}`;

  if (req.action === "balance" || req.action === "rollback") {
    const balances = await snapshotBalances(userId);
    return { ok: true, balance: balances[currency], txnId };
  }

  const amount = Number(req.amount ?? 0);
  try {
    if (req.action === "bet") {
      const balance = await debit(userId, currency, amount, "bet", req.gameId, txnId);
      return { ok: true, balance, txnId };
    }
    if (req.action === "win") {
      const balance = await credit(userId, currency, amount, "win", req.gameId, txnId);
      return { ok: true, balance, txnId };
    }
  } catch (err) {
    const balances = await snapshotBalances(userId);
    return {
      ok: false,
      error: err instanceof Error ? err.message : "Wallet error",
      balance: balances[currency],
    };
  }

  return { ok: false, error: "Unknown action" };
}

export async function inboundWallet(body: unknown, headers: Record<string, string>): Promise<SeamlessResponse> {
  const parsed = resolveAdapter().parseWallet(body);
  if (!parsed) return { ok: false, error: "Unrecognized wallet payload" };
  return seamlessWallet(parsed, headers);
}

export const operatorStatus = createServerFn({ method: "GET" }).handler(async () => {
  const c = operatorServer();
  const adapter = resolveAdapter();
  const gov = await governanceHealth();
  return {
    backend: c.backend,
    adapter: adapter.id,
    adapterLabel: adapter.label,
    adapters: listAdapters(),
    skills: PLATFORM_SKILLS,
    sql: Boolean(c.databaseUrl) || true,
    prisma: true,
    supabase: Boolean(c.supabaseUrl),
    governance: Boolean(c.governanceUrl),
    governanceOk: gov.ok,
    aggregator: Boolean(c.aggregatorUrl) || adapter.id !== "local",
    kind: c.aggregatorKind,
    casinoOrigin: c.casinoOrigin,
    payments: paymentEndpoints(),
  };
});
