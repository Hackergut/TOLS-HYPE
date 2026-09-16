/** Detect Telegram Mini App / compact mobile casino chrome. */

export function isTelegramFrame(): boolean {
  if (typeof window === "undefined") return false;
  try {
    if (window.Telegram?.WebApp?.initData) return true;
  } catch {
    /* ignore */
  }
  const q = new URLSearchParams(window.location.search);
  if (q.has("tg") || q.has("tgWebAppStartParam")) return true;
  return /Telegram/i.test(navigator.userAgent);
}

export function applyTelegramFrameClass(): void {
  if (typeof document === "undefined") return;
  const on = isTelegramFrame() || window.matchMedia("(max-width: 640px)").matches;
  document.documentElement.classList.toggle("tg-miniapp", isTelegramFrame());
  document.documentElement.classList.toggle("tg-compact", on);
}
