import { createHmac, timingSafeEqual } from "node:crypto";
import { env } from "@/lib/env.server";

export type CashHuntClaim = {
  userId: string;
  gameId: string;
  currency: string;
  stake: number;
  topMulti: number;
  tiles: number[];
  exp: number;
};

function secret() {
  return env("CRAZY_ROUND_SECRET") ?? env("BETTER_AUTH_SECRET") ?? "tols-crazy-round-demo-secret";
}

function sign(body: string) {
  return createHmac("sha256", secret()).update(body).digest("base64url");
}

/** Stateless signed claim so the Cash Hunt reveal can settle one tick later. */
export function sealCashHuntClaim(claim: Omit<CashHuntClaim, "exp">, ttlMs = 5 * 60_000) {
  const payload: CashHuntClaim = { ...claim, exp: Date.now() + ttlMs };
  const body = Buffer.from(JSON.stringify(payload), "utf8").toString("base64url");
  return `${body}.${sign(body)}`;
}

export function openCashHuntClaim(token: string): CashHuntClaim | null {
  const [body, tag] = token.split(".");
  if (!body || !tag) return null;
  const expected = sign(body);
  const a = Buffer.from(tag);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !timingSafeEqual(a, b)) return null;
  try {
    const claim = JSON.parse(Buffer.from(body, "base64url").toString("utf8")) as CashHuntClaim;
    if (!claim || typeof claim.exp !== "number" || claim.exp < Date.now()) return null;
    if (!Array.isArray(claim.tiles)) return null;
    return claim;
  } catch {
    return null;
  }
}
