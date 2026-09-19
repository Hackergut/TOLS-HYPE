/** Telegram Mini App / narrow chrome detection (client-only). */
export const TG_SURFACE = "#0c0618";

export function isTelegramClient(): boolean {
  if (typeof window === "undefined") return false;
  const wa = window.Telegram?.WebApp;
  if (wa?.initData) return true;
  try {
    if (new URLSearchParams(window.location.search).get("tg") === "1") return true;
  } catch {
    /* ignore */
  }
  return false;
}

export function isNarrowLobby(maxPx = 430): boolean {
  if (typeof window === "undefined") return false;
  try {
    return window.matchMedia(`(max-width: ${maxPx}px)`).matches;
  } catch {
    return window.innerWidth <= maxPx;
  }
}

/** Hide desktop chrome for TG / ?tg=1 / narrow lobby (~390). */
export function shouldHideDesktopChrome(): boolean {
  return isTelegramClient() || isNarrowLobby();
}

export function applyTelegramDocumentChrome(hide: boolean): void {
  if (typeof document === "undefined") return;
  const root = document.documentElement;
  if (hide) {
    root.dataset.tgChrome = "1";
    root.style.setProperty("--tg-surface", TG_SURFACE);
    root.style.backgroundColor = TG_SURFACE;
    if (document.body) document.body.style.backgroundColor = TG_SURFACE;
  } else {
    delete root.dataset.tgChrome;
  }
}
