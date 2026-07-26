// Print the factual combo list for the anchor couple — verifies positional
// pairing rules against the practitioner's hand-read examples.
import { computeSaju, placeCoords } from "../src/lib/saju";
import { computeCompatibility } from "../src/lib/compat";

const seoyul = computeSaju({ year: 1988, month: 11, day: 27, hour: 12, minute: 15, ...placeCoords("kr") });
const ingyu = computeSaju({ year: 1972, month: 10, day: 11, hour: 1, minute: 30, ...placeCoords("kr") });

const p = (c: typeof seoyul) =>
  `년 ${c.year.gan}${c.year.zhi} 월 ${c.month.gan}${c.month.zhi} 일 ${c.day.gan}${c.day.zhi} 시 ${c.hour ? c.hour.gan + c.hour.zhi : "미상"}`;
console.log("서율:", p(seoyul));
console.log("인규:", p(ingyu));

const r = computeCompatibility(seoyul, ingyu, "ko", "lovers", { a: "F", b: "M" });
console.log(`score ${r.score}`);
console.log("combos:");
for (const c of r.combos ?? []) console.log(" ", c.replaceAll("{A}", "서율").replaceAll("{B}", "인규"));
