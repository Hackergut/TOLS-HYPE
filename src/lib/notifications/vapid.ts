/**
 * Public VAPID key — safe to ship to the browser for PushManager.subscribe.
 *
 * Resolution order: `VAPID_PUBLIC_KEY` (server) → `VITE_VAPID_PUBLIC_KEY`
 * (browser) → legacy baked-in key (keeps existing subscriptions working).
 *
 * SECURITY: the legacy key pair's private half used to live in source.
 * Treat it as compromised: generate a fresh pair for production
 * (`npx web-push generate-vapid-keys`) and set both env vars.
 */
const LEGACY_PUBLIC_KEY =
  "BCy1-yzmmgSJSw-1eIBZjlzpk62FK-FMk2JI93rkm7-aEqvEDYWYHIFDxHdI75PA4DFIYvidlyQdokIseT6ph4U";

function readEnv(key: string): string | undefined {
  try {
    const fromProcess =
      typeof process !== "undefined" ? process.env?.[key]?.trim() : undefined;
    if (fromProcess) return fromProcess;
  } catch {
    /* not a node runtime */
  }
  try {
    const vite = (import.meta as unknown as { env?: Record<string, string | undefined> }).env;
    const v = vite?.[key]?.trim();
    if (v) return v;
  } catch {
    /* no import.meta.env */
  }
  return undefined;
}

export const VAPID_PUBLIC_KEY =
  readEnv("VAPID_PUBLIC_KEY") ?? readEnv("VITE_VAPID_PUBLIC_KEY") ?? LEGACY_PUBLIC_KEY;

export const VAPID_SUBJECT = readEnv("VAPID_SUBJECT") ?? "mailto:support@tols.fun";
