import { useEffect, useState } from "react";
import { authClient } from "./client";

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

/** Fixed seat for the Grok sandbox preview only. Not used on the deployed site. */
export const PREVIEW_PLAYER: AppUser = {
  id: "preview-player",
  displayName: "Grok",
  primaryEmail: "preview@tols.local",
  profileImageUrl: null,
  isDevFallback: false,
};

export function isRealPlayer(user: AppUser | null | undefined): boolean {
  return Boolean(user && !user.isDevFallback);
}

function inPreviewDev(): boolean {
  if (!import.meta.env.DEV || typeof window === "undefined") return false;
  const host = window.location.hostname;
  if (host === "tols.fun" || host === "www.tols.fun" || host.endsWith(".vercel.app")) return false;
  return true;
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
 * Real identity is `/api/auth/me` and the Better Auth session.
 * Production guests stay signed out. This dev preview uses the fixed Grok seat.
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
  // This dev server only. The deployed bundle has import.meta.env.DEV false,
  // so tols.fun still asks for Login / Sign up.
  if (inPreviewDev()) return { user: PREVIEW_PLAYER, isPending: false };
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
