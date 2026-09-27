import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { authMiddleware } from "@/lib/auth/middleware";

const pulseInput = z.object({
  place: z.enum(["lobby", "game", "keep"]),
  gameId: z.string().max(80).optional(),
  device: z.enum(["mobile", "desktop"]).optional(),
});

/** Signed-in player heartbeat. The user id comes from the session, never from the body. */
export const pulsePresence = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((input: unknown) => pulseInput.parse(input))
  .handler(async ({ data }) => {
    const { getSessionUser } = await import("@/lib/auth/verify.server");
    const { touchPresence } = await import("@/lib/governance/presence.server");
    const user = await getSessionUser();
    if (!user?.id) return { ok: false as const };
    await touchPresence({
      userId: user.id,
      email: user.email,
      gameId: data.gameId,
      device: data.device,
      place: data.place,
    });
    return { ok: true as const, userId: user.id };
  });
