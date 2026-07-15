// Compatibility (궁합) engine — scores two charts and writes a Thai verdict.
//
// Blends three classic signals:
//   1. Day-master (일간) element relation — 상생 supportive, 상극 tension, same comfortable.
//   2. Day-branch (일지 = spouse palace) relation — 六合/三合 harmony, 六沖 clash.
//   3. 용신 complement — does each partner supply what the other's chart lacks?
// Weighting is pragmatic, tuned to give a readable 0–100 with a clear narrative.

import type { SajuChart, Element } from "./saju";
import { relationTo } from "./elements";
import { analyzeStrength } from "./strength";

export interface Compatibility {
  score: number; // 0..100
  bandTh: string;
  headline: string; // Thai one-liner
  sections: Array<{ title: string; body: string }>;
}

// 六合 harmony pairs.
const LIU_HE = new Set(["子丑", "寅亥", "卯戌", "辰酉", "巳申", "午未"]);
// 六沖 clash pairs.
const LIU_CHONG = new Set(["子午", "丑未", "寅申", "卯酉", "辰戌", "巳亥"]);
// 三合 trine groups.
const SAN_HE: string[][] = [
  ["申", "子", "辰"],
  ["亥", "卯", "未"],
  ["寅", "午", "戌"],
  ["巳", "酉", "丑"],
];

function branchPair(a: string, b: string): "he" | "chong" | "sanhe" | "same" | "none" {
  if (a === b) return "same";
  const key1 = a + b;
  const key2 = b + a;
  if (LIU_HE.has(key1) || LIU_HE.has(key2)) return "he";
  if (LIU_CHONG.has(key1) || LIU_CHONG.has(key2)) return "chong";
  if (SAN_HE.some((g) => g.includes(a) && g.includes(b))) return "sanhe";
  return "none";
}

function clamp(n: number): number {
  return Math.max(0, Math.min(100, Math.round(n)));
}

export function computeCompatibility(a: SajuChart, b: SajuChart): Compatibility {
  let score = 40; // base
  const notes: string[] = [];

  // 1. Day master element relation.
  const rel = relationTo(a.dayMasterElement, b.dayMasterElement);
  const relBack = relationTo(b.dayMasterElement, a.dayMasterElement);
  if (rel === "resource" || relBack === "resource") {
    score += 25;
    notes.push("ธาตุประจำตัวของทั้งคู่ ‘ส่งเสริมกัน’ (相生) ฝ่ายหนึ่งช่วยเติมพลังให้อีกฝ่าย");
  } else if (rel === "same") {
    score += 12;
    notes.push("ธาตุประจำตัวเหมือนกัน เข้าใจกันง่ายเหมือนเพื่อนสนิท แต่ต้องระวังความเหมือนจนเบื่อ");
  } else if (rel === "wealth" || rel === "officer") {
    score += 6;
    notes.push("ธาตุประจำตัวมีแรงดึงดูดแบบตรงข้าม (相剋) มีเสน่ห์และความท้าทายปนกัน");
  }

  // 2. Day-branch (spouse palace) relation.
  const bp = branchPair(a.day.zhi, b.day.zhi);
  if (bp === "he") {
    score += 30;
    notes.push("เรือนคู่ครอง (일지) เป็น ‘六合’ — เข้าขากันสูงมาก ผูกพันแน่นแฟ้น");
  } else if (bp === "sanhe") {
    score += 24;
    notes.push("เรือนคู่ครองเป็น ‘三合’ — เสริมกันดี ไปในทิศทางเดียวกัน");
  } else if (bp === "same") {
    score += 12;
    notes.push("เรือนคู่ครองธาตุเดียวกัน จูนกันง่าย");
  } else if (bp === "chong") {
    score -= 18;
    notes.push("เรือนคู่ครองเป็น ‘六沖’ — มีแรงกระทบกัน ต้องสื่อสารและให้พื้นที่กันมากขึ้น");
  } else {
    score += 6;
  }

  // 3. 용신 complement — does each supply the other's favorable element?
  const sa = analyzeStrength(a);
  const sb = analyzeStrength(b);
  const aHelpsB = sb.favorable.includes(a.dayMasterElement);
  const bHelpsA = sa.favorable.includes(b.dayMasterElement);
  if (aHelpsB && bHelpsA) {
    score += 16;
    notes.push("ต่างเติมเต็มธาตุที่อีกฝ่ายขาด (용신) — เป็นคู่ที่ ‘พากันดีขึ้น’");
  } else if (aHelpsB || bHelpsA) {
    score += 8;
    notes.push("ฝ่ายหนึ่งช่วยเติมธาตุที่อีกฝ่ายต้องการ ประคองกันได้ดี");
  }

  const s = clamp(score);
  let bandTh: string;
  let headline: string;
  if (s >= 85) {
    bandTh = "เนื้อคู่ระดับพรหมลิขิต";
    headline = "เป็นคู่ที่ส่งเสริมและเข้าใจกันสูงมาก ยิ่งอยู่ยิ่งดี";
  } else if (s >= 70) {
    bandTh = "เข้ากันได้ดีมาก";
    headline = "เคมีตรงกันหลายด้าน ประคองความต่างเล็กน้อยก็ไปได้ไกล";
  } else if (s >= 55) {
    bandTh = "เข้ากันได้ดี";
    headline = "มีจุดเสริมกันชัดเจน ถ้าเข้าใจจังหวะของกันและกันจะลงตัว";
  } else if (s >= 40) {
    bandTh = "ต้องปรับจูนกัน";
    headline = "มีทั้งแรงดึงดูดและแรงเสียดทาน การสื่อสารคือกุญแจสำคัญ";
  } else {
    bandTh = "ท้าทาย แต่ไม่ใช่เป็นไปไม่ได้";
    headline = "ความต่างสูง ต้องอาศัยความเข้าใจและพื้นที่ให้กันมากเป็นพิเศษ";
  }

  return {
    score: s,
    bandTh,
    headline,
    sections: [
      { title: "ภาพรวมความเข้ากัน", body: headline },
      ...notes.map((n, i) => ({ title: `จุดที่ ${i + 1}`, body: n })),
    ],
  };
}
