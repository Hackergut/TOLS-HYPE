import { createHash, createHmac, randomBytes } from "node:crypto";
import { getSql } from "@/lib/db";
import {
  deriveUnbiasedInt,
  deriveUnit,
  type FairProof,
} from "@/lib/fair";

export type FairTake = FairProof & { floats: number[]; serverSeed?: never };

function hashSeed(seed: string) {
  return createHash("sha256").update(seed).digest("hex");
}

export function hmacBlock(
  serverSeed: string,
  clientSeed: string,
  nonce: number,
  counter: number,
): Uint8Array {
  return new Uint8Array(
    createHmac("sha256", serverSeed).update(`${clientSeed}:${nonce}:${counter}`).digest(),
  );
}

export class FairRng {
  counter = 0;

  constructor(
    private readonly serverSeed: string,
    readonly clientSeed: string,
    readonly nonce: number,
    readonly serverHash: string,
  ) {}

  private block = (counter: number) =>
    hmacBlock(this.serverSeed, this.clientSeed, this.nonce, counter);

  /** Unbiased integer in `[0, rangeMax)`. */
  int(rangeMax: number): number {
    const drawn = deriveUnbiasedInt(this.block, rangeMax, this.counter);
    this.counter = drawn.counter + 1;
    return drawn.value;
  }

  /** Uniform `[0, 1)` from 53 mantissa bits. */
  unit(): number {
    const drawn = deriveUnit(this.block, this.counter);
    this.counter = drawn.counter + 1;
    return drawn.value;
  }

  floats(count: number): number[] {
    return Array.from({ length: count }, () => this.unit());
  }

  proof(): FairProof {
    return {
      serverHash: this.serverHash,
      clientSeed: this.clientSeed,
      nonce: this.nonce,
    };
  }
}

async function loadOrCreate(userId: string) {
  const sql = await getSql();
  const rows = await sql<{
    server_seed: string;
    server_hash: string;
    client_seed: string;
    nonce: number;
  }>`
    select server_seed, server_hash, client_seed, nonce from fair_seeds where user_id = ${userId}
  `;
  if (rows[0]) return rows[0];
  const serverSeed = randomBytes(32).toString("hex");
  const clientSeed = randomBytes(8).toString("hex");
  const serverHash = hashSeed(serverSeed);
  // Two first-time bets can race this insert — the loser must read, not crash
  // on the primary-key conflict.
  await sql`
    insert into fair_seeds (user_id, server_seed, server_hash, client_seed, nonce)
    values (${userId}, ${serverSeed}, ${serverHash}, ${clientSeed}, 0)
    on conflict (user_id) do nothing
  `;
  const again = await sql<{
    server_seed: string;
    server_hash: string;
    client_seed: string;
    nonce: number;
  }>`
    select server_seed, server_hash, client_seed, nonce from fair_seeds where user_id = ${userId}
  `;
  const row = again[0];
  if (!row) throw new Error("fair seed init failed");
  return row;
}

type FairSeedRow = {
  used_nonce: number;
  server_seed: string;
  server_hash: string;
  client_seed: string;
};

/** Atomically consume the next nonce; returns the nonce this call owns. */
async function consumeNonce(userId: string): Promise<FairSeedRow | undefined> {
  const sql = await getSql();
  // RETURNING sees the post-update row, so the nonce this call draws from is
  // the pre-increment value (nonce - 1). Concurrent bets each get their own
  // nonce instead of replaying identical floats from a shared one.
  const rows = await sql<FairSeedRow>`
    update fair_seeds set nonce = nonce + 1
    where user_id = ${userId}
    returning nonce - 1 as used_nonce, server_seed, server_hash, client_seed
  `;
  return rows[0];
}

export async function takeFairRng(userId: string): Promise<FairRng> {
  let row = await consumeNonce(userId);
  if (!row) {
    await loadOrCreate(userId);
    row = await consumeNonce(userId);
  }
  if (!row) throw new Error("fair seed unavailable");
  return new FairRng(row.server_seed, row.client_seed, row.used_nonce, row.server_hash);
}

export async function takeFair(userId: string, count = 8): Promise<FairTake> {
  const rng = await takeFairRng(userId);
  return { ...rng.proof(), floats: rng.floats(count) };
}

export async function fairSnapshot(userId: string): Promise<FairProof> {
  const row = await loadOrCreate(userId);
  return {
    serverHash: row.server_hash,
    clientSeed: row.client_seed,
    nonce: row.nonce,
  };
}

export async function applyClientSeed(userId: string, clientSeed: string) {
  await loadOrCreate(userId);
  const sql = await getSql();
  const seed = clientSeed.replace(/[^a-zA-Z0-9_-]/g, "").slice(0, 64);
  await sql`update fair_seeds set client_seed = ${seed} where user_id = ${userId}`;
  return { clientSeed: seed };
}

export async function rotateFairSeed(userId: string) {
  const prev = await loadOrCreate(userId);
  const next = randomBytes(32).toString("hex");
  const nextHash = hashSeed(next);
  const sql = await getSql();
  await sql`
    update fair_seeds
    set server_seed = ${next}, server_hash = ${nextHash}, nonce = 0
    where user_id = ${userId}
  `;
  return {
    revealedSeed: prev.server_seed,
    revealedHash: prev.server_hash,
    nextHash,
    clientSeed: prev.client_seed,
  };
}
