// Compatibility (궁합) engine — scores two charts and writes a localized verdict.
//
// Blends three classic signals:
//   1. Day-master (일간) element relation — 상생 supportive, 상극 tension, same comfortable.
//   2. Day-branch (일지 = spouse palace) relation — 六合/三合 harmony, 六沖 clash.
//   3. 용신 complement — does each partner supply what the other's chart lacks?

import type { SajuChart } from "./saju";
import { relationTo } from "./elements";
import { analyzeStrength } from "./strength";
import type { Lang } from "./i18n";

export interface CompatSection {
  key: string;
  title: string;
  body: string;
  locked: boolean;
}

export interface Compatibility {
  score: number; // 0..99 overall
  intimate: number; // 0..99 속궁합 subscore (teaser shown free, details paid)
  bandTh: string; // localized band label (name kept for back-compat)
  headline: string;
  rel: string; // day-master relation key — drives premium content
  lang: Lang;
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
// 암합 (hidden combinations) — branches whose hidden stems combine covertly.
// (丑寅 lives in WOOHAP below to avoid double-counting.)
const AMHAP = new Set(["子戌", "卯申", "午亥", "寅未"]);
// 우합/隅合 (corner combinations, 모서리합) — adjacent "corner" pairs of the
// branch square: 丑寅, 辰巳, 未申, 戌亥. A subtle, steady pull.
const WOOHAP = new Set(["丑寅", "辰巳", "未申", "戌亥"]);

const WINTER = new Set(["亥", "子", "丑"]);
const SUMMER = new Set(["巳", "午", "未"]);

// What controls each element (element → its controller).
const CONTROLLER: Record<string, string> = {
  water: "earth", fire: "water", metal: "fire", wood: "metal", earth: "wood",
};
// What each element generates.
const GENERATES: Record<string, string> = {
  wood: "fire", fire: "earth", earth: "metal", metal: "water", water: "wood",
};

type LText = Record<Lang, string>;

const NOTES: Record<string, LText> = {
  dmResource: {
    th: "ธาตุประจำตัวของทั้งคู่ ‘ส่งเสริมกัน’ (相生) ฝ่ายหนึ่งช่วยเติมพลังให้อีกฝ่าย",
    en: "Your core elements feed each other (相生) — one naturally recharges the other.",
  },
  dmSame: {
    th: "ธาตุประจำตัวเหมือนกัน เข้าใจกันง่ายเหมือนเพื่อนสนิท แต่ต้องระวังความเหมือนจนเบื่อ",
    en: "Same core element — you understand each other like close friends; just don't let sameness turn stale.",
  },
  dmOpposite: {
    th: "ธาตุประจำตัวมีแรงดึงดูดแบบตรงข้าม (相剋) มีเสน่ห์และความท้าทายปนกัน",
    en: "Opposite-pole attraction (相剋) between your elements — charm and challenge mixed together.",
  },
  branchHe: {
    th: "เรือนคู่ครอง (일지) เป็น ‘六合’ — เข้าขากันสูงมาก ผูกพันแน่นแฟ้น",
    en: "Your spouse palaces (day branches) form 六合 harmony — deeply bonded and highly in sync.",
  },
  branchSanhe: {
    th: "เรือนคู่ครองเป็น ‘三合’ — เสริมกันดี ไปในทิศทางเดียวกัน",
    en: "Your spouse palaces form a 三合 trine — well aligned, heading the same direction.",
  },
  branchSame: {
    th: "เรือนคู่ครองธาตุเดียวกัน จูนกันง่าย",
    en: "Same spouse-palace energy — easy to tune to each other.",
  },
  branchChong: {
    th: "เรือนคู่ครองเป็น ‘六沖’ — มีแรงกระทบกัน ต้องสื่อสารและให้พื้นที่กันมากขึ้น",
    en: "Your spouse palaces clash (六沖) — extra communication and personal space are needed.",
  },
  yongBoth: {
    th: "ต่างเติมเต็มธาตุที่อีกฝ่ายขาด (용신) — เป็นคู่ที่ ‘พากันดีขึ้น’",
    en: "You each supply the element the other lacks (yongsin) — a pair that makes each other better.",
  },
  yongOne: {
    th: "ฝ่ายหนึ่งช่วยเติมธาตุที่อีกฝ่ายต้องการ ประคองกันได้ดี",
    en: "One of you supplies the element the other needs — good mutual support.",
  },
  climate: {
    th: "ดวงของทั้งคู่เติมเต็มอุณหภูมิให้กันอย่างสมบูรณ์ (조후) — ฝ่ายหนึ่งเย็นลึก อีกฝ่ายอบอุ่น เหมือนแสงแดดยามเช้าที่สาดลงทะเลหนาว อยู่ด้วยกันแล้วรู้สึก ‘พอดี’ อย่างประหลาด",
    en: "Your charts complete each other's temperature (조후 climate balance) — one runs deep and cool, the other warm, like morning sunlight on a winter sea. Together it simply feels right.",
  },
  control: {
    th: "ธาตุที่ล้นเกินของฝ่ายหนึ่งถูกธาตุของอีกฝ่ายโอบรับไว้พอดี (เช่น ดินโอบน้ำ 土克水) ทำให้อารมณ์และจังหวะชีวิตนิ่งขึ้นมากเมื่ออยู่ด้วยกัน",
    en: "One partner's overflowing element is gently banked by the other's (like earth holding water, 土克水) — life feels far steadier together.",
  },
  feed: {
    th: "มีหลายตำแหน่งในดวงที่ธาตุของฝ่ายหนึ่งคอย ‘หล่อเลี้ยง’ ธาตุของอีกฝ่าย ยิ่งใช้เวลาด้วยกัน อีกฝ่ายยิ่งเบ่งบาน",
    en: "Many positions in your charts where one partner's energy feeds the other's — the longer you're together, the more you both bloom.",
  },
  amhap: {
    th: "มีคู่ ‘암합(暗合)’ ซ่อนอยู่หลายตำแหน่ง — แรงดึงดูดลึก ๆ ที่อธิบายไม่ถูก คนนอกมองไม่เห็น แต่ใจของทั้งคู่รู้ดี",
    en: "Several hidden bonds (암합) run between your charts — a quiet, unexplainable pull that outsiders can't see but you both feel.",
  },
  onui: {
    th: "เดือนเกิด (월지) ของทั้งคู่เป็นราศีเดียวกัน — สบายใจเหมือนพี่น้อง (오누이) เข้าใจกันง่ายมาก แต่ประกายโรแมนติกจางเร็ว ต้องตั้งใจเดตกันต่อเนื่อง",
    en: "You share the same birth-month branch — comfortable like siblings (오누이). Easy understanding, but the romantic spark fades fast; keep dating on purpose.",
  },
  woohap: {
    th: "มีคู่ ‘우합(隅合)’ ระหว่างดวงของทั้งสอง (เช่น 술해합·축인합) — แรงดึงดูดแบบมุมชนมุม เงียบแต่เหนียวแน่น ยิ่งอยู่ใกล้ยิ่งผูกพันโดยไม่รู้ตัว",
    en: "A 우합 (corner combination — like 戌亥 or 丑寅) links your charts: a quiet, corner-to-corner pull that binds you more the longer you're close.",
  },
};

// 속궁합 (intimate chemistry) signal texts — assembled into the paid section.
const INTIMATE_TEXT = {
  intro: {
    th: (n: number) => `คะแนนเคมีเชิงลึก (속궁합) ของคู่คุณคือ ${n}%`,
    en: (n: number) => `Your intimate-chemistry (속궁합) score is ${n}%.`,
  },
  chong: {
    th: "แรงปะทะระหว่างเสาวัน/เสาเวลา (沖) กลายเป็นแรงดึงดูดทางกายที่รุนแรง — ยิ่งใกล้กันยิ่งร้อนแรง ทะเลาะแล้วยิ่งคิดถึง",
    en: "The clash (沖) between your day/hour pillars turns into fierce physical chemistry — the closer you get, the hotter it burns; even fights end in longing.",
  },
  amhap: {
    th: "암합 หลายตำแหน่งสร้างเคมีลับที่คนนอกมองไม่เห็น — สบตากันนิดเดียวก็รู้ใจ สัมผัสเดียวก็เข้าใจ",
    en: "Multiple hidden bonds (암합) create a secret chemistry outsiders can't see — one glance, one touch, and you both know.",
  },
  jeongim: {
    th: "ในดวงมี ‘정임합(丁壬)’ — คู่ธาตุแห่งแรงดึงดูดต้านไม่ได้ตามตำรา เสน่หาลึก เหนียวแน่น และหวานเป็นพิเศษ",
    en: "Your charts carry the 丁壬 combination — the textbook bond of irresistible attraction. Deep, clinging, unusually sweet.",
  },
  water: {
    th: "เสาวัน/เสาปีของทั้งคู่รวมกันกลายเป็นธาตุน้ำ (합화수) — ธาตุแห่งความใกล้ชิด อารมณ์ และความลึกซึ้งทางกาย คู่แบบนี้เคมีตอนอยู่กันสองคนดีเป็นพิเศษ",
    en: "Your day/year branches combine into Water (합화수) — the element of closeness, emotion, and physical depth. Alone together, your chemistry peaks.",
  },
  base: {
    th: "เคมีเชิงลึกของคู่คุณอยู่ในระดับอบอุ่น ค่อย ๆ สร้างความไว้ใจ ความใกล้ชิดจะลึกขึ้นตามเวลา",
    en: "Your intimate chemistry runs warm and steady — build trust and it deepens with time.",
  },
};

const INTIMATE_TITLE: Record<Lang, string> = {
  th: "ความเข้ากันเชิงลึก (속궁합)",
  en: "Intimate Chemistry (속궁합)",
};

const BANDS: Array<{ min: number; band: LText; headline: LText }> = [
  {
    min: 85,
    band: { th: "เนื้อคู่ระดับพรหมลิขิต", en: "A Destined Match" },
    headline: {
      th: "เป็นคู่ที่ส่งเสริมและเข้าใจกันสูงมาก ยิ่งอยู่ยิ่งดี",
      en: "A pair that lifts and understands each other — the longer together, the better it gets.",
    },
  },
  {
    min: 70,
    band: { th: "เข้ากันได้ดีมาก", en: "Very Compatible" },
    headline: {
      th: "เคมีตรงกันหลายด้าน ประคองความต่างเล็กน้อยก็ไปได้ไกล",
      en: "Chemistry aligns on many fronts — smooth out the small differences and you'll go far.",
    },
  },
  {
    min: 55,
    band: { th: "เข้ากันได้ดี", en: "Compatible" },
    headline: {
      th: "มีจุดเสริมกันชัดเจน ถ้าเข้าใจจังหวะของกันและกันจะลงตัว",
      en: "Clear complementary strengths — sync your rhythms and it clicks.",
    },
  },
  {
    min: 40,
    band: { th: "ต้องปรับจูนกัน", en: "Needs Tuning" },
    headline: {
      th: "มีทั้งแรงดึงดูดและแรงเสียดทาน การสื่อสารคือกุญแจสำคัญ",
      en: "Both attraction and friction are present — communication is the key.",
    },
  },
  {
    min: 0,
    band: { th: "ท้าทาย แต่ไม่ใช่เป็นไปไม่ได้", en: "Challenging, Not Impossible" },
    headline: {
      th: "ความต่างสูง ต้องอาศัยความเข้าใจและพื้นที่ให้กันมากเป็นพิเศษ",
      en: "High contrast — this pairing needs extra understanding and generous space.",
    },
  },
];

const PREMIUM_TITLES: Record<Lang, Array<[string, string]>> = {
  th: [
    ["marriage", "ดวงแต่งงานของคู่นี้"],
    ["conflict", "จุดที่ต้องระวังเป็นพิเศษ"],
    ["longterm", "อนาคตระยะยาวของความสัมพันธ์"],
  ],
  en: [
    ["marriage", "Marriage Outlook"],
    ["conflict", "What to Watch Out For"],
    ["longterm", "The Long Run"],
  ],
};

const LOCKED_BODY: LText = {
  th: "ปลดล็อกเพื่ออ่านผลวิเคราะห์เชิงลึกของคู่คุณ",
  en: "Unlock to read the in-depth analysis for your pair",
};

const NOTE_TITLE: Record<Lang, (i: number) => string> = {
  th: (i) => `จุดที่ ${i}`,
  en: (i) => `Point ${i}`,
};

// Premium bodies keyed by the day-master relation.
const PREMIUM_COMPAT: Record<string, Record<string, LText>> = {
  same: {
    marriage: {
      th: "คู่ธาตุเดียวกันแต่งงานแล้วเหมือนได้เพื่อนร่วมทีมตลอดชีวิต จังหวะชีวิตใกล้กัน ตัดสินใจใหญ่ ๆ ไปทางเดียวกันง่าย",
      en: "Married, you're lifelong teammates — matching rhythms make the big decisions come easy.",
    },
    conflict: {
      th: "จุดเสี่ยงคือ ‘เหมือนกันเกินไป’ — พอเหนื่อยพร้อมกันจะไม่มีใครประคองใคร หาสิ่งใหม่ทำด้วยกันเป็นระยะ",
      en: "The risk is being too alike — when you both burn out at once, no one carries the other. Keep finding new things to do together.",
    },
    longterm: {
      th: "ระยะยาวมั่นคงแบบเพื่อนคู่คิด ยิ่งอายุมากยิ่งสนิท เงื่อนไขเดียวคืออย่าลืมเติมความตื่นเต้นให้กันบ้าง",
      en: "Long-term, a steady best-friend marriage that grows closer with age — just keep feeding it fresh excitement.",
    },
  },
  resource: {
    marriage: {
      th: "คู่แบบ ‘ผู้เติม-ผู้รับ’ (相生) แต่งงานแล้วฝ่ายหนึ่งจะเป็นกำลังใจหลักของอีกฝ่ายโดยธรรมชาติ บ้านจะเป็นที่พักใจจริง ๆ",
      en: "A giver-and-receiver pair (相生) — one of you naturally becomes the other's main source of strength; home becomes a true resting place.",
    },
    conflict: {
      th: "ระวังสมดุลการให้-การรับเอียงไปข้างเดียวจนฝ่ายให้หมดแรง ต้องสลับบทบาทกันบ้าง",
      en: "Watch for one-sided giving until the giver runs dry — swap roles from time to time.",
    },
    longterm: {
      th: "ยิ่งอยู่ด้วยกันนานยิ่งเข้าขา เพราะพลังงานไหลเวียนต่อกันเป็นวงจร คู่แบบนี้แก่ไปด้วยกันได้สวยมาก",
      en: "The longer together, the better attuned — your energies circulate in a loop. This pair grows old beautifully.",
    },
  },
  output: {
    marriage: {
      th: "คู่ที่ฝ่ายหนึ่งจุดประกายความคิดสร้างสรรค์ของอีกฝ่าย ชีวิตแต่งงานจะไม่น่าเบื่อ เหมาะทำธุรกิจคู่",
      en: "One of you sparks the other's creativity — married life never gets boring; great pair for a couple business.",
    },
    conflict: {
      th: "พลังไหลออกทางเดียวนาน ๆ อาจทำให้ฝ่ายที่ถูกดึงพลังรู้สึกล้า ต้องมีเวลาชาร์จส่วนตัว และอย่าเอาไอเดียมาแข่งกันเอง",
      en: "Energy flowing one way too long tires the drained side — protect personal recharge time, and don't compete over ideas.",
    },
    longterm: {
      th: "ระยะยาวโตไปด้วยกันแบบหุ้นส่วนชีวิต ทั้งเรื่องงานและความฝัน ขอแค่แบ่งบทให้ชัดว่าใครนำเรื่องไหน",
      en: "Long-term, you grow as true life partners — in work and in dreams. Just assign clearly who leads what.",
    },
  },
  wealth: {
    marriage: {
      th: "คู่แรงดึงดูดแบบ ‘ขั้วตรงข้ามที่ลงตัว’ ฝ่ายหนึ่งคุมจังหวะ อีกฝ่ายเปิดโอกาส เรื่องการเงินครอบครัวมักไปได้ดีถ้าวางกติกาแต่แรก",
      en: "Opposites that click — one sets the tempo, the other opens doors. Family finances thrive if you set ground rules early.",
    },
    conflict: {
      th: "แรงดึงดูดสูงมาพร้อมแรงเสียดทาน เรื่องเงินและอำนาจการตัดสินใจคือสนามหลัก ตกลงกันให้ชัดตั้งแต่ต้น",
      en: "Strong attraction comes with friction — money and decision power are the main arena; agree who owns what from the start.",
    },
    longterm: {
      th: "ถ้าผ่านการปรับจูน 2-3 ปีแรกไปได้ คู่แบบนี้จะแข็งแรงมาก เพราะต่างคนต่างเติมสิ่งที่อีกฝ่ายไม่มี",
      en: "Survive the first 2–3 years of tuning and this pair becomes very strong — each fills what the other lacks.",
    },
  },
  officer: {
    marriage: {
      th: "คู่ที่อีกฝ่ายทำให้คุณอยากเป็นคนที่ดีขึ้น มีวินัยขึ้น ชีวิตแต่งงานมีโครงสร้างชัดเจน เหมาะกับคนที่อยากสร้างครอบครัวแบบจริงจัง",
      en: "A partner who makes you want to be better — married life has real structure; ideal for serious family-builders.",
    },
    conflict: {
      th: "ระวังความรู้สึก ‘ถูกควบคุม’ สะสมโดยไม่พูด ฝ่ายที่ถูกกดต้องกล้าบอกขอบเขต และฝ่ายที่นำต้องฟังมากกว่าสั่ง",
      en: "Beware the silent buildup of feeling controlled — the led must voice boundaries, and the leader must listen more than direct.",
    },
    longterm: {
      th: "ระยะยาวจะกลายเป็นคู่ที่คนรอบข้างนับถือ ขอแค่เปลี่ยนการควบคุมเป็นการดูแล ความเกรงใจเป็นความเข้าใจ",
      en: "Long-term you become a couple others respect — just turn control into care, and courtesy into understanding.",
    },
  },
};

function branchPair(a: string, b: string): "he" | "chong" | "sanhe" | "same" | "none" {
  if (a === b) return "same";
  if (LIU_HE.has(a + b) || LIU_HE.has(b + a)) return "he";
  if (LIU_CHONG.has(a + b) || LIU_CHONG.has(b + a)) return "chong";
  if (SAN_HE.some((g) => g.includes(a) && g.includes(b))) return "sanhe";
  return "none";
}

function clamp(n: number): number {
  // Cap at 97 — even destined pairs keep a little mystery.
  return Math.max(0, Math.min(97, Math.round(n)));
}

export function computeCompatibility(
  a: SajuChart,
  b: SajuChart,
  lang: Lang = "th"
): Compatibility {
  let score = 40; // base
  const notes: string[] = [];

  // 1. Day master element relation.
  const rel = relationTo(a.dayMasterElement, b.dayMasterElement);
  const relBack = relationTo(b.dayMasterElement, a.dayMasterElement);
  if (rel === "resource" || relBack === "resource") {
    score += 25;
    notes.push(NOTES.dmResource[lang]);
  } else if (rel === "same") {
    score += 12;
    notes.push(NOTES.dmSame[lang]);
  } else if (rel === "wealth" || rel === "officer") {
    score += 6;
    notes.push(NOTES.dmOpposite[lang]);
  }

  // 2. Day-branch (spouse palace) relation.
  const bp = branchPair(a.day.zhi, b.day.zhi);
  if (bp === "he") {
    score += 30;
    notes.push(NOTES.branchHe[lang]);
  } else if (bp === "sanhe") {
    score += 24;
    notes.push(NOTES.branchSanhe[lang]);
  } else if (bp === "same") {
    score += 12;
    notes.push(NOTES.branchSame[lang]);
  } else if (bp === "chong") {
    score -= 18;
    notes.push(NOTES.branchChong[lang]);
  } else {
    score += 6;
  }

  // 3. 용신 complement — does each supply the other's favorable element?
  const sa = analyzeStrength(a, lang);
  const sb = analyzeStrength(b, lang);
  const aHelpsB = sb.favorable.includes(a.dayMasterElement);
  const bHelpsA = sa.favorable.includes(b.dayMasterElement);
  if (aHelpsB && bHelpsA) {
    score += 16;
    notes.push(NOTES.yongBoth[lang]);
  } else if (aHelpsB || bHelpsA) {
    score += 8;
    notes.push(NOTES.yongOne[lang]);
  }

  // 4. 조후 상보 — one cold chart (water excess / winter-born) warmed by a
  // fire-carrying partner, or a hot chart cooled by a watery one.
  const coldA = a.elementCounts.water >= 3 || WINTER.has(a.month.zhi);
  const coldB = b.elementCounts.water >= 3 || WINTER.has(b.month.zhi);
  const warmA = a.elementCounts.fire >= 2 || a.dayMasterElement === "fire";
  const warmB = b.elementCounts.fire >= 2 || b.dayMasterElement === "fire";
  const hotA = a.elementCounts.fire >= 3 || SUMMER.has(a.month.zhi);
  const hotB = b.elementCounts.fire >= 3 || SUMMER.has(b.month.zhi);
  const wetA = a.elementCounts.water >= 2 || a.dayMasterElement === "water";
  const wetB = b.elementCounts.water >= 2 || b.dayMasterElement === "water";
  if ((coldA && warmB) || (coldB && warmA) || (hotA && wetB) || (hotB && wetA)) {
    score += 10;
    notes.push(NOTES.climate[lang]);
  }

  // 5. 과다 제어 — climate-critical excess (flooding water / raging fire)
  // held by the partner's controller: 토극수 (earth banks water) or
  // 수극화 (water cools fire). Restricted to water/fire so it stays special.
  const excessControlled = (x: SajuChart, y: SajuChart): boolean =>
    (["water", "fire"] as const).some(
      (el) =>
        x.elementCounts[el] >= 3 &&
        (y.elementCounts as Record<string, number>)[CONTROLLER[el]] >= 2
    );
  if (excessControlled(a, b) || excessControlled(b, a)) {
    score += 6;
    notes.push(NOTES.control[lang]);
  }

  // 6. 상생 자리 — distinct element pairs where one partner's present element
  // generates an element the other actually has. More feeding lanes = better.
  const present = (c: SajuChart): string[] =>
    (Object.entries(c.elementCounts) as Array<[string, number]>)
      .filter(([, n]) => n > 0)
      .map(([el]) => el);
  const feedLanes = (from: SajuChart, to: SajuChart): number =>
    present(from).filter((el) => present(to).includes(GENERATES[el])).length;
  const lanes = Math.max(feedLanes(a, b), feedLanes(b, a));
  if (lanes >= 4) {
    score += Math.min(5, lanes);
    notes.push(NOTES.feed[lang]);
  }

  // 7. 암합 — hidden combinations across the two charts' branches.
  const branchesOf = (c: SajuChart): string[] => [
    c.year.zhi,
    c.month.zhi,
    c.day.zhi,
    ...(c.hour ? [c.hour.zhi] : []),
  ];
  const amhapPairs = new Set<string>();
  for (const ba of branchesOf(a))
    for (const bb of branchesOf(b)) {
      if (AMHAP.has(ba + bb) || AMHAP.has(bb + ba)) {
        amhapPairs.add([ba, bb].sort().join(""));
      }
    }
  if (amhapPairs.size > 0) {
    score += Math.min(6, amhapPairs.size * 3);
    notes.push(NOTES.amhap[lang]);
  }

  // 8. 우합/모서리합 — corner pairs across the two charts' branches.
  const woohapFound = branchesOf(a).some((x) =>
    branchesOf(b).some((y) => WOOHAP.has(x + y) || WOOHAP.has(y + x))
  );
  if (woohapFound) {
    score += 4;
    notes.push(NOTES.woohap[lang]);
  }

  // 9. 오누이 궁합 — same month branch (월지) reads sibling-like: cozy but
  // low on romantic spark. Docked hard (classically up to -30).
  if (a.month.zhi === b.month.zhi) {
    score -= 12;
    notes.push(NOTES.onui[lang]);
  }

  // ── 속궁합 (intimate chemistry) subscore ──────────────────────────────
  let intimate = 50;
  const intimateReasons: string[] = [];

  // Day/hour pillar clash across the two charts → physical spark UP.
  const dhA = [a.day.zhi, ...(a.hour ? [a.hour.zhi] : [])];
  const dhB = [b.day.zhi, ...(b.hour ? [b.hour.zhi] : [])];
  const crossChong = dhA.some((x) =>
    dhB.some((y) => LIU_CHONG.has(x + y) || LIU_CHONG.has(y + x))
  );
  if (crossChong) {
    intimate += 15;
    intimateReasons.push(INTIMATE_TEXT.chong[lang]);
  }

  // 암합 abundance → secret chemistry.
  if (amhapPairs.size > 0) {
    intimate += Math.min(16, amhapPairs.size * 8);
    intimateReasons.push(INTIMATE_TEXT.amhap[lang]);
  }

  // 정임합 (丁壬) across the charts — the classic irresistible-attraction pair.
  const stemsA = [a.year.gan, a.month.gan, a.day.gan, ...(a.hour ? [a.hour.gan] : [])];
  const stemsB = [b.year.gan, b.month.gan, b.day.gan, ...(b.hour ? [b.hour.gan] : [])];
  const jeongim =
    (stemsA.includes("丁") && stemsB.includes("壬")) ||
    (stemsA.includes("壬") && stemsB.includes("丁"));
  if (jeongim) {
    intimate += 15;
    intimateReasons.push(INTIMATE_TEXT.jeongim[lang]);
  }

  // 일지/년지 합이 水로 화하는 경우 (巳申합수, 申子辰 수국) → intimacy UP.
  const dyA = [a.day.zhi, a.year.zhi];
  const dyB = [b.day.zhi, b.year.zhi];
  const WATER_TRINE = ["申", "子", "辰"];
  const waterCombo = dyA.some((x) =>
    dyB.some(
      (y) =>
        x + y === "巳申" ||
        y + x === "巳申" ||
        (WATER_TRINE.includes(x) && WATER_TRINE.includes(y) && x !== y)
    )
  );
  if (waterCombo) {
    intimate += 12;
    intimateReasons.push(INTIMATE_TEXT.water[lang]);
  }

  intimate = Math.max(20, Math.min(99, intimate));

  const intimateBody =
    INTIMATE_TEXT.intro[lang](intimate) +
    " " +
    (intimateReasons.length ? intimateReasons.join(" ") : INTIMATE_TEXT.base[lang]);

  const s = clamp(score);
  const bandDef = BANDS.find((x) => s >= x.min)!;

  // The whole written analysis sits behind one 89 THB unlock — only the
  // score/band/headline are free teasers. Note bodies are real text (blurred
  // until paid); premium bodies stay placeholder until unlockCompat().
  const sections: CompatSection[] = [
    { key: "overview", title: "", body: bandDef.headline[lang], locked: false },
    ...notes.map((n, i) => ({
      key: `note${i + 1}`,
      title: NOTE_TITLE[lang](i + 1),
      body: n,
      locked: true,
    })),
    // 속궁합 detail — real body (signal-dependent), blurred until paid.
    { key: "intimate", title: INTIMATE_TITLE[lang], body: intimateBody, locked: true },
    ...PREMIUM_TITLES[lang].map(([key, title]) => ({
      key,
      title,
      body: LOCKED_BODY[lang],
      locked: true,
    })),
  ];

  return {
    score: s,
    intimate,
    bandTh: bandDef.band[lang],
    headline: bandDef.headline[lang],
    rel,
    lang,
    sections,
  };
}

/** Reveal the full compat analysis after payment (notes + premium bodies). */
export function unlockCompat(
  sections: CompatSection[],
  rel: string,
  lang: Lang = "th"
): CompatSection[] {
  const bodies = PREMIUM_COMPAT[rel] ?? PREMIUM_COMPAT.same;
  return sections.map((s) => {
    if (!s.locked) return s;
    if (bodies[s.key]) return { ...s, body: bodies[s.key][lang], locked: false };
    return { ...s, locked: false }; // notes — real body, just blurred until paid
  });
}
