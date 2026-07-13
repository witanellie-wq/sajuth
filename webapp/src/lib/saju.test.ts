// Verification harness (run: npm run test:saju).
//
// Three layers:
//  1. CONFIRMED anchors — Four Pillars verified against a trusted 만세력.
//  2. SNAPSHOT (100 cases) — locks lunar-javascript output so a version bump or
//     a correction-logic change can't silently drift. Regenerate deliberately
//     with `npm run gen:snapshot`. External confirmation vs 천을귀인 (PLAN.md
//     6.2, 99%+ target) is tracked as those cases get checked.
//  3. PromptPay CRC — a wrong checksum = unscannable QR = no revenue.

import { computeSaju } from "./saju";
import { promptPayPayload, crc16 } from "./promptpay";
import snapshot from "./saju.snapshot.json";

let pass = 0;
let fail = 0;
function check(name: string, ok: boolean, detail?: string) {
  if (ok) {
    pass++;
  } else {
    fail++;
    console.log(`  ❌ ${name}${detail ? "\n     " + detail : ""}`);
  }
}

// ── 1. Confirmed anchors ────────────────────────────────────────────────
// ✔ 2000-01-01 = 戊午 day (verified in a trusted 만세력).
{
  const c = computeSaju({ year: 2000, month: 1, day: 1, hour: 0, trueSolarTime: false });
  check(
    "confirmed 2000-01-01 00:00",
    c.year.gan + c.year.zhi === "己卯" &&
      c.month.gan + c.month.zhi === "丙子" &&
      c.day.gan + c.day.zhi === "戊午" &&
      c.hour!.gan + c.hour!.zhi === "壬子"
  );
}

// ── 2. Snapshot regression (100 cases) ──────────────────────────────────
type Snap = { in: { year: number; month: number; day: number; hour: number }; out: Record<string, string> };
let snapFail = 0;
for (const s of snapshot as Snap[]) {
  const c = computeSaju({ ...s.in, trueSolarTime: false });
  const got = {
    year: c.year.gan + c.year.zhi,
    month: c.month.gan + c.month.zhi,
    day: c.day.gan + c.day.zhi,
    hour: c.hour!.gan + c.hour!.zhi,
  };
  const ok = (["year", "month", "day", "hour"] as const).every((k) => got[k] === s.out[k]);
  if (!ok) {
    snapFail++;
    console.log(`  ❌ snapshot ${JSON.stringify(s.in)}: got ${JSON.stringify(got)} want ${JSON.stringify(s.out)}`);
  }
}
check(`snapshot regression (${(snapshot as Snap[]).length} cases)`, snapFail === 0);

// ── 3. True-solar-time correction ───────────────────────────────────────
{
  const c = computeSaju({ year: 1990, month: 5, day: 15, hour: 0, minute: 5 });
  check("Bangkok TST correction = -18 min", c.trueSolarCorrectionMin === -18);
}

// ── 4. PromptPay CRC — validate against the canonical check vector ───────
// CRC-16/CCITT-FALSE of "123456789" is 0x29B1 (the standard test value).
check("crc16 check vector 123456789 → 29B1", crc16("123456789") === "29B1", `got ${crc16("123456789")}`);

// Payload structure: format indicator, AID, formatted phone, THB, ends with a
// self-consistent CRC over everything up to and including "6304".
{
  const p = promptPayPayload("0812345678");
  const structOk =
    p.startsWith("000201") &&
    p.includes("A000000677010111") &&
    p.includes("0066812345678") &&
    p.includes("5303764");
  const crcOk = p.slice(-4) === crc16(p.slice(0, -4));
  check("PromptPay static structure + self-consistent CRC", structOk && crcOk, `got ${p}`);
}
// Dynamic QR carries the amount tag (59.00 THB) and initiation method 12.
{
  const p = promptPayPayload("0812345678", 59);
  check("PromptPay dynamic amount + method", p.includes("540559.00") && p.includes("010212"), `got ${p}`);
}

console.log(`\n${pass} passed, ${fail} failed`);
if (fail > 0) process.exit(1);
