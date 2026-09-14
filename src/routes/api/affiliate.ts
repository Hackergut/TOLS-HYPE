import { createFileRoute } from "@tanstack/react-router";
import { getSessionUser } from "@/lib/auth/verify.server";

export const Route = createFileRoute("/api/affiliate")({
  server: {
    handlers: {
      GET: async () => {
        const user = await getSessionUser();
        const referralCode = user ? `TOLS-${user.id.slice(0, 8).toUpperCase()}` : "";
        return Response.json({
          referralCode,
          commissionRate: 0.25,
          totalClicks: 0,
          totalReferrals: 0,
          totalWagered: 0,
          totalCommission: 0,
          pendingCommission: 0,
          paidCommission: 0,
          referrals: [] as unknown[],
          commissionLogs: [] as unknown[],
        });
      },
    },
  },
});
