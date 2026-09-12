import { env } from "@/lib/env.server";

/** Cashier is this skin's wallet (play-money until chain keys are on tols-verc). */
export function casinoOrigin() {
  return (env("CASINO_ORIGIN") ?? env("APP_URL") ?? "https://tols-plum.vercel.app").replace(/\/$/, "");
}

export async function buyCryptoWidget() {
  return {
    provider: env("NEXT_PUBLIC_BUY_PROVIDER") ?? env("BUY_PROVIDER") ?? "moonpay",
    publishable: env("NEXT_PUBLIC_BUY_API_KEY") ?? env("BUY_API_KEY") ?? "",
  };
}
