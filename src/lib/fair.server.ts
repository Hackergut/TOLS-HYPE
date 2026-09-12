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
  await sql`
    insert into fair_seeds (user_id, server_seed, server_hash, client_seed, nonce)
    values (${userId}, ${serverSeed}, ${serverHash}, ${clientSeed}, 0)
  `;
  return { server_seed: serverSeed, server_hash: serverHash, client_seed: clientSeed, nonce: 0 };
}

export async function takeFairRng(userId: string): Promise<FairRng> {
  const sql = await getSql();
  const row = await loadOrCreate(userId);
  const nonce = row.nonce;
  await sql`update fair_seeds set nonce = ${nonce + 1} where user_id = ${userId}`;
  return new FairRng(row.server_seed, row.client_seed, nonce, row.server_hash);
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
