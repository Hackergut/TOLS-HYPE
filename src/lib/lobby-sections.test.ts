import assert from "node:assert/strict";
import test from "node:test";
import { GAMES } from "./games-catalog.ts";
import {
  sectionLiveShow,
  sectionMostPlayed,
  sectionNew,
  sectionOriginals,
  sectionTableGames,
  uniqueGames,
} from "./lobby-sections.ts";

test("originals are house games only", () => {
  const originals = sectionOriginals(GAMES);
  assert.ok(originals.length >= 10);
  assert.ok(originals.every((g) => g.original || g.provider === "TOLS Originals"));
});

test("live show includes studio live tables", () => {
  const live = sectionLiveShow(GAMES);
  assert.ok(live.some((g) => g.id === "voltage-live"));
});

test("table games include roulette and blackjack", () => {
  const tables = sectionTableGames(GAMES);
  assert.ok(tables.some((g) => g.kind === "roulette"));
  assert.ok(tables.some((g) => g.kind === "blackjack"));
});

test("most played ranks by players", () => {
  const top = sectionMostPlayed(GAMES, 3);
  assert.ok((top[0]?.players ?? 0) >= (top[1]?.players ?? 0));
});

test("new prefers isNew flag", () => {
  const news = sectionNew(GAMES, 8);
  assert.ok(news.some((g) => g.isNew));
});

test("uniqueGames drops duplicate ids", () => {
  const dup = uniqueGames([GAMES[0]!, GAMES[0]!, GAMES[1]!]);
  assert.equal(dup.length, 2);
});
