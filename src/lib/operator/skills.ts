/** Internal skill ids only. Never ship env names or HMAC details to the client. */
export const PLATFORM_SKILLS = [
  { id: "originals-rtp", label: "Provably fair originals" },
  { id: "tols-next", label: "Casino ledger" },
  { id: "flexrix", label: "Studio slots / live" },
  { id: "eurovirtuals", label: "Live tables" },
  { id: "governance", label: "Platform governance" },
  { id: "payments", label: "Deposits and withdrawals" },
  { id: "player-sso", label: "Player session" },
  { id: "seamless-wallet", label: "Seamless wallet" },
  { id: "skin-tokens", label: "Brand" },
] as const;
