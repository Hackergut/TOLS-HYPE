#!/usr/bin/env node
/**
 * Cross-platform `test:unit` runner.
 *
 * The previous inline script used POSIX command substitution
 * (`$(ls scripts/*.test.mjs | grep -v …)`), which only works where npm's
 * script shell is sh — on Windows cmd it breaks. Node's test runner accepts
 * explicit file lists, so this script builds the same list portably:
 *
 *   1. `scripts/*.test.mjs`, excluding `grok-pwa-plugin.test.mjs` — those 8
 *      tests assert platform branding fixtures and are deliberately kept out
 *      of the unit gate (see docs/ANALISI-CONNESSIONI.md §5, Grado 3).
 *   2. The src/lib unit tests, run with `--experimental-strip-types`.
 *
 * Exit code: first failing step wins, mirroring the `&&` chain it replaces.
 */
import { spawnSync } from "node:child_process";
import { readdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = dirname(dirname(fileURLToPath(import.meta.url)));

const scriptTests = readdirSync(join(root, "scripts"), { withFileTypes: true })
  .filter(
    (e) =>
      e.isFile() &&
      e.name.endsWith(".test.mjs") &&
      e.name !== "grok-pwa-plugin.test.mjs",
  )
  .map((e) => join(root, "scripts", e.name))
  .sort();

const srcTests = [
  "src/lib/app-data/app-data.test.ts",
  "src/lib/app-data/readiness-schedule.test.ts",
  "src/lib/auth/gate-identity.test.ts",
  "src/lib/auth/sign-in-gate.test.ts",
  "src/lib/fair.test.ts",
  "src/lib/governance/bridge.test.ts",
  "src/lib/governance/live.test.ts",
  "src/lib/governance/platform-auth.test.ts",
  "src/lib/operator/lobby-quota.test.ts",
  "src/lib/operator/config.test.ts",
  "src/lib/notifications/vapid.test.ts",
  "src/lib/providers.test.ts",
].map((p) => join(root, p));

function run(label, args) {
  console.log(`[test:unit] ${label}`);
  // In-process isolation: the per-file child-process spawn is unavailable in
  // restricted sandboxes (Windows dev here), and in-process is faster anyway.
  const res = spawnSync(
    process.execPath,
    ["--test", "--test-isolation=none", ...args],
    { stdio: "inherit", cwd: root },
  );
  if (res.error) {
    console.error(`[test:unit] failed to spawn: ${res.error.message}`);
    process.exit(1);
  }
  if (res.status !== 0) process.exit(res.status ?? 1);
}

run("scripts unit tests", [...scriptTests]);
run("src unit tests", ["--experimental-strip-types", ...srcTests]);