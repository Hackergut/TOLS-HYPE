import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { authMiddleware } from "@/lib/auth/middleware";
import type { LaunchResponse, RemoteGame } from "@/lib/operator/types";

export const listRemoteGames = createServerFn({ method: "GET" }).handler(async (): Promise<RemoteGame[]> => {
  const { resolveAdapter } = await import("@/lib/operator/registry");
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
    const { resolveAdapter } = await import("@/lib/operator/registry");
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

export const operatorStatus = createServerFn({ method: "GET" }).handler(async () => {
  const { operatorServer } = await import("@/lib/operator/env.server");
  const { resolveAdapter, listAdapters } = await import("@/lib/operator/registry");
  const { PLATFORM_SKILLS } = await import("@/lib/operator/skills");
  const { governanceHealth } = await import("@/lib/operator/governance");
  const { paymentEndpoints } = await import("@/lib/operator/payments");
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
