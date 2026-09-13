import type { Currency } from "@/lib/games-catalog";

export type WalletAction = "balance" | "bet" | "win" | "rollback";

export type SeamlessRequest = {
  action: WalletAction;
  userId: string;
  currency: Currency | string;
  amount?: number;
  txnId?: string;
  gameId?: string;
  roundId?: string;
};

export type SeamlessResponse = {
  ok: boolean;
  balance?: number;
  txnId?: string;
  error?: string;
};

export type LaunchRequest = {
  gameId: string;
  userId: string;
  currency: string;
  email?: string | null;
  language?: string;
  returnUrl?: string;
};

export type LaunchResponse = {
  url?: string;
  html?: string;
  error?: string;
};

export type RemoteGame = {
  id: string;
  slug?: string;
  title: string;
  provider: string;
  /** Provider/studio logo URL when the hub supplies one (else curated map). */
  providerLogo?: string;
  category?: string;
  cover?: string;
  rtp?: number;
  live?: boolean;
  featured?: boolean;
  isNew?: boolean;
  gameType?: string;
};
