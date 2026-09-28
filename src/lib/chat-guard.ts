/** Professional chat limits. Pure so the panel and any later server check share one rule set. */

const LINK = /\b(?:https?:\/\/|www\.|discord\.gg\/|t\.me\/|bit\.ly\/)\S+/i;
const REPEAT = /(.)\1{7,}/;
const SPAM = /\b(?:airdrop|giveaway|free\s*money|dm\s*me|whatsapp|telegram|nitro|seed\s*phrase)\b/i;
const EMOJI = /\p{Extended_Pictographic}/gu;

export type ChatGuard = { ok: true; text: string } | { ok: false; reason: string };

export function screenChat(
  raw: string,
  opts: { now: number; ownTimes: number[]; lastOwn: string },
): ChatGuard {
  const text = raw.replace(/\s+/g, " ").trim();
  if (!text) return { ok: false, reason: "Empty message" };
  if (text.length > 180) return { ok: false, reason: "180 characters max" };
  if (LINK.test(text)) return { ok: false, reason: "Links are blocked" };
  if (SPAM.test(text)) return { ok: false, reason: "Promo spam is blocked" };
  if (REPEAT.test(text)) return { ok: false, reason: "Repeated characters" };
  const mentions = text.match(/@\S+/g)?.length ?? 0;
  if (mentions > 3) return { ok: false, reason: "Too many mentions" };
  const emoji = text.match(EMOJI)?.length ?? 0;
  if (emoji > 8) return { ok: false, reason: "Too many emoji" };
  const letters = text.replace(/[^a-z]/gi, "");
  if (letters.length > 12 && letters === letters.toUpperCase()) {
    return { ok: false, reason: "Caps lock is limited" };
  }
  if (opts.lastOwn && opts.lastOwn.toLowerCase() === text.toLowerCase()) {
    return { ok: false, reason: "Duplicate message" };
  }
  const recent = opts.ownTimes.filter((t) => opts.now - t < 20_000);
  if (recent.length >= 5) return { ok: false, reason: "Slow down — 20s lock" };
  const last = opts.ownTimes[opts.ownTimes.length - 1] ?? 0;
  if (opts.now - last < 3_000) return { ok: false, reason: "Slow mode · 3s" };
  return { ok: true, text };
}
