import { dbSource, getPglite } from "@/lib/db";
import { env } from "@/lib/env.server";
import type { PrismaClient } from "@/generated/prisma/client";

const globalRef = globalThis as typeof globalThis & {
  __tolsPrisma__?: Promise<PrismaClient>;
};

function remotePostgresOk(): boolean {
  const url = env("DATABASE_URL");
  if (!url) return false;
  try {
    const u = new URL(url.replace(/^postgres:\/\//, "postgresql://"));
    const user = decodeURIComponent(u.username || "").trim();
    if (!user.includes(".")) {
      console.warn(
        "[prisma] DATABASE_URL user must be postgres.<project-ref>. Using PGLite.",
      );
      return false;
    }
    return true;
  } catch {
    return false;
  }
}

export async function getPrisma(): Promise<PrismaClient> {
  if (typeof window !== "undefined") {
    throw new Error("Prisma is server-only");
  }
  globalRef.__tolsPrisma__ ??= createPrisma().catch((err) => {
    globalRef.__tolsPrisma__ = undefined;
    throw err;
  });
  return globalRef.__tolsPrisma__;
}

async function createPrisma(): Promise<PrismaClient> {
  const { PrismaClient } = await import("@/generated/prisma/client");
  const useRemote = dbSource === "neon" && remotePostgresOk();
  if (useRemote) {
    const { PrismaPg } = await import("@prisma/adapter-pg");
    const url = env("DATABASE_URL");
    if (!url) throw new Error("DATABASE_URL required for Prisma");
    const client = new PrismaClient({ adapter: new PrismaPg({ connectionString: url }) });
    try {
      await client.$queryRaw`select 1`;
      return client;
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      if (/28P01|password authentication failed|credentials for `postgres`/i.test(msg)) {
        console.warn("[prisma] remote auth failed — PGLite");
        await client.$disconnect().catch(() => undefined);
      } else {
        throw err;
      }
    }
  }
  const { PrismaPGlite } = await import("pglite-prisma-adapter");
  const pg = await getPglite();
  return new PrismaClient({ adapter: new PrismaPGlite(pg) });
}
