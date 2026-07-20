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

export interface CompatSection {
  key: string;
  title: string;
  body: string;
  locked: boolean;
}

export interface Compatibility {
  score: number; // 0..100
  bandTh: string;
  headline: string; // Thai one-liner
  rel: string; // day-master relation key — drives premium content
  sections: CompatSection[];
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

  const sections: CompatSection[] = [
    { key: "overview", title: "ภาพรวมความเข้ากัน", body: headline, locked: false },
    ...notes.map((n, i) => ({
      key: `note${i + 1}`,
      title: `จุดที่ ${i + 1}`,
      body: n,
      locked: false,
    })),
    ...PREMIUM_COMPAT_TITLES.map(([key, title]) => ({
      key,
      title,
      body: "ปลดล็อกเพื่ออ่านผลวิเคราะห์เชิงลึกของคู่คุณ",
      locked: true,
    })),
  ];

  return { score: s, bandTh, headline, rel, sections };
}

const PREMIUM_COMPAT_TITLES: Array<[string, string]> = [
  ["marriage", "ดวงแต่งงานของคู่นี้"],
  ["conflict", "จุดที่ต้องระวังเป็นพิเศษ"],
  ["longterm", "อนาคตระยะยาวของความสัมพันธ์"],
];

// Premium bodies keyed by the day-master relation — how partner B's element
// meets partner A's. Five distinct narratives. First-pass Thai draft.
const PREMIUM_COMPAT: Record<string, Record<string, string>> = {
  same: {
    marriage: "คู่ธาตุเดียวกันแต่งงานแล้วเหมือนได้เพื่อนร่วมทีมตลอดชีวิต จังหวะชีวิตใกล้กัน ตัดสินใจใหญ่ ๆ ไปทางเดียวกันง่าย ช่วงเหมาะสมณ์คือปีที่ธาตุของทั้งคู่มีกำลัง",
    conflict: "จุดเสี่ยงคือ ‘เหมือนกันเกินไป’ — พอเหนื่อยพร้อมกันจะไม่มีใครประคองใคร และความเคยชินอาจกลายเป็นความจืดจาง หาสิ่งใหม่ทำด้วยกันเป็นระยะ",
    longterm: "ระยะยาวมั่นคงแบบเพื่อนคู่คิด ยิ่งอายุมากยิ่งสนิท เงื่อนไขเดียวคืออย่าลืมเติมความตื่นเต้นให้กันบ้าง",
  },
  resource: {
    marriage: "คู่แบบ ‘ผู้เติม-ผู้รับ’ (相生) แต่งงานแล้วฝ่ายหนึ่งจะเป็นกำลังใจหลักของอีกฝ่ายโดยธรรมชาติ บ้านจะเป็นที่พักใจจริง ๆ ดวงสมรสจัดว่าดีเป็นพิเศษ",
    conflict: "ระวังสมดุลการให้-การรับเอียงไปข้างเดียวจนฝ่ายให้หมดแรง ต้องสลับบทบาทกันบ้าง และอย่าเผลอคิดแทนอีกฝ่ายทุกเรื่อง",
    longterm: "ยิ่งอยู่ด้วยกันนานยิ่งเข้าขา เพราะพลังงานไหลเวียนต่อกันเป็นวงจร คู่แบบนี้แก่ไปด้วยกันได้สวยมาก",
  },
  output: {
    marriage: "คู่ที่ฝ่ายหนึ่งจุดประกายความคิดสร้างสรรค์ของอีกฝ่าย ชีวิตแต่งงานจะไม่น่าเบื่อ มีโปรเจกต์ร่วมกันเสมอ เหมาะทำธุรกิจคู่",
    conflict: "พลังไหลออกทางเดียวนาน ๆ อาจทำให้ฝ่ายที่ถูกดึงพลังรู้สึกล้า ต้องมีเวลาชาร์จส่วนตัวของแต่ละคน และอย่าเอาไอเดียมาแข่งกันเอง",
    longterm: "ระยะยาวโตไปด้วยกันแบบหุ้นส่วนชีวิต ทั้งเรื่องงานและความฝัน ขอแค่แบ่งบทให้ชัดว่าใครนำเรื่องไหน",
  },
  wealth: {
    marriage: "คู่แรงดึงดูดแบบ ‘ขั้วตรงข้ามที่ลงตัว’ ฝ่ายหนึ่งคุมจังหวะ อีกฝ่ายเปิดโอกาส แต่งงานแล้วเรื่องการเงินครอบครัวมักไปได้ดีถ้าวางกติกาแต่แรก",
    conflict: "แรงดึงดูดสูงมาพร้อมแรงเสียดทาน เรื่องเงินและอำนาจการตัดสินใจคือสนามหลัก ตกลงกันให้ชัดตั้งแต่ต้นว่าใครถือเรื่องไหน",
    longterm: "ถ้าผ่านการปรับจูน 2-3 ปีแรกไปได้ คู่แบบนี้จะแข็งแรงมาก เพราะต่างคนต่างเติมสิ่งที่อีกฝ่ายไม่มี",
  },
  officer: {
    marriage: "คู่ที่อีกฝ่ายทำให้คุณอยากเป็นคนที่ดีขึ้น มีวินัยขึ้น ชีวิตแต่งงานมีโครงสร้างชัดเจน เหมาะกับคนที่อยากสร้างครอบครัวแบบจริงจัง",
    conflict: "ระวังความรู้สึก ‘ถูกควบคุม’ สะสมโดยไม่พูด ฝ่ายที่ถูกกดต้องกล้าบอกขอบเขต และฝ่ายที่นำต้องฟังมากกว่าสั่ง",
    longterm: "ระยะยาวจะกลายเป็นคู่ที่คนรอบข้างนับถือ ขอแค่เปลี่ยนการควบคุมเป็นการดูแล ความเกรงใจเป็นความเข้าใจ",
  },
};

/** Reveal premium compat bodies after payment. */
export function unlockCompat(sections: CompatSection[], rel: string): CompatSection[] {
  const bodies = PREMIUM_COMPAT[rel] ?? PREMIUM_COMPAT.same;
  return sections.map((s) =>
    s.locked && bodies[s.key] ? { ...s, body: bodies[s.key], locked: false } : s
  );
}
