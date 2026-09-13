import assert from "node:assert/strict";
import test from "node:test";
import { CANONICAL_CASINO_ORIGIN, normalizePublicOrigin, resolveCasinoOrigin } from "./env.server.ts";

test("adds https when protocol is missing", () => {
  assert.equal(normalizePublicOrigin("www.tols.fun"), "https://www.tols.fun");
});

test("strips trailing slash via URL host", () => {
  assert.equal(normalizePublicOrigin("https://www.tols.fun/"), "https://www.tols.fun");
});

test("rejects stale tols-plum host", () => {
  assert.equal(normalizePublicOrigin("tols-plum.vercel.app"), CANONICAL_CASINO_ORIGIN);
  assert.equal(normalizePublicOrigin("https://tols-plum.vercel.app"), CANONICAL_CASINO_ORIGIN);
});

test("resolveCasinoOrigin prefers APP_URL when CASINO_ORIGIN is stale", () => {
  assert.equal(
    resolveCasinoOrigin("tols-plum.vercel.app", "https://www.tols.fun"),
    "https://www.tols.fun",
  );
});

test("resolveCasinoOrigin keeps a valid custom origin", () => {
  assert.equal(
    resolveCasinoOrigin("https://hype.tols.fun", "https://www.tols.fun"),
    "https://hype.tols.fun",
  );
});
