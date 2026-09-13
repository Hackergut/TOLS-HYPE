import { createFileRoute } from "@tanstack/react-router";
import { englishSportsUrl, sportsSsoToken } from "@/lib/operator/sportsbook.server";
import { operatorServer } from "@/lib/operator/env.server";
import { getSessionUser } from "@/lib/auth/verify.server";

export const Route = createFileRoute("/api/sportsbook/session")({
  server: {
    handlers: {
      GET: async () => {
        let userId = "guest";
        try {
          const u = await getSessionUser();
          if (u?.id) userId = u.id;
        } catch {
          /* guest */
        }
        const token = sportsSsoToken(userId, "USD");
        return Response.json({
          url: englishSportsUrl(token),
          lang: "en",
          callback: `${operatorServer().casinoOrigin}/api/sportsbook/callback`,
        });
      },
    },
  },
});
