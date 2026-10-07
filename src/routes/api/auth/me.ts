import { createFileRoute } from "@tanstack/react-router";
import { auth } from "@/lib/auth/server";
import { sessionAllowed } from "@/lib/auth/access.server";
import { handleGoogleLogout, handleGoogleMe } from "@/lib/auth/google-handlers.server";

async function emailSession(request: Request) {
  const url = new URL(request.url);
  url.pathname = "/api/auth/get-session";
  url.search = "";
  const sessionRes = await auth.handler(new Request(url, { method: "GET", headers: request.headers }));
  const data = (await sessionRes.json().catch(() => null)) as {
    session?: { createdAt?: string };
    user?: { id?: string; name?: string | null; email?: string | null; image?: string | null };
  } | null;
  const user = data?.user;
  if (!user?.id) return null;
  const created = data?.session?.createdAt ?? new Date().toISOString();
  if (!(await sessionAllowed(user.id, created))) return null;
  return user;
}

export const Route = createFileRoute("/api/auth/me")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const google = await handleGoogleMe(request);
        const parsed = (await google.clone().json().catch(() => null)) as { user?: { id?: string } } | null;
        if (parsed?.user?.id) return google;
        const user = await emailSession(request);
        if (!user?.id) return google;
        return Response.json({
          ok: true,
          user: {
            id: user.id,
            displayName: user.name ?? null,
            primaryEmail: user.email ?? null,
            profileImageUrl: user.image ?? null,
            isDevFallback: false,
          },
        });
      },
      POST: async ({ request }) => handleGoogleLogout(request),
    },
  },
});
