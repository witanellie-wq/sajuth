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
  score: number; // 0..100
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
  return Math.max(0, Math.min(100, Math.round(n)));
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
    ...PREMIUM_TITLES[lang].map(([key, title]) => ({
      key,
      title,
      body: LOCKED_BODY[lang],
      locked: true,
    })),
  ];

  return {
    score: s,
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
