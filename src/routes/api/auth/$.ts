import { createFileRoute } from "@tanstack/react-router";
import { auth } from "@/lib/auth/server";
import {
  handleGoogleCallback,
  handleGoogleDiag,
  handleGoogleLogout,
  handleGoogleMe,
  handleGoogleStart,
} from "@/lib/auth/google-handlers.server";

function googlePath(request: Request): string {
  return new URL(request.url).pathname.replace(/\/+$/, "") || "/";
}

async function intercept(request: Request, fallback: (req: Request) => Promise<Response> | Response) {
  const path = googlePath(request);
  if (path === "/api/auth/google") return handleGoogleStart(request);
  if (path === "/api/auth/google/callback") return handleGoogleCallback(request);
  if (path === "/api/auth/google/diag") return handleGoogleDiag();
  if (path === "/api/auth/me") return handleGoogleMe(request);
  if (path === "/api/auth/logout" || path === "/api/auth/google/logout") return handleGoogleLogout(request);
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
