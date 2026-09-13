import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { authMiddleware } from "@/lib/auth/middleware";
import type { LaunchResponse, RemoteGame } from "@/lib/operator/types";

export const listRemoteGames = createServerFn({ method: "GET" }).handler(async (): Promise<RemoteGame[]> => {
  const { resolveAdapter } = await import("@/lib/operator/registry");
  return await resolveAdapter().listGames();
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
        email: context.email,
        currency: data.currency,
      });
    } catch (err) {
      return { error: err instanceof Error ? err.message : "Launch failed" };
    }
  });

export const operatorStatus = createServerFn({ method: "GET" }).handler(async () => {
  const { getOperatorStatus } = await import("@/lib/operator/status.server");
  return getOperatorStatus();
});
