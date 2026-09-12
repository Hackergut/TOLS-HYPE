import { createFileRoute, redirect } from "@tanstack/react-router";
import { canonicalGameId } from "@/lib/games-catalog";

export const Route = createFileRoute("/_shell/play/$slug")({
  beforeLoad: ({ params }) => {
    throw redirect({
      to: "/games/$id",
      params: { id: canonicalGameId(params.slug) },
    });
  },
});
