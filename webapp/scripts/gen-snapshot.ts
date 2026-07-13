// Generates a 100-case Four-Pillar snapshot across a spread of birth moments.
// Run once (npm run gen:snapshot) to (re)baseline; the test then guards against
// drift. These lock lunar-javascript's output — external confirmation against
// 천을귀인 is tracked separately (see saju.test.ts header).

import { writeFileSync } from "fs";
import { join } from "path";
import { computeSaju } from "../src/lib/saju";

const cases: unknown[] = [];
// Deterministic spread: every ~37 days from 1970 to ~2010, cycling hours.
let y = 1970;
let m = 1;
let d = 1;
for (let i = 0; i < 100; i++) {
  const hour = (i * 7) % 24;
  const chart = computeSaju({ year: y, month: m, day: d, hour, trueSolarTime: false });
  cases.push({
    in: { year: y, month: m, day: d, hour },
    out: {
      year: chart.year.gan + chart.year.zhi,
      month: chart.month.gan + chart.month.zhi,
      day: chart.day.gan + chart.day.zhi,
      hour: chart.hour!.gan + chart.hour!.zhi,
    },
  });
  // advance ~37 days
  d += 37;
  while (d > 28) {
    d -= 28;
    m += 1;
    if (m > 12) {
      m = 1;
      y += 1;
    }
  }
}

const out = join(__dirname, "..", "src", "lib", "saju.snapshot.json");
writeFileSync(out, JSON.stringify(cases, null, 2) + "\n");
console.log(`wrote ${cases.length} cases → ${out}`);
