import assert from "node:assert/strict";
import test from "node:test";
import { backendLabel, OPERATOR_BACKENDS, operator } from "./config.ts";

test("every operator backend has a non-empty label", () => {
  for (const b of OPERATOR_BACKENDS) {
    assert.ok(backendLabel(b).length > 0, b);
  }
});

test("supabase label discloses REST-fallback-only wiring", () => {
  assert.match(backendLabel("supabase"), /REST fallback/);
});

test("operator defaults apply without VITE_ env", () => {
  assert.equal(operator.name, "TOLS");
  assert.equal(operator.backend, "local");
  assert.equal(operator.aggregatorKind, "flexrix");
  assert.equal(operator.casinoOrigin, "https://www.tols.fun");
});
