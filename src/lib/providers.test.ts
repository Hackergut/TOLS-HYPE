import assert from "node:assert/strict";
import test from "node:test";
import type { CatalogGame } from "./games-catalog.ts";
import {
  groupByProvider,
  isPremiumProvider,
  providerDisplayName,
  providerLogoFor,
  providerSlug,
} from "./providers.ts";

const game = (id: string, provider: string, live = false): CatalogGame => ({
  id,
  title: id,
  provider,
  category: live ? "live" : "slots",
  kind: "slots",
  blurb: "",
  cover: "",
  edge: 0,
  rtp: 96,
  live,
});

test("slugs hub provider names", () => {
  assert.equal(providerSlug("Pragmatic Play"), "pragmatic-play");
  assert.equal(providerSlug("PlayNGO"), "playngo");
  assert.equal(providerSlug("3 Oaks"), "3-oaks");
  assert.equal(providerSlug("RedTiger"), "redtiger");
  assert.equal(providerSlug(""), "studio");
});

test("prettifies known display names, keeps unknown", () => {
  assert.equal(providerDisplayName("RedTiger"), "Red Tiger");
  assert.equal(providerDisplayName("PlayNGO"), "Play'n GO");
  assert.equal(providerDisplayName("Some New Studio"), "Some New Studio");
});

test("prefers curated mono lockup over hub thumb", () => {
  assert.equal(providerLogoFor("Pragmatic Play", "https://hub.example/x.png")?.src, "/brand/providers/mono/pragmatic-play.svg");
  assert.equal(providerLogoFor("Pragmatic Play")?.tone, "mono");
  assert.equal(providerLogoFor("BGaming")?.src, "/brand/providers/mono/bgaming.svg");
  assert.equal(providerLogoFor("Unknown Studio"), null);
});

test("groups premium studios ahead of raw count", () => {
  const games = [game("a", "Amusnet"), game("b", "Amusnet"), game("c", "NetEnt"), game("d", "EGT", true)];
  const groups = groupByProvider(games);
  assert.equal(groups[0]?.slug, "netent");
  assert.equal(groups[0]?.premium, true);
});

test("premium flag covers top studios", () => {
  assert.equal(isPremiumProvider("Evolution Gaming"), true);
  assert.equal(isPremiumProvider("Pascal"), false);
});
