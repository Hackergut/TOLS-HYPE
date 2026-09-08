export const PLATFORM_SKILLS = [
  {
    id: "originals-rtp",
    label: "Provably fair originals",
    hook: "src/lib/casino-api.ts",
    env: "none",
  },
  {
    id: "tols-next",
    label: "Live casino backend (Hackergut/tols-casino-next)",
    hook: "src/lib/operator/adapters/tols-next.ts",
    env: "CASINO_ORIGIN=https://www.tols.fun + AGGREGATOR_KIND=tols-next",
  },
  {
    id: "flexrix",
    label: "Flexrix native slots / live",
    hook: "CASINO_ORIGIN/api/flexrix/launch + /api/flexrix/callback",
    env: "FLEXRIX_API_BASE, FLEXRIX_MERCHANT_KEY, FLEXRIX_API_SECRET",
  },
  {
    id: "eurovirtuals",
    label: "EuroVirtuals / Betkraft",
    hook: "src/lib/operator/adapters/eurovirtuals.ts",
    env: "EV_API_BASE, EV_API_KEY, EV_APP_KEY",
  },
  {
    id: "governance",
    label: "Governance tower (JWT RS256 + HMAC)",
    hook: "src/lib/operator/governance.ts",
    env: "GOVERNANCE_TOWER_URL=https://gov.tols.fun + GOVERNANCE_BRIDGE_SECRET + PLATFORM_JWT_PUBLIC_KEY",
  },
  {
    id: "payments",
    label: "On-chain deposits + Moonpay + withdrawals",
    hook: "src/lib/operator/payments.ts",
    env: "CASINO_ORIGIN + NEXT_PUBLIC_BUY_API_KEY / MOONPAY_SECRET_KEY",
  },
  {
    id: "seamless-wallet",
    label: "Vendor seamless bet / win / rollback",
    hook: "POST /api/operator/wallet ↔ CASINO /api/vendor/callback",
    env: "VENDOR_CALLBACK_SECRET",
  },
  {
    id: "skin-tokens",
    label: "Brand restyle",
    hook: "src/lib/operator/skin.ts",
    env: "VITE_SKIN_PRIMARY, VITE_SKIN_LIME, VITE_OPERATOR_NAME",
  },
] as const;
