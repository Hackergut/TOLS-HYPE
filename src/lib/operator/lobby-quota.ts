const TURKISH_LIVE_RE =
  /t[uü]rk(?:çe|ce)?|turkish|t[uü]rkiye|klasik|\balt[iı]n\b|saray\s*rulet|futbol\s*st[uü]dyosu|istanbul|t-rk-e/i;

export function isTurkishLiveTable(g: { title?: string; slug?: string; live?: boolean; gameType?: string }): boolean {
  const type = String(g.gameType || "");
  const live = Boolean(g.live) || /live|game_show/i.test(type);
  if (!live) return false;
  return TURKISH_LIVE_RE.test(`${g.title || ""} ${g.slug || ""}`);
}

export function isBlockedStudio(provider: string, title: string): boolean {
  const blob = `${provider} ${title}`;
  return /nolimit/i.test(blob);
}

const SLOTS_PER_OPERATOR = 30;
const LOBBY_CAP = 800;

/** Illustrated hub rows only — ≥30 per studio, never the full dump. */
export function lobbyQuota<T extends { provider: string; title: string; cover?: string; live?: boolean; gameType?: string; slug?: string }>(
  games: T[],
): T[] {
  const per = new Map<string, number>();
  const out: T[] = [];
  for (const g of games) {
    if (isBlockedStudio(g.provider, g.title)) continue;
    if (isTurkishLiveTable(g)) continue;
    if (!g.cover || g.cover.length < 12) continue;
    const key = g.provider.trim().toLowerCase() || "studio";
    const n = per.get(key) ?? 0;
    if (n >= SLOTS_PER_OPERATOR) continue;
    per.set(key, n + 1);
    out.push(g);
    if (out.length >= LOBBY_CAP) break;
  }
  return out;
}
