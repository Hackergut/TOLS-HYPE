import { createFileRoute, redirect } from "@tanstack/react-router";
import { canonicalGameId } from "@/lib/games-catalog";

export const Route = createFileRoute("/_shell/originals/$id")({
  beforeLoad: ({ params }) => {
    throw redirect({
      to: "/games/$id",
      params: { id: canonicalGameId(params.id) },
    });
  },
});
