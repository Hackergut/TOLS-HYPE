import assert from "node:assert/strict";
import test from "node:test";
import { VAPID_PUBLIC_KEY, VAPID_SUBJECT } from "./vapid.ts";

test("vapid public key resolves without env (legacy fallback)", () => {
  assert.ok(VAPID_PUBLIC_KEY.length > 40);
  assert.match(VAPID_SUBJECT, /^mailto:/);
});
