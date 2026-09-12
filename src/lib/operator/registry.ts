import type { AggregatorAdapter, AggregatorKind } from "@/lib/operator/adapter";
import { localAdapter } from "@/lib/operator/adapters/local";
import { restAdapter } from "@/lib/operator/adapters/rest";
import { softswissAdapter } from "@/lib/operator/adapters/softswiss";
import { slotegratorAdapter } from "@/lib/operator/adapters/slotegrator";
import { legacyAdapter } from "@/lib/operator/adapters/legacy";
import { flexrixAdapter } from "@/lib/operator/adapters/flexrix";
import { eurovirtualsAdapter } from "@/lib/operator/adapters/eurovirtuals";
import { tolsNextAdapter } from "@/lib/operator/adapters/tols-next";
import { governanceAdapter } from "@/lib/operator/adapters/governance";
import { operatorServer } from "@/lib/operator/env.server";

const ADAPTERS: Record<AggregatorKind, AggregatorAdapter> = {
  local: localAdapter,
  rest: restAdapter,
  softswiss: softswissAdapter,
  slotegrator: slotegratorAdapter,
  legacy: legacyAdapter,
  flexrix: flexrixAdapter,
  eurovirtuals: eurovirtualsAdapter,
  "tols-next": tolsNextAdapter,
  governance: governanceAdapter,
};

export function resolveAdapter(): AggregatorAdapter {
  const kind = (operatorServer().aggregatorKind || "flexrix") as AggregatorKind;
  return ADAPTERS[kind] ?? localAdapter;
}

export function listAdapters() {
  return Object.values(ADAPTERS).map((a) => ({ id: a.id, label: a.label }));
}
