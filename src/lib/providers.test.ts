import assert from "node:assert/strict";
import test from "node:test";
import type { CatalogGame } from "./games-catalog.ts";
import { groupByProvider, providerDisplayName, providerLogoFor, providerSlug } from "./providers.ts";

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

test("prefers hub logo, then curated, then null", () => {
  assert.equal(providerLogoFor("Pragmatic Play", "https://hub.example/x.png")?.src, "https://hub.example/x.png");
  assert.equal(providerLogoFor("Pragmatic Play")?.src, "/brand/providers/pragmatic-play.png");
  assert.equal(providerLogoFor("Pragmatic Play Live")?.src, "/brand/providers/pragmatic-play.png");
  assert.equal(providerLogoFor("Unknown Studio"), null);
});

test("groups by provider sorted by game count", () => {
  const games = [game("a", "NetEnt"), game("b", "NetEnt"), game("c", "EGT", true)];
  const groups = groupByProvider(games);
  assert.equal(groups.length, 2);
  assert.equal(groups[0]?.slug, "netent");
  assert.equal(groups[0]?.games.length, 2);
  assert.equal(groups[1]?.slug, "egt");
  assert.equal(groups[1]?.live, 1);
});
