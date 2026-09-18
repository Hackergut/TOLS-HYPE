import { readFileSync } from "node:fs";

const source = readFileSync(new URL("../src/lib/crazy/constants.ts", import.meta.url), "utf8");
const wheelMatch = source.match(/export const WHEEL: SpotId\[\] = \[([\s\S]*?)\];/);
const topMatch = source.match(/export const TOP_SLOT_MULTIS = \[([^\]]+)\]/);
const weightMatch = source.match(/export const TOP_SLOT_SPOT_WEIGHTS[^=]*=\s*\{([\s\S]*?)\};/);
if (!wheelMatch || !topMatch || !weightMatch) throw new Error("Could not read the CRAZYTOLS math manifest.");
const wheel = [...wheelMatch[1].matchAll(/"([a-z]+)"/g)].map((match) => match[1]);
const top = topMatch[1].split(",").map(Number).filter(Number.isFinite);
const expected = { one: 21, two: 13, five: 7, ten: 4, coinflip: 4, pachinko: 2, cashhunt: 2, crazytime: 1 };
const pays = { one: 1, two: 2, five: 5, ten: 10 };
const weights = Object.fromEntries([...weightMatch[1].matchAll(/(one|two|five|ten):\s*(\d+)/g)].map((match) => [match[1], Number(match[2])]));
const counts = Object.fromEntries(Object.keys(expected).map((spot) => [spot, 0]));
for (const spot of wheel) counts[spot] += 1;
const failures = [];
if (wheel.length !== 54) failures.push(`wheel length ${wheel.length}`);
for (const [spot, count] of Object.entries(expected)) if (counts[spot] !== count) failures.push(`${spot}: ${counts[spot]} != ${count}`);
const topMean = top.reduce((sum, value) => sum + value, 0) / top.length;
if (Object.values(weights).reduce((sum, value) => sum + value, 0) !== 100) failures.push("Top Slot spot weights do not total 100");
console.log("CRAZYTOLS-DEMO-1.1 MATH AUDIT");
console.table(Object.keys(pays).map((spot) => ({
  spot,
  segments: counts[spot],
  probability: `${(counts[spot] / 54 * 100).toFixed(6)}%`,
  baseRTP: `${(counts[spot] / 54 * (pays[spot] + 1) * 100).toFixed(6)}%`,
  topSlotRTP: `${(counts[spot] / 54 * (1 + pays[spot] * (1 + weights[spot] / 100 * (topMean - 1))) * 100).toFixed(6)}%`,
})));
console.log(`Top Slot mean: ${topMean.toFixed(9)}x`);
if (failures.length) { console.error("FAIL", failures); process.exitCode = 1; }
else console.log("PASS: 54-segment manifest and payout inputs are valid.");