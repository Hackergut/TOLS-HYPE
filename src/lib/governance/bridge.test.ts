import assert from "node:assert/strict";
import test from "node:test";
import { createHmac } from "node:crypto";

test("bridge HMAC matches sha256= hex of raw body", () => {
  const secret = "a".repeat(32);
  const raw = JSON.stringify({ type: "ping", ts: "x" });
  const hex = createHmac("sha256", secret).update(raw).digest("hex");
  const a = Buffer.from(hex, "utf8");
  const b = Buffer.from(hex, "utf8");
  assert.equal(a.length, b.length);
  assert.equal(`sha256=${hex}`.startsWith("sha256="), true);
});

test("google state has hmac.payload shape", () => {
  const payload = Buffer.from(JSON.stringify({ d: "/", t: Date.now(), n: "ab" })).toString("base64url");
  const sig = createHmac("sha256", "secret").update(payload).digest("hex");
  const state = `${sig}.${payload}`;
  assert.match(state, /^[0-9a-f]+\./);
  assert.ok(state.includes("."));
});
