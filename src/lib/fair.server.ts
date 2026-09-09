import { createHash, createHmac, randomBytes } from "node:crypto";
import { getSql } from "@/lib/db";
import { floatsFromDigest, type FairProof } from "@/lib/fair";

export type FairTake = FairProof & { floats: number[]; serverSeed?: never };

function hashSeed(seed: string) {
  return createHash("sha256").update(seed).digest("hex");
}

function hmacDigest(serverSeed: string, clientSeed: string, nonce: number, chunk = 0) {
  return createHmac("sha256", serverSeed).update(`${clientSeed}:${nonce}:${chunk}`).digest();
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

export async function takeFair(userId: string, count = 8): Promise<FairTake> {
  const sql = await getSql();
  const row = await loadOrCreate(userId);
  const nonce = row.nonce;
  const floats: number[] = [];
  let chunk = 0;
  while (floats.length < count) {
    const digest = hmacDigest(row.server_seed, row.client_seed, nonce, chunk);
    floats.push(...floatsFromDigest(new Uint8Array(digest), 8));
    chunk += 1;
  }
  await sql`update fair_seeds set nonce = ${nonce + 1} where user_id = ${userId}`;
  return {
    serverHash: row.server_hash,
    clientSeed: row.client_seed,
    nonce,
    floats: floats.slice(0, count),
  };
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
