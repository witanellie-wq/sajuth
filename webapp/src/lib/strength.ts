// Day Master strength (신강/신약) + favorable element (용신) — the depth layer.
//
// Classic saju weighs how much the chart supports vs drains the Day Master.
// The month branch (월령) dominates, the day branch (일지, the DM's seat) is
// next, other positions count less. This is a pragmatic weighting, not a full
// 십신/통근 engine — good enough to branch the reading meaningfully.

import type { SajuChart, Element } from "./saju";
import { relationTo, isSupport, generatedBy, generates, controls, ELEMENT_TH } from "./elements";
import type { Lang } from "./i18n";

export type Band = "very_strong" | "strong" | "balanced" | "weak" | "very_weak";

export interface Strength {
  band: Band;
  supportRatio: number; // 0..1
  favorable: Element[]; // 용신 candidates (조후 overlay applied)
  bandLabel: string; // localized
  body: string; // localized free-section text
  notes: string[]; // localized 조후/합 observations woven into body
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

const BAND_LABEL: Record<Lang, Record<Band, string>> = {
  th: {
    very_strong: "พลังธาตุแข็งมาก (극신강)",
    strong: "พลังธาตุแข็ง (신강)",
    balanced: "พลังธาตุสมดุล (중화)",
    weak: "พลังธาตุอ่อน (신약)",
    very_weak: "พลังธาตุอ่อนมาก (극신약)",
  },
  en: {
    very_strong: "Very Strong Day Master (극신강)",
    strong: "Strong Day Master (신강)",
    balanced: "Balanced (중화)",
    weak: "Gentle Day Master (신약)",
    very_weak: "Very Gentle Day Master (극신약)",
  },
};

const ELEMENT_EN: Record<Element, string> = {
  wood: "Wood (木)", fire: "Fire (火)", earth: "Earth (土)",
  metal: "Metal (金)", water: "Water (水)",
};

// 삼합국 (three-harmony bureaus): when 2-3 of a trine appear among the
// branches, that element gains extra force in the chart.
const TRINES: Array<{ group: string[]; element: Element }> = [
  { group: ["申", "子", "辰"], element: "water" },
  { group: ["亥", "卯", "未"], element: "wood" },
  { group: ["寅", "午", "戌"], element: "fire" },
  { group: ["巳", "酉", "丑"], element: "metal" },
];

// 천간합 (stem combinations): a Day Master bound in 합 with an adjacent stem
// loses some independence.
const STEM_HE: Record<string, string> = {
  "甲": "己", "己": "甲",
  "乙": "庚", "庚": "乙",
  "丙": "辛", "辛": "丙",
  "丁": "壬", "壬": "丁",
  "戊": "癸", "癸": "戊",
};

// 조후 (seasonal climate): winter charts crave fire, summer charts crave water.
const WINTER = new Set(["亥", "子", "丑"]);
const SUMMER = new Set(["巳", "午", "未"]);

const NOTE_TEXT = {
  trine: {
    th: (el: string) => `ในดวงมีชุด 三合 รวมพลังธาตุ ${el} ทำให้ธาตุนี้มีอิทธิพลมากเป็นพิเศษ`,
    en: (el: string) => `Your branches form a 三合 trine that amplifies ${el} — this element carries extra influence in your chart.`,
  },
  bound: {
    th: "ธาตุประจำวันของคุณอยู่ใน ‘합(合)’ กับธาตุข้างเคียง ทำให้พลังส่วนตัวถูกดึงไปผูกไว้บ้าง ความสัมพันธ์กับคนรอบข้างจึงมีบทบาทใหญ่ในชีวิตคุณ",
    en: "Your Day Master sits in a 합 (combination) with a neighboring stem — some of its force is bound up, so relationships play an outsized role in your life.",
  },
  winter: {
    th: "คุณเกิดฤดูหนาว (조후) ดวงต้องการความอบอุ่นจากธาตุไฟมาเสริม จะทำให้ทุกด้านไหลลื่นขึ้น",
    en: "Born in a winter month (조후 seasonal balance), your chart craves the warmth of Fire — adding it smooths everything.",
  },
  summer: {
    th: "คุณเกิดฤดูร้อน (조후) ดวงต้องการความเย็นจากธาตุน้ำมาปรับสมดุล จะช่วยให้ตัดสินใจได้นิ่งขึ้น",
    en: "Born in a summer month (조후 seasonal balance), your chart needs cooling Water — it steadies your decisions.",
  },
};

export function analyzeStrength(chart: SajuChart, lang: Lang = "th"): Strength {
  const dm = chart.dayMasterElement;
  const notes: string[] = [];

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

  // 삼합국: 2 of a trine adds a little, all 3 adds a lot.
  const branches = [
    chart.year.zhi,
    chart.month.zhi,
    chart.day.zhi,
    ...(chart.hour ? [chart.hour.zhi] : []),
  ];
  const elName = lang === "th" ? ELEMENT_TH : ELEMENT_EN;
  for (const { group, element } of TRINES) {
    const hits = group.filter((b) => branches.includes(b)).length;
    if (hits >= 3) {
      items.push([element, 2]);
      notes.push(NOTE_TEXT.trine[lang](elName[element]));
    } else if (hits === 2) {
      items.push([element, 1]);
    }
  }

  let support = 0;
  let total = 0;
  for (const [el, w] of items) {
    total += w;
    if (isSupport(relationTo(dm, el))) support += w;
  }
  let ratio = total > 0 ? support / total : 0.5;

  // 천간합: Day Master combined with an adjacent stem (month or hour gan)
  // is partially bound → slightly weaker in practice.
  const partner = STEM_HE[chart.dayMaster];
  const adjacentStems = [chart.month.gan, ...(chart.hour ? [chart.hour.gan] : [])];
  if (partner && adjacentStems.includes(partner)) {
    ratio = Math.max(0, ratio - 0.06);
    notes.push(NOTE_TEXT.bound[lang]);
  }

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

  // 조후 overlay: season's craved element takes priority in 용신.
  const monthZhi = chart.month.zhi;
  if (WINTER.has(monthZhi)) {
    if (!favorable.includes("fire")) favorable.unshift("fire");
    notes.push(NOTE_TEXT.winter[lang]);
  } else if (SUMMER.has(monthZhi)) {
    if (!favorable.includes("water")) favorable.unshift("water");
    notes.push(NOTE_TEXT.summer[lang]);
  }

  const favList = favorable.map((e) => elName[e]).join(lang === "th" ? " และ " : " and ");

  let body: string;
  if (lang === "th") {
    body = strongSide
      ? `พลังธาตุประจำตัวคุณค่อนข้างแข็ง คุณมีพลังในตัวสูงและพึ่งพาตัวเองได้ดี ` +
        `แต่บางครั้งดันไปข้างหน้าแรงเกินไป ควรเสริมธาตุ ${favList} ` +
        `เพื่อปล่อยพลังออกและสร้างสมดุล`
      : band === "balanced"
      ? `พลังธาตุของคุณค่อนข้างสมดุล ปรับตัวได้ยืดหยุ่นในหลายสถานการณ์ ` +
        `ถือเป็นดวงที่กลมกล่อม เพียงประคองจังหวะให้ดีก็ไปได้ไกล`
      : `พลังธาตุประจำตัวคุณค่อนข้างอ่อน คุณไวต่อสิ่งรอบตัวและร่วมมือกับคนอื่นได้ดี ` +
        `ควรเสริมธาตุ ${favList} และหาพันธมิตรที่ไว้ใจได้ เพื่อหนุนพลังให้เต็ม`;
  } else {
    body = strongSide
      ? `Your day-master energy runs strong — self-reliant and driven, though you can ` +
        `push too hard at times. Strengthen ${favList} to release that power and stay balanced.`
      : band === "balanced"
      ? `Your five elements sit in good balance — you adapt flexibly to most situations. ` +
        `A well-rounded chart; just keep your own rhythm and you'll go far.`
      : `Your day-master energy is on the gentle side — sensitive to your surroundings and ` +
        `great at collaborating. Strengthen ${favList} and keep trusted allies close.`;
  }

  // Weave 조후/합/삼합 observations into the reading body.
  if (notes.length) body += " " + notes.join(" ");

  return {
    band,
    supportRatio: ratio,
    favorable,
    bandLabel: BAND_LABEL[lang][band],
    body,
    notes,
  };
}

export { GAN_ELEMENT, ZHI_ELEMENT };
