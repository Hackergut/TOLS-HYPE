import { operatorServer } from "@/lib/operator/env.server";
import { env } from "@/lib/env.server";

/**
 * Single source of truth for this skin's public origin.
 * Delegates to operatorServer() — do NOT fork the default here
 * (it previously drifted to tols-plum.vercel.app).
 */
export function casinoOrigin() {
  return operatorServer().casinoOrigin;
}

export async function buyCryptoWidget() {
  return {
    provider: env("NEXT_PUBLIC_BUY_PROVIDER") ?? env("BUY_PROVIDER") ?? "moonpay",
    publishable: env("NEXT_PUBLIC_BUY_API_KEY") ?? env("BUY_API_KEY") ?? "",
  };
}
