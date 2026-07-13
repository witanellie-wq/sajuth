// Regression snapshot harness (run: npm run test:saju).
//
// These lock the engine's Four-Pillar output so a lunar-javascript version bump
// or a correction-logic change can't silently drift. They are SNAPSHOTS of the
// library, NOT yet externally confirmed. The real 검증 (PLAN.md 6.2) diffs ~100
// of these against the 천을귀인 app to hit 99%+ — as each case is confirmed,
// mark it ✔confirmed below.

import { computeSaju } from "./saju";

interface Case {
  name: string;
  input: Parameters<typeof computeSaju>[0];
  // Four Pillars WITHOUT true-solar-time correction (raw clock time) — what a
  // standard 만세력 app shows for a given clock time.
  expect: { year: string; month: string; day: string; hour?: string };
}

const CASES: Case[] = [
  {
    // snapshot — TODO: confirm against 천을귀인
    name: "1990-05-15 14:30 (no TST)",
    input: { year: 1990, month: 5, day: 15, hour: 14, minute: 30, trueSolarTime: false },
    expect: { year: "庚午", month: "辛巳", day: "庚辰", hour: "癸未" },
  },
  {
    // ✔confirmed 2000-01-01 = 戊午 day
    name: "2000-01-01 00:00 (no TST)",
    input: { year: 2000, month: 1, day: 1, hour: 0, minute: 0, trueSolarTime: false },
    expect: { year: "己卯", month: "丙子", day: "戊午", hour: "壬子" },
  },
];

let pass = 0;
let fail = 0;
for (const c of CASES) {
  const chart = computeSaju(c.input);
  const got = {
    year: chart.year.gan + chart.year.zhi,
    month: chart.month.gan + chart.month.zhi,
    day: chart.day.gan + chart.day.zhi,
    hour: chart.hour ? chart.hour.gan + chart.hour.zhi : undefined,
  };
  const ok =
    got.year === c.expect.year &&
    got.month === c.expect.month &&
    got.day === c.expect.day &&
    (c.expect.hour === undefined || got.hour === c.expect.hour);
  if (ok) {
    pass++;
    console.log(`  ✅ ${c.name}`);
  } else {
    fail++;
    console.log(`  ❌ ${c.name}`);
    console.log(`     expected ${JSON.stringify(c.expect)}`);
    console.log(`     got      ${JSON.stringify(got)}`);
  }
}

// True-solar-time correction should shift Bangkok clock time by ~-18 min.
const tst = computeSaju({ year: 1990, month: 5, day: 15, hour: 0, minute: 5 });
console.log(
  `  ℹ️  TST correction @Bangkok = ${tst.trueSolarCorrectionMin} min ` +
    `(00:05 → hour pillar ${tst.hour?.gan}${tst.hour?.zhi})`
);

console.log(`\n${pass} passed, ${fail} failed`);
if (fail > 0) process.exit(1);
