import { createServerFn } from "@tanstack/react-start";
import { authMiddleware } from "@/lib/auth/middleware";
import { listSportTickets, type SportTicket } from "@/lib/sports/settlement.server";

/**
 * The signed-in player's sport tickets — the ones still waiting on a final
 * score and the ones already settled. Pending tickets are the reason a stake
 * left the wallet without an immediate payout, so they must be visible.
 */
export const listMySportTickets = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .handler(async ({ context }): Promise<SportTicket[]> => {
    return listSportTickets(context.userId, 50);
  });
