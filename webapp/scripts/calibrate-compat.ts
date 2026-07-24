// Calibration harness for the 궁합 score. Not committed to CI — a tuning aid.
// Runs the anchor couple plus N random couples and prints the distribution.
import { computeSaju, placeCoords } from "../src/lib/saju";
import { computeCompatibility } from "../src/lib/compat";

type P = { year: number; month: number; day: number; hour: number; minute?: number; gender: "F" | "M"; place?: string };

function chart(p: P) {
  return computeSaju({ year: p.year, month: p.month, day: p.day, hour: p.hour, minute: p.minute, ...placeCoords(p.place ?? "kr") });
}

function score(a: P, b: P) {
  const r = computeCompatibility(chart(a), chart(b), "ko", "lovers", { a: a.gender, b: b.gender });
  return { score: r.score, intimate: r.intimate ?? 0 };
}

// Anchor: 김서율 (F, 1988.11.27 12:15) × 이인규 (M, 1972.10.11 01:30), kr
const seoyul: P = { year: 1988, month: 11, day: 27, hour: 12, minute: 15, gender: "F", place: "kr" };
const ingyu: P = { year: 1972, month: 10, day: 11, hour: 1, minute: 30, gender: "M", place: "kr" };
const anchor = score(seoyul, ingyu);
console.log(`ANCHOR 김서율×이인규 => score ${anchor.score}, intimate ${anchor.intimate}  (target 92~95)`);

// Deterministic pseudo-random couples (no Math.random — reproducible).
let seed = 12345;
const rand = () => ((seed = (seed * 1103515245 + 12345) & 0x7fffffff) / 0x7fffffff);
const randP = (g: "F" | "M"): P => ({
  year: 1965 + Math.floor(rand() * 40),
  month: 1 + Math.floor(rand() * 12),
  day: 1 + Math.floor(rand() * 27),
  hour: Math.floor(rand() * 24),
  gender: g,
});

const N = 3000;
const scores: number[] = [];
for (let i = 0; i < N; i++) scores.push(score(randP("F"), randP("M")).score);
scores.sort((x, y) => x - y);

const pct = (p: number) => scores[Math.floor(p * (scores.length - 1))];
console.log(`\nN=${N} random hetero couples`);
console.log(`min ${scores[0]}  p10 ${pct(0.1)}  p25 ${pct(0.25)}  median ${pct(0.5)}  p75 ${pct(0.75)}  p90 ${pct(0.9)}  max ${scores[scores.length - 1]}`);

const buckets: Record<string, number> = {};
for (const s of scores) {
  const b = `${Math.floor(s / 10) * 10}-${Math.floor(s / 10) * 10 + 9}`;
  buckets[b] = (buckets[b] ?? 0) + 1;
}
console.log("\nhistogram:");
for (const k of Object.keys(buckets).sort()) {
  const n = buckets[k];
  const bar = "█".repeat(Math.round((n / N) * 100));
  console.log(`${k.padStart(6)} | ${String(n).padStart(4)} ${((n / N) * 100).toFixed(1).padStart(4)}%  ${bar}`);
}
const band = (lo: number, hi: number) => scores.filter((s) => s >= lo && s <= hi).length;
console.log(`\nbands: 천생연분(85+) ${((band(85, 99) / N) * 100).toFixed(0)}%  아주잘맞(70-84) ${((band(70, 84) / N) * 100).toFixed(0)}%  무난(55-69) ${((band(55, 69) / N) * 100).toFixed(0)}%  조율(40-54) ${((band(40, 54) / N) * 100).toFixed(0)}%  쉽지않(≤39) ${((band(25, 39) / N) * 100).toFixed(0)}%`);
