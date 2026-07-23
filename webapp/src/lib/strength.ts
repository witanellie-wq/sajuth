// Day Master strength (신강/신약) + favorable element (용신) — the depth layer.
//
// Classic saju weighs how much the chart supports vs drains the Day Master.
// The month branch (월령) dominates, the day branch (일지, the DM's seat) is
// next, other positions count less. This is a pragmatic weighting, not a full
// 십신/통근 engine — good enough to branch the reading meaningfully.

import type { SajuChart, Element } from "./saju";
import { relationTo, isSupport, generatedBy, generates, controls, ELEMENT_TH } from "./elements";
import type { Lang } from "./i18n";

// Five classical bands: 극신약 · 신약 · 균형(中和) · 신강 · 태강.
export type Band = "taegang" | "singang" | "junghwa" | "sinyak" | "geuksinyak";

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
    junghwa: "สมดุลพอดี (균형·中和)",
    sinyak: "พลังธาตุอ่อน (신약)",
    geuksinyak: "พลังธาตุอ่อนมาก (극신약)",
  },
  en: {
    taegang: "Very Strong Day Master (태강)",
    singang: "Strong Day Master (신강)",
    junghwa: "Balanced (中和)",
    sinyak: "Gentle Day Master (신약)",
    geuksinyak: "Very Gentle Day Master (극신약)",
  },
  ko: {
    taegang: "태강 — 일간이 매우 강함",
    singang: "신강 — 일간이 강함",
    junghwa: "균형(中和) — 강약이 고르게 잡힘",
    sinyak: "신약 — 일간이 약함",
    geuksinyak: "극신약 — 일간이 매우 약함",
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

// 상극의 역방향: element → the element that controls (극) it. Used to pick the
// remedy (약) for an excessive element — e.g. flooding water is dammed by earth.
const CONTROLLER: Record<Element, Element> = {
  wood: "metal", fire: "water", earth: "wood", metal: "fire", water: "earth",
};

// 과다 threshold: an element occupying 3+ of the 8 visible characters is
// excessive (과다) — it is the chart's 병(病) and can never be the 용신.
const EXCESS_RAW = 3;

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
  excess: {
    th: (el: string, n: number, dam: string) =>
      `ธาตุ ${el} มีมากถึง ${n} ตัวในดวง (과다) — ธาตุที่ล้นเกินจะกลายเป็นโทษ ไม่ควรเสริมอีก แต่ควรใช้ธาตุ ${dam} มาควบคุมให้อยู่ในสมดุล (억부)`,
    en: (el: string, n: number, dam: string) =>
      `${el} appears ${n} times — an excessive element turns harmful, so adding more is off the table. The remedy is ${dam}, which reins it in (억부).`,
    ko: (el: string, n: number, dam: string) =>
      `${el} 기운이 ${n}개로 넘치는 사주예요(과다). 넘치는 오행은 더 보태면 독이 되니, ${dam} 기운으로 눌러 다스리는 것이 처방입니다(억부).`,
  },
  floodedResource: {
    th: (res: string, dm: string) =>
      `อินซอง(印星·ธาตุแม่)ที่มากเกินไปกลับทำร้ายตัวเรา (모자멸자) — ธาตุ ${res} ที่ท่วมดวงทำให้ธาตุประจำตัว ${dm} ลอย ไม่มั่นคง`,
    en: (res: string, dm: string) =>
      `Too much of the resource element backfires (모자멸자): the flood of ${res} leaves your ${dm} day master afloat and unrooted.`,
    ko: (res: string, dm: string) =>
      `인성이 지나치면 오히려 일간을 해쳐요(모자멸자) — 넘치는 ${res} 위에 ${dm} 일간이 뿌리 없이 떠 있는 형국입니다.`,
  },
  cold: {
    th: "องค์ประกอบโดยรวมของดวงค่อนข้างเย็นและชื้น (한습) ต้องการความอบอุ่นจากธาตุไฟเป็นอันดับแรก (조후)",
    en: "The chart runs cold and damp overall (한습) — Fire's warmth comes first (조후).",
    ko: "원국 전체가 차고 습한 편이라(한습) 무엇보다 화(火)의 온기가 먼저 필요합니다(조후).",
  },
  hot: {
    th: "องค์ประกอบโดยรวมของดวงค่อนข้างร้อนและแห้ง (조열) ต้องการความเย็นจากธาตุน้ำเป็นอันดับแรก (조후)",
    en: "The chart runs hot and dry overall (조열) — cooling Water comes first (조후).",
    ko: "원국 전체가 덥고 건조한 편이라(조열) 무엇보다 수(水)의 서늘함이 먼저 필요합니다(조후).",
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

  // Raw visible-character counts (incl. the DM stem) — drive 과다 detection.
  const rawCounts: Record<Element, number> = {
    wood: 0, fire: 0, earth: 0, metal: 0, water: 0,
  };
  const allChars: Element[] = [
    chart.year.ganElement, chart.year.zhiElement,
    chart.month.ganElement, chart.month.zhiElement,
    dm, chart.day.zhiElement,
    ...(chart.hour ? [chart.hour.ganElement, chart.hour.zhiElement] : []),
  ];
  for (const el of allChars) rawCounts[el]++;

  const resourceEl = generatedBy(dm); // 인성
  const resourceExcess = rawCounts[resourceEl] >= EXCESS_RAW;

  let supRes = 0; // support from 인성
  let supPeer = 0; // support from 비겁
  let total = 0;
  for (const [el, w] of items) {
    total += w;
    if (!isSupport(relationTo(dm, el))) continue;
    if (el === resourceEl) supRes += w;
    else supPeer += w;
  }
  // 모자멸자: an excessive resource stops truly supporting the Day Master —
  // 수다목부(water-flooded wood floats) and its siblings. Cap its contribution.
  if (resourceExcess) supRes = Math.min(supRes, total * 0.35);
  let ratio = total > 0 ? (supRes + supPeer) / total : 0.5;

  // 천간합: Day Master combined with an adjacent stem (month or hour gan)
  // is partially bound → slightly weaker in practice.
  const partner = STEM_HE[chart.dayMaster];
  const adjacentStems = [chart.month.gan, ...(chart.hour ? [chart.hour.gan] : [])];
  if (partner && adjacentStems.includes(partner)) {
    ratio = Math.max(0, ratio - 0.06);
    notes.push(NOTE_TEXT.bound[lang]);
  }

  // Five classical bands.
  let band: Band;
  if (ratio >= 0.78) band = "taegang";
  else if (ratio >= 0.58) band = "singang";
  else if (ratio >= 0.42) band = "junghwa";
  else if (ratio >= 0.22) band = "sinyak";
  else band = "geuksinyak";

  // ── 용신 selection (억부 + 병약 + 조후) ────────────────────────────────
  // Principle: an excessive (과다) element is the chart's 병 — it is NEVER
  // recommended; its controller is the 약. Direction follows strength as usual.
  const isExcess = (el: Element) => rawCounts[el] >= EXCESS_RAW;
  const strongSide = ratio >= 0.5;

  let favorable: Element[];
  if (!strongSide && resourceExcess) {
    // Weak DM drowning in its own resource (수다목부 등): root the DM with
    // peers and dam the flood with the resource's controller — never add more.
    favorable = [dm, CONTROLLER[resourceEl]];
    notes.push(
      NOTE_TEXT.floodedResource[lang](elName[resourceEl], elName[dm])
    );
    notes.push(
      NOTE_TEXT.excess[lang](
        elName[resourceEl], rawCounts[resourceEl], elName[CONTROLLER[resourceEl]]
      )
    );
  } else {
    favorable = strongSide
      ? [generates(dm), controls(dm)] // 식상 · 재성
      : [resourceEl, dm]; // 인성 · 비겁
    // Filter out any candidate that is itself excessive; prescribe its
    // controller instead so the remedy suppresses the 병.
    const filtered: Element[] = [];
    for (const el of favorable) {
      if (isExcess(el)) {
        notes.push(
          NOTE_TEXT.excess[lang](elName[el], rawCounts[el], elName[CONTROLLER[el]])
        );
        if (!filtered.includes(CONTROLLER[el]) && !isExcess(CONTROLLER[el])) {
          filtered.push(CONTROLLER[el]);
        }
      } else {
        filtered.push(el);
      }
    }
    if (filtered.length === 0) filtered.push(CONTROLLER[dm]); // 관성 fallback
    favorable = filtered;
  }

  // 조후 overlay: the season's (or the chart composition's) craved element
  // takes priority — but never an element that is already excessive.
  const monthZhi = chart.month.zhi;
  const coldChart = rawCounts.water >= EXCESS_RAW && rawCounts.fire <= 1;
  const hotChart = rawCounts.fire >= EXCESS_RAW && rawCounts.water <= 1;
  if (WINTER.has(monthZhi)) {
    if (!favorable.includes("fire") && !isExcess("fire")) favorable.unshift("fire");
    notes.push(NOTE_TEXT.winter[lang]);
  } else if (SUMMER.has(monthZhi)) {
    if (!favorable.includes("water") && !isExcess("water")) favorable.unshift("water");
    notes.push(NOTE_TEXT.summer[lang]);
  } else if (coldChart) {
    if (!favorable.includes("fire")) favorable.unshift("fire");
    notes.push(NOTE_TEXT.cold[lang]);
  } else if (hotChart) {
    if (!favorable.includes("water")) favorable.unshift("water");
    notes.push(NOTE_TEXT.hot[lang]);
  }

  const favList = favorable.map((e) => elName[e]).join(lang === "th" ? " และ " : lang === "ko" ? "·" : " and ");

  const isStrong = band === "taegang" || band === "singang";
  const isJunghwa = band === "junghwa";

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
