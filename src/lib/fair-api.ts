import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { authMiddleware } from "@/lib/auth/middleware";

export const getFairState = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .handler(async ({ context }) => {
    const { fairSnapshot } = await import("@/lib/fair.server");
    return fairSnapshot(context.userId);
  });

export const setClientSeed = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator(z.object({ clientSeed: z.string().min(1).max(64) }))
  .handler(async ({ context, data }) => {
    const { applyClientSeed } = await import("@/lib/fair.server");
    return applyClientSeed(context.userId, data.clientSeed);
  });

export const rotateServerSeed = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator(z.object({ clientSeed: z.string().max(64).optional() }))
  .handler(async ({ context, data }) => {
    const { rotateFairSeed } = await import("@/lib/fair.server");
    return rotateFairSeed(context.userId, data.clientSeed);
  });
