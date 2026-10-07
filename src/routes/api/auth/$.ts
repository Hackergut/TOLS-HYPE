import { createFileRoute } from "@tanstack/react-router";
import { auth } from "@/lib/auth/server";
import { seedDemoAccount, ensureDemoPassword, DEMO_EMAIL } from "@/lib/demo-account.server";
import { loginBlocked, sessionAllowed } from "@/lib/auth/access.server";
import { syncUserOnSignIn } from "@/lib/auth/user-sync.server";
import { pushBridgeEvent } from "@/lib/governance/bridge";
import {
  handleGoogleCallback,
  handleGoogleDiag,
  handleGoogleLogout,
  handleGoogleMe,
  handleGoogleGovHandoff,
  handleGoogleStart,
} from "@/lib/auth/google-handlers.server";
import {
  handleTelegramCallback,
  handleTelegramDiag,
  handleTelegramStart,
} from "@/lib/auth/telegram-handlers.server";

function cleanPath(request: Request): string {
  return new URL(request.url).pathname.replace(/\/+$/, "") || "/";
}

async function intercept(request: Request, fallback: (req: Request) => Promise<Response> | Response) {
  await seedDemoAccount();
  const path = cleanPath(request);
  if (path === "/api/auth/google") return handleGoogleStart(request);
  if (path === "/api/auth/google/callback") return handleGoogleCallback(request);
  if (path === "/api/auth/google/gov") return handleGoogleGovHandoff(request);
  if (path === "/api/auth/google/diag") return handleGoogleDiag();
  if (path === "/api/auth/telegram") return handleTelegramStart(request);
  if (path === "/api/auth/telegram/callback") return handleTelegramCallback(request);
  if (path === "/api/auth/telegram/diag") return handleTelegramDiag();
  if (path === "/api/auth/me") return resolveMe(request);
  if (
    path === "/api/auth/logout" ||
    path === "/api/auth/google/logout" ||
    path === "/api/auth/telegram/logout"
  ) {
    return handleGoogleLogout(request);
  }
  return fallback(request);
}

async function resolveMe(request: Request): Promise<Response> {
  const google = await handleGoogleMe(request);
  const parsed = (await google.clone().json().catch(() => null)) as { user?: { id?: string } } | null;
  if (parsed?.user?.id) return google;
  const url = new URL(request.url);
  url.pathname = "/api/auth/get-session";
  url.search = "";
  const sessionRes = await auth.handler(new Request(url, { method: "GET", headers: request.headers }));
  const data = (await sessionRes.json().catch(() => null)) as {
    session?: { createdAt?: string };
    user?: { id?: string; name?: string | null; email?: string | null; image?: string | null };
  } | null;
  const user = data?.user;
  if (!user?.id) return google;
  const created = data?.session?.createdAt ?? new Date().toISOString();
  if (!(await sessionAllowed(user.id, created))) return google;
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
}

async function denyBlockedLogin(request: Request): Promise<Response | null> {
  const path = cleanPath(request);
  if (!path.endsWith("/sign-in/email")) return null;
  let email = "";
  try {
    const body = (await request.clone().json()) as { email?: string };
    email = String(body.email ?? "");
  } catch {
    return null;
  }
  if (!email || !(await loginBlocked(email))) return null;
  return Response.json({ message: "Account blocked by governance" }, { status: 403 });
}

async function publishAuth(request: Request, response: Response, leavingUserId: string | null): Promise<Response> {
  const path = cleanPath(request);
  if (leavingUserId) {
    void pushBridgeEvent("casino.session_end", { userId: leavingUserId, provider: "email" }).catch(() => undefined);
  }
  if (path.endsWith("/sign-in/email") && response.ok) {
    const data = (await response.clone().json().catch(() => null)) as {
      user?: { id?: string; email?: string | null; name?: string | null; image?: string | null };
    } | null;
    const user = data?.user;
    if (user?.id) {
      await syncUserOnSignIn({
        providerAccountId: user.email ?? user.id,
        userId: user.id,
        email: user.email ?? null,
        name: user.name ?? "Player",
        picture: user.image ?? null,
        provider: "email",
      });
    }
  }
  return response;
}

async function handle(request: Request) {
  const path = cleanPath(request);
  let leaving: string | null = null;
  if (path.endsWith("/sign-out") || path.endsWith("/logout")) {
    const session = await auth.api.getSession({ headers: request.headers }).catch(() => null);
    leaving = session?.user?.id ?? null;
  }
  const denied = await denyBlockedLogin(request);
  if (denied) return denied;
  if (path.endsWith("/sign-in/email")) {
    let email = "";
    try {
      const body = (await request.clone().json()) as { email?: string };
      email = String(body.email ?? "").trim().toLowerCase();
    } catch {
      email = "";
    }
    if (email === DEMO_EMAIL) await ensureDemoPassword();
  }
  const response = await intercept(request, (req) => auth.handler(req));
  return publishAuth(request, response, leaving);
}

export const Route = createFileRoute("/api/auth/$")({
  server: {
    handlers: {
      GET: ({ request }) => handle(request),
      POST: ({ request }) => handle(request),
    },
  },
});