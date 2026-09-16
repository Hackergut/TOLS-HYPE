import { useEffect } from "react";
import {
  TG_SURFACE,
  applyTelegramDocumentChrome,
  shouldHideDesktopChrome,
} from "@/lib/telegram/chrome";

interface TelegramWebAppSdk {
  initData?: string;
  ready?: () => void;
  expand?: () => void;
  setHeaderColor?: (c: string) => void;
  setBackgroundColor?: (c: string) => void;
  disableVerticalSwipes?: () => void;
  enableClosingConfirmation?: () => void;
  version?: string;
  platform?: string;
}

declare global {
  interface Window {
    Telegram?: { WebApp?: TelegramWebAppSdk };
  }
}

const AUTH_FLAG = "tols_tg_session";

function versionAtLeast(client: string | undefined, min: string): boolean {
  if (!client) return false;
  const a = client.split(".").map((n) => parseInt(n, 10) || 0);
  const b = min.split(".").map((n) => parseInt(n, 10) || 0);
  for (let i = 0; i < Math.max(a.length, b.length); i++) {
    const d = (a[i] ?? 0) - (b[i] ?? 0);
    if (d !== 0) return d > 0;
  }
  return true;
}

function configure(wa: TelegramWebAppSdk): void {
  try {
    wa.ready?.();
  } catch {}
  try {
    wa.expand?.();
  } catch {}
  if (versionAtLeast(wa.version, "6.1")) {
    try {
      wa.setHeaderColor?.(TG_SURFACE);
    } catch {}
    try {
      wa.setBackgroundColor?.(TG_SURFACE);
    } catch {}
  }
  if (versionAtLeast(wa.version, "7.7")) {
    try {
      wa.disableVerticalSwipes?.();
    } catch {}
  }
  if (versionAtLeast(wa.version, "6.2")) {
    try {
      wa.enableClosingConfirmation?.();
    } catch {}
  }
}

async function authenticate(initData: string): Promise<void> {
  if (!initData) return;
  if (sessionStorage.getItem(AUTH_FLAG) === "1") return;
  try {
    const res = await fetch("/api/auth/telegram/miniapp", {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ initData }),
    });
    if (!res.ok) return;
    sessionStorage.setItem(AUTH_FLAG, "1");
    window.location.reload();
  } catch {
    /* retry on next mount */
  }
}

function syncChrome(): void {
  applyTelegramDocumentChrome(shouldHideDesktopChrome());
}

export function TelegramWebApp() {
  useEffect(() => {
    let cancelled = false;
    syncChrome();
    const mq = window.matchMedia("(max-width: 430px)");
    const onMq = () => syncChrome();
    mq.addEventListener?.("change", onMq);
    window.addEventListener("resize", onMq);

    const boot = () => {
      if (cancelled) return true;
      syncChrome();
      const wa = window.Telegram?.WebApp;
      if (!wa) return false;
      configure(wa);
      syncChrome();
      void authenticate(wa.initData ?? "");
      return true;
    };
    if (boot()) {
      return () => {
        cancelled = true;
        mq.removeEventListener?.("change", onMq);
        window.removeEventListener("resize", onMq);
      };
    }
    let waited = 0;
    const timer = setInterval(() => {
      waited += 200;
      if (boot() || waited >= 4000) clearInterval(timer);
    }, 200);
    return () => {
      cancelled = true;
      clearInterval(timer);
      mq.removeEventListener?.("change", onMq);
      window.removeEventListener("resize", onMq);
    };
  }, []);
  return null;
}
