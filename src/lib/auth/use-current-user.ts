import { useEffect, useState } from "react";
import { authClient, authEnabled } from "./client";

/** Normalized user shape used across the app, auth on or off. */
export type AppUser = {
  id: string;
  displayName: string | null;
  primaryEmail: string | null;
  profileImageUrl: string | null;
  /** True when this is the sandbox/dev fallback (auth not configured). */
  isDevFallback: boolean;
};

/**
 * Sandbox-only fallback. NEVER inject this on tols.fun — it makes SignedOut
 * hide Login/Sign up and pretends every visitor is already signed in.
 */
export const DEV_USER: AppUser = {
  id: "dev-user",
  displayName: "Dev User",
  primaryEmail: "dev@example.com",
  profileImageUrl: null,
  isDevFallback: true,
};

export function isRealPlayer(user: AppUser | null | undefined): boolean {
  return Boolean(user && !user.isDevFallback);
}

function inGrokSandbox(): boolean {
  return typeof window !== "undefined" && window.location.hostname.endsWith(".grok-sandbox.com");
}

/** `useCurrentUserState()` result: the user plus the session-loading flag. */
export type CurrentUserState = {
  /** The user — `null` BOTH while the session loads and when signed out. */
  user: AppUser | null;
  /** True while the session is still resolving — don't treat `user: null` as signed out yet. */
  isPending: boolean;
};

function useNativeSession(): CurrentUserState {
  const [user, setUser] = useState<AppUser | null>(null);
  const [isPending, setPending] = useState(true);
  useEffect(() => {
    let cancelled = false;
    fetch("/api/auth/me", { credentials: "include" })
      .then((r) => r.json())
      .then((body: { user?: AppUser | null }) => {
        if (cancelled) return;
        if (body?.user?.id) setUser({ ...body.user, isDevFallback: false });
      })
      .catch(() => undefined)
      .finally(() => {
        if (!cancelled) setPending(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);
  return { user, isPending };
}

/**
 * Current user + loading state.
 *
 * Real identity is `/api/auth/me` (`tols_session` from Google/Telegram) and,
 * when `VITE_AUTH_ENABLED` is not `"false"`, Better Auth email session.
 * Production guests are signed **out** (Login + Sign up). The shared DEV_USER
 * is only for the Grok sandbox preview.
 */
export function useCurrentUserState(): CurrentUserState {
  const native = useNativeSession();
  const { data, isPending } = authClient.useSession();
  if (native.user) return { user: native.user, isPending: false };
  const user = data?.user;
  if (user) {
    return {
      user: {
        id: user.id,
        displayName: user.name ?? null,
        primaryEmail: user.email ?? null,
        profileImageUrl: user.image ?? null,
        isDevFallback: false,
      },
      isPending: false,
    };
  }
  if (!authEnabled && inGrokSandbox()) return { user: DEV_USER, isPending: false };
  return { user: null, isPending: native.isPending || isPending };
}

/**
 * Convenience view of `useCurrentUserState().user` for display (e.g.
 * `user?.displayName ?? "Guest"`). NOTE: `null` means *loading OR signed out* —
 * for redirects/guards use `useCurrentUserState()` and check `isPending`.
 */
export function useCurrentUser(): AppUser | null {
  return useCurrentUserState().user;
}
