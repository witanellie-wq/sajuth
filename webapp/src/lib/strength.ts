// Day Master strength (신강/신약) + favorable element (용신) — the depth layer.
//
// Classic saju weighs how much the chart supports vs drains the Day Master.
// The month branch (월령) dominates, the day branch (일지, the DM's seat) is
// next, other positions count less. This is a pragmatic weighting, not a full
// 십신/통근 engine — good enough to branch the reading meaningfully.

import type { SajuChart, Element } from "./saju";
import { relationTo, isSupport, generatedBy, generates, controls, ELEMENT_TH } from "./elements";
import type { Lang } from "./i18n";

// Six classical bands: 태약 · 신약 · 중화신약 · 중화신강 · 신강 · 태강.
export type Band =
  | "taegang"
  | "singang"
  | "junghwa_singang"
  | "junghwa_sinyak"
  | "sinyak"
  | "taeyak";

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
    taegang: "พลังธาตุแข็งแกร่งมาก (태강)",
    singang: "พลังธาตุแข็ง (신강)",
    junghwa_singang: "สมดุลค่อนไปทางแข็ง (중화신강)",
    junghwa_sinyak: "สมดุลค่อนไปทางอ่อน (중화신약)",
    sinyak: "พลังธาตุอ่อน (신약)",
    taeyak: "พลังธาตุอ่อนมาก (태약)",
  },
  en: {
    taegang: "Very Strong Day Master (태강)",
    singang: "Strong Day Master (신강)",
    junghwa_singang: "Balanced, Leaning Strong (중화신강)",
    junghwa_sinyak: "Balanced, Leaning Gentle (중화신약)",
    sinyak: "Gentle Day Master (신약)",
    taeyak: "Very Gentle Day Master (태약)",
  },
  ko: {
    taegang: "태강 — 일간이 매우 강함",
    singang: "신강 — 일간이 강함",
    junghwa_singang: "중화신강 — 균형 속 강한 편",
    junghwa_sinyak: "중화신약 — 균형 속 약한 편",
    sinyak: "신약 — 일간이 약함",
    taeyak: "태약 — 일간이 매우 약함",
  },
};

// 천간합화 (combination + transformation): when adjacent stems combine, the
// pair's energy transforms into a new element (e.g. 戊癸合火).
const HE_RESULT: Record<string, Element> = {
  "甲己": "earth", "己甲": "earth",
  "乙庚": "metal", "庚乙": "metal",
  "丙辛": "water", "辛丙": "water",
  "丁壬": "wood", "壬丁": "wood",
  "戊癸": "fire", "癸戊": "fire",
};

const ELEMENT_EN: Record<Element, string> = {
  wood: "Wood (木)", fire: "Fire (火)", earth: "Earth (土)",
  metal: "Metal (金)", water: "Water (水)",
};
const ELEMENT_KO: Record<Element, string> = {
  wood: "목(木)", fire: "화(火)", earth: "토(土)",
  metal: "금(金)", water: "수(水)",
};
function elementNames(lang: Lang): Record<Element, string> {
  return lang === "th" ? ELEMENT_TH : lang === "ko" ? ELEMENT_KO : ELEMENT_EN;
}

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
  hapwha: {
    th: (el: string) =>
      `ในดวงมี ‘합화(合化)’ — ธาตุจากสองเสารวมตัวกลายเป็นธาตุ ${el} เสริมพลังใหม่ให้ดวงของคุณอย่างเงียบ ๆ`,
    en: (el: string) =>
      `Your chart carries a 합화 (combining transformation) — two stems merge and turn into ${el}, quietly reshaping your energy.`,
    ko: (el: string) =>
      `사주에 합화(合化)가 있어요 — 두 기둥의 기운이 합쳐져 ${el} 기운으로 변하며, 조용히 사주의 판을 바꿔줍니다.`,
  },
  trine: {
    th: (el: string) => `ในดวงมีชุด 三合 รวมพลังธาตุ ${el} ทำให้ธาตุนี้มีอิทธิพลมากเป็นพิเศษ`,
    en: (el: string) => `Your branches form a 三合 trine that amplifies ${el} — this element carries extra influence in your chart.`,
    ko: (el: string) => `지지에 삼합(三合)이 있어 ${el} 기운이 특히 강하게 작용하는 사주예요.`,
  },
  bound: {
    th: "ธาตุประจำวันของคุณอยู่ใน ‘합(合)’ กับธาตุข้างเคียง ทำให้พลังส่วนตัวถูกดึงไปผูกไว้บ้าง ความสัมพันธ์กับคนรอบข้างจึงมีบทบาทใหญ่ในชีวิตคุณ",
    en: "Your Day Master sits in a 합 (combination) with a neighboring stem — some of its force is bound up, so relationships play an outsized role in your life.",
    ko: "일간이 옆 기둥과 합(合)을 이뤄 기운이 살짝 묶여 있어요. 그만큼 인간관계가 인생에서 큰 비중을 차지합니다.",
  },
  winter: {
    th: "คุณเกิดฤดูหนาว (조후) ดวงต้องการความอบอุ่นจากธาตุไฟมาเสริม จะทำให้ทุกด้านไหลลื่นขึ้น",
    en: "Born in a winter month (조후 seasonal balance), your chart craves the warmth of Fire — adding it smooths everything.",
    ko: "겨울에 태어난 사주라(조후) 불의 따뜻함이 필요해요. 화 기운을 보완하면 모든 일이 한결 잘 풀립니다.",
  },
  summer: {
    th: "คุณเกิดฤดูร้อน (조후) ดวงต้องการความเย็นจากธาตุน้ำมาปรับสมดุล จะช่วยให้ตัดสินใจได้นิ่งขึ้น",
    en: "Born in a summer month (조후 seasonal balance), your chart needs cooling Water — it steadies your decisions.",
    ko: "여름에 태어난 사주라(조후) 물의 서늘함이 필요해요. 수 기운을 보완하면 판단이 차분해집니다.",
  },
};

