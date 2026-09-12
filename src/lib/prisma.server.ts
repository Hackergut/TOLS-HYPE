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
    const user = decodeURIComponent(u.username || "");
    if (user === "postgres" && /supabase\.com|pooler\.supabase/i.test(u.hostname)) {
      console.warn(
        "[prisma] DATABASE_URL user is postgres — must be postgres.<project-ref>. Using PGLite until Vercel env is fixed.",
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
    return new PrismaClient({ adapter: new PrismaPg({ connectionString: url }) });
  }
  const { PrismaPGlite } = await import("pglite-prisma-adapter");
  const pg = await getPglite();
  return new PrismaClient({ adapter: new PrismaPGlite(pg) });
}
