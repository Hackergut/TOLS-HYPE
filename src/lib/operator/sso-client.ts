import { bridgePlayerSso, type CasinoSsoResult } from "./sso";

const SYNC_KEY = "tols.casino-sso.synced";

/** Stamp tols_session on the casino origin after Better Auth login. */
export async function syncCasinoSession(force = false): Promise<CasinoSsoResult | null> {
  if (typeof window === "undefined") return null;
  if (!force) {
    try {
      if (sessionStorage.getItem(SYNC_KEY) === "1") return { ok: true };
    } catch {
      /* ignore */
    }
  }

  const result = await bridgePlayerSso();
  if (!result?.ok || !result.ssoUrl) return result;

  try {
    const res = await fetch(result.ssoUrl, {
      method: "GET",
      credentials: "include",
      headers: { Accept: "application/json" },
      cache: "no-store",
    });
    if (!res.ok) throw new Error(`SSO ${res.status}`);
  } catch {
    await new Promise<void>((resolve) => {
      const frame = document.createElement("iframe");
      frame.src = result.ssoUrl!;
      frame.title = "casino-sso";
      frame.setAttribute("aria-hidden", "true");
      frame.style.cssText = "position:absolute;width:0;height:0;border:0;visibility:hidden";
      const done = () => {
        frame.remove();
        resolve();
      };
      frame.onload = done;
      document.body.appendChild(frame);
      window.setTimeout(done, 4000);
    });
  }

  try {
    sessionStorage.setItem(SYNC_KEY, "1");
  } catch {
    /* ignore */
  }
  return result;
}

export function clearCasinoSessionSync() {
  if (typeof window === "undefined") return;
  try {
    sessionStorage.removeItem(SYNC_KEY);
  } catch {
    /* ignore */
  }
}