export function analyzeStrength(chart: SajuChart, lang: Lang = "th"): Strength {
  const dm = chart.dayMasterElement;
  const notes: string[] = [];

  // 천간합화: year+month stems combining transform BOTH into the new element
  // (e.g. 戊癸合火 turns earth+water into fire support for a 丙 day master).
  const elName0 = elementNames(lang);
  const hapwha = HE_RESULT[chart.year.gan + chart.month.gan];
  let yearGanEl = chart.year.ganElement;
  let monthGanEl = chart.month.ganElement;
  if (hapwha) {
    yearGanEl = hapwha;
    monthGanEl = hapwha;
    notes.push(NOTE_TEXT.hapwha[lang](elName0[hapwha]));
  }

  // (element, weight) contributions from every position except the DM stem.
  const items: Array<[Element, number]> = [];
  items.push([yearGanEl, 1]);
  items.push([chart.year.zhiElement, 1]);
  items.push([monthGanEl, 1]);
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
  const elName = elementNames(lang);
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

  // Six classical bands.
  let band: Band;
  if (ratio >= 0.8) band = "taegang";
  else if (ratio >= 0.62) band = "singang";
  else if (ratio >= 0.5) band = "junghwa_singang";
  else if (ratio >= 0.38) band = "junghwa_sinyak";
  else if (ratio >= 0.22) band = "sinyak";
  else band = "taeyak";

  // 용신 direction: charts leaning strong want draining elements; charts
  // leaning gentle want supporting ones.
  const strongSide = ratio >= 0.5;
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

  const favList = favorable.map((e) => elName[e]).join(lang === "th" ? " และ " : lang === "ko" ? "·" : " and ");

  const isStrong = band === "taegang" || band === "singang";
  const isJunghwa = band === "junghwa_singang" || band === "junghwa_sinyak";

  let body: string;
  if (lang === "ko") {
    body = isStrong
      ? `일간의 힘이 강한 사주예요. 자립심과 추진력이 뛰어나지만 때로 너무 밀어붙일 수 있어요. ` +
        `${favList} 기운을 활용해 힘을 흘려보내면 균형이 잡힙니다.`
      : isJunghwa
      ? `오행이 균형(중화) 구간에 있는 잘 짜인 사주예요. 상황 적응이 유연하고 무리가 없어요. ` +
        `${favList} 기운을 조금 더하면 한층 안정됩니다.`
      : `일간의 힘이 여린 편이에요. 주변에 예민하게 반응하고 협업에 강하죠. ` +
        `${favList} 기운을 보강하고 믿을 만한 사람을 곁에 두면 힘이 채워집니다.`;
  } else if (lang === "th") {
    body = isStrong
      ? `พลังธาตุประจำตัวคุณค่อนข้างแข็ง คุณมีพลังในตัวสูงและพึ่งพาตัวเองได้ดี ` +
        `แต่บางครั้งดันไปข้างหน้าแรงเกินไป ควรเสริมธาตุ ${favList} ` +
        `เพื่อปล่อยพลังออกและสร้างสมดุล`
      : isJunghwa
      ? `พลังธาตุของคุณอยู่ในโซนสมดุล (중화) ปรับตัวได้ยืดหยุ่นในหลายสถานการณ์ ` +
        `ถือเป็นดวงที่กลมกล่อม เสริมธาตุ ${favList} อีกนิดจะยิ่งลงตัว`
      : `พลังธาตุประจำตัวคุณค่อนข้างอ่อน คุณไวต่อสิ่งรอบตัวและร่วมมือกับคนอื่นได้ดี ` +
        `ควรเสริมธาตุ ${favList} และหาพันธมิตรที่ไว้ใจได้ เพื่อหนุนพลังให้เต็ม`;
  } else {
    body = isStrong
      ? `Your day-master energy runs strong — self-reliant and driven, though you can ` +
        `push too hard at times. Strengthen ${favList} to release that power and stay balanced.`
      : isJunghwa
      ? `Your five elements sit in the balanced (중화) zone — you adapt flexibly to most ` +
        `situations. A well-rounded chart; a touch more ${favList} makes it click.`
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
