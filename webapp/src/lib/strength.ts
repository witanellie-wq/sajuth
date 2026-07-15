// Day Master strength (신강/신약) + favorable element (용신) — the depth layer.
//
// Classic saju weighs how much the chart supports vs drains the Day Master.
// The month branch (월령) dominates, the day branch (일지, the DM's seat) is
// next, other positions count less. This is a pragmatic weighting, not a full
// 십신/통근 engine — good enough to branch the reading meaningfully.

import type { SajuChart, Element } from "./saju";
import { relationTo, isSupport, generatedBy, generates, controls, ELEMENT_TH } from "./elements";

export type Band = "very_strong" | "strong" | "balanced" | "weak" | "very_weak";

export interface Strength {
  band: Band;
  supportRatio: number; // 0..1
  favorable: Element[]; // 용신 candidates
  bandTh: string;
  body: string; // Thai free-section text
}

const GAN_ELEMENT: Record<string, Element> = {
  "甲": "wood", "乙": "wood", "丙": "fire", "丁": "fire", "戊": "earth",
  "己": "earth", "庚": "metal", "辛": "metal", "壬": "water", "癸": "water",
};
const ZHI_ELEMENT: Record<string, Element> = {
  "子": "water", "丑": "earth", "寅": "wood", "卯": "wood", "辰": "earth",
  "巳": "fire", "午": "fire", "未": "earth", "申": "metal", "酉": "metal",
  "戌": "earth", "亥": "water",
};

const BAND_TH: Record<Band, string> = {
  very_strong: "พลังธาตุแข็งมาก (극신강)",
  strong: "พลังธาตุแข็ง (신강)",
  balanced: "พลังธาตุสมดุล (중화)",
  weak: "พลังธาตุอ่อน (신약)",
  very_weak: "พลังธาตุอ่อนมาก (극신약)",
};

export function analyzeStrength(chart: SajuChart): Strength {
  const dm = chart.dayMasterElement;

  // (element, weight) contributions from every position except the DM stem.
  const items: Array<[Element, number]> = [];
  items.push([chart.year.ganElement, 1]);
  items.push([chart.year.zhiElement, 1]);
  items.push([chart.month.ganElement, 1]);
  items.push([chart.month.zhiElement, 3]); // 월령 dominates
  // day.gan is the Day Master itself — skip.
  items.push([chart.day.zhiElement, 2]); // 일지 = DM's seat
  if (chart.hour) {
    items.push([chart.hour.ganElement, 1]);
    items.push([chart.hour.zhiElement, 1]);
  }

  let support = 0;
  let total = 0;
  for (const [el, w] of items) {
    total += w;
    if (isSupport(relationTo(dm, el))) support += w;
  }
  const ratio = total > 0 ? support / total : 0.5;

  let band: Band;
  if (ratio >= 0.7) band = "very_strong";
  else if (ratio >= 0.55) band = "strong";
  else if (ratio >= 0.45) band = "balanced";
  else if (ratio >= 0.3) band = "weak";
  else band = "very_weak";

  const strongSide = band === "very_strong" || band === "strong";
  // 용신: strong DM wants draining elements; weak DM wants supporting ones.
  const favorable: Element[] = strongSide
    ? [generates(dm), controls(dm)] // 식상 · 재성
    : [generatedBy(dm), dm]; // 인성 · 비겁

  const favTh = favorable.map((e) => ELEMENT_TH[e]).join(" และ ");
  const body = strongSide
    ? `พลังธาตุประจำตัวคุณค่อนข้างแข็ง คุณมีพลังในตัวสูงและพึ่งพาตัวเองได้ดี ` +
      `แต่บางครั้งดันไปข้างหน้าแรงเกินไป ควรเสริมธาตุ ${favTh} ` +
      `เพื่อปล่อยพลังออกและสร้างสมดุล`
    : band === "balanced"
    ? `พลังธาตุของคุณค่อนข้างสมดุล ปรับตัวได้ยืดหยุ่นในหลายสถานการณ์ ` +
      `ถือเป็นดวงที่กลมกล่อม เพียงประคองจังหวะให้ดีก็ไปได้ไกล`
    : `พลังธาตุประจำตัวคุณค่อนข้างอ่อน คุณไวต่อสิ่งรอบตัวและร่วมมือกับคนอื่นได้ดี ` +
      `ควรเสริมธาตุ ${favTh} และหาพันธมิตรที่ไว้ใจได้ เพื่อหนุนพลังให้เต็ม`;

  return { band, supportRatio: ratio, favorable, bandTh: BAND_TH[band], body };
}

export { GAN_ELEMENT, ZHI_ELEMENT };
