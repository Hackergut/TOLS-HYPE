import assert from "node:assert/strict";
import test from "node:test";
import { parseEscalateArgs, wantsLiveAgent } from "./support-policy.ts";

test("wantsLiveAgent matches a real handoff, not a deposit how-to", () => {
  assert.equal(wantsLiveAgent("How do I deposit?"), false);
  assert.equal(wantsLiveAgent("I need to talk to a human"), true);
  assert.equal(wantsLiveAgent("voglio un operatore"), true);
  assert.equal(wantsLiveAgent("passami un agente reale"), true);
});

test("parseEscalateArgs accepts a JSON string from the model", () => {
  assert.deepEqual(parseEscalateArgs('{"reason":"withdrawal stuck","priority":"high"}'), {
    reason: "withdrawal stuck",
    priority: "high",
  });
  assert.equal(parseEscalateArgs("not-json").priority, "normal");
});
