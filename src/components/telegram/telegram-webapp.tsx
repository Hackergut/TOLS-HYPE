import { useEffect } from "react";

interface TelegramWebAppSdk {
  initData?: string;
  ready?: () => void;
  expand?: () => void;
  setHeaderColor?: (c: string) => void;
  setBackgroundColor?: (c: string) => void;
  disableVerticalSwipes?: () => void;
  enableClosingConfirmation?: () => void;
  version?: string;
}

declare global {
  interface Window {
    Telegram?: { WebApp?: TelegramWebAppSdk };
  }
}

const SURFACE = "#0c0618";
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
      wa.setHeaderColor?.(SURFACE);
    } catch {}
    try {
      wa.setBackgroundColor?.(SURFACE);
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

export function TelegramWebApp() {
  useEffect(() => {
    let cancelled = false;
    const boot = () => {
      if (cancelled) return true;
      const wa = window.Telegram?.WebApp;
      if (!wa) return false;
      configure(wa);
      void authenticate(wa.initData ?? "");
      return true;
    };
    if (boot()) return;
    let waited = 0;
    const timer = setInterval(() => {
      waited += 200;
      if (boot() || waited >= 4000) clearInterval(timer);
    }, 200);
    return () => {
      cancelled = true;
      clearInterval(timer);
    };
  }, []);
  return null;
}
