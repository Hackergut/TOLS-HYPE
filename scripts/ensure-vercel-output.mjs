#!/usr/bin/env node
/** Nitro 3 vercel preset can skip Build Output API files; without them
 *  Vercel is Ready then every URL is 79-byte NOT_FOUND. */
import { mkdirSync, writeFileSync, existsSync, cpSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const out = join(root, ".vercel", "output");
const fn = join(out, "functions", "__server.func");

if (!existsSync(fn)) {
  console.error("[ensure-vercel-output] missing", fn);
  process.exit(1);
}

const configPath = join(out, "config.json");
if (!existsSync(configPath)) {
  writeFileSync(
    configPath,
    JSON.stringify({
      version: 3,
      framework: { name: "nitro", version: "3" },
      routes: [
        { headers: { "cache-control": "public, max-age=31536000, immutable" }, src: "/assets/(.*)" },
        { handle: "filesystem" },
        { src: "/(.*)", dest: "/__server" },
      ],
    }),
  );
  console.log("[ensure-vercel-output] wrote config.json");
}

mkdirSync(fn, { recursive: true });
const vc = join(fn, ".vc-config.json");
if (!existsSync(vc)) {
  writeFileSync(
    vc,
    JSON.stringify({
      runtime: "nodejs24.x",
      handler: "index.mjs",
      launcherType: "Nodejs",
      shouldAddSourcemapSupport: false,
    }),
  );
  console.log("[ensure-vercel-output] wrote .vc-config.json");
}

const libs = join(fn, "_libs");
mkdirSync(libs, { recursive: true });
const pgliteDist = join(root, "node_modules", "@electric-sql", "pglite", "dist");
for (const name of ["pglite.data", "pglite.wasm", "index.wasm", "initdb.wasm"]) {
  const src = join(pgliteDist, name);
  if (!existsSync(src)) continue;
  const dest = join(libs, name);
  cpSync(src, dest);
  console.log("[ensure-vercel-output] copied", name);
}
