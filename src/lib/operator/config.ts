/** White-label operator config. Swap backends with env — no UI rewrites. */

export type OperatorBackend =
  | "local"
  | "sql"
  | "prisma"
  | "supabase"
  | "governance"
  | "aggregator";

export const OPERATOR_BACKENDS: OperatorBackend[] = [
  "local",
  "sql",
  "prisma",
  "supabase",
  "governance",
  "aggregator",
];

function vite(key: string): string | undefined {
  const env = import.meta.env as Record<string, string | undefined>;
  const v = env[key]?.trim();
  return v || undefined;
}

export const operator = {
  name: vite("VITE_OPERATOR_NAME") ?? "TOLS",
  legalName: vite("VITE_OPERATOR_LEGAL") ?? "TOLS B.V.",
  license: vite("VITE_OPERATOR_LICENSE") ?? "",
  supportEmail: vite("VITE_OPERATOR_SUPPORT") ?? "support@tols.fun",
  backend: (vite("VITE_OPERATOR_BACKEND") as OperatorBackend) || "local",
  aggregatorKind: (vite("VITE_AGGREGATOR_KIND") as import("@/lib/operator/adapter").AggregatorKind) || "tols-next",
  aggregatorUrl: vite("VITE_AGGREGATOR_URL") ?? "",
  supabaseUrl: vite("VITE_SUPABASE_URL") ?? "",
  governanceUrl: vite("VITE_GOVERNANCE_URL") ?? "https://gov.tols.fun",
  casinoOrigin: (vite("VITE_CASINO_ORIGIN") ?? "https://www.tols.fun").replace(/\/$/, ""),
};

export function backendLabel(kind: OperatorBackend) {
  switch (kind) {
    case "sql":
      return "Postgres / SQL";
    case "prisma":
      return "Prisma";
    case "supabase":
      return "Supabase";
    case "governance":
      return "Governance API";
    case "aggregator":
      return "Game aggregator";
    default:
      return "Local originals";
  }
}
