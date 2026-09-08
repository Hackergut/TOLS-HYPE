import type { LaunchRequest, LaunchResponse, RemoteGame, SeamlessRequest } from "@/lib/operator/types";

/** Plug a new aggregator by implementing this and registering it in resolveAdapter(). */
export type AggregatorKind =
  | "local"
  | "rest"
  | "softswiss"
  | "slotegrator"
  | "legacy"
  | "flexrix"
  | "eurovirtuals"
  | "tols-next"
  | "governance";

export type AggregatorAdapter = {
  id: AggregatorKind;
  label: string;
  listGames: () => Promise<RemoteGame[]>;
  launch: (req: LaunchRequest) => Promise<LaunchResponse>;
  /** Map any inbound webhook JSON into the TOLS seamless wallet shape. */
  parseWallet: (body: unknown) => SeamlessRequest | null;
};

export const AGGREGATOR_KINDS: AggregatorKind[] = [
  "local",
  "tols-next",
  "flexrix",
  "eurovirtuals",
  "governance",
  "rest",
  "softswiss",
  "slotegrator",
  "legacy",
];
