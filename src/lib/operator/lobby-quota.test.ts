import assert from "node:assert/strict";
import test from "node:test";
import { isBlockedStudio, isTurkishLiveTable, lobbyQuota } from "./lobby-quota.ts";

test("drops Nolimit and Turkish live", () => {
  assert.equal(isBlockedStudio("Nolimit City", "Fire"), true);
  assert.equal(isTurkishLiveTable({ title: "Istanbul Roulette", live: true }), true);
  assert.equal(isTurkishLiveTable({ title: "Lightning Roulette", live: true }), false);
});

test("caps 30 illustrated per studio", () => {
  const games = Array.from({ length: 80 }, (_, i) => ({
    provider: "NetEnt",
    title: `Game ${i}`,
    cover: `https://cdn.example/art/${i}.jpg`,
  }));
  const out = lobbyQuota(games);
  assert.equal(out.length, 30);
});
