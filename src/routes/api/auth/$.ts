import { createFileRoute } from "@tanstack/react-router";
import { auth } from "@/lib/auth/server";
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
  handleTelegramLogout,
  handleTelegramStart,
} from "@/lib/auth/telegram-handlers.server";

function cleanPath(request: Request): string {
  return new URL(request.url).pathname.replace(/\/+$/, "") || "/";
}

async function intercept(request: Request, fallback: (req: Request) => Promise<Response> | Response) {
  const path = cleanPath(request);
  if (path === "/api/auth/google") return handleGoogleStart(request);
  if (path === "/api/auth/google/callback") return handleGoogleCallback(request);
  if (path === "/api/auth/google/gov") return handleGoogleGovHandoff(request);
  if (path === "/api/auth/google/diag") return handleGoogleDiag();
  if (path === "/api/auth/telegram") return handleTelegramStart(request);
  if (path === "/api/auth/telegram/callback") return handleTelegramCallback(request);
  if (path === "/api/auth/telegram/diag") return handleTelegramDiag();
  if (path === "/api/auth/me") return handleGoogleMe(request);
  if (
    path === "/api/auth/logout" ||
    path === "/api/auth/google/logout" ||
    path === "/api/auth/telegram/logout"
  ) {
    return handleGoogleLogout(request);
  }
  return fallback(request);
}

export const Route = createFileRoute("/api/auth/$")({
  server: {
    handlers: {
      GET: ({ request }) => intercept(request, (req) => auth.handler(req)),
      POST: ({ request }) => intercept(request, (req) => auth.handler(req)),
    },
  },
});