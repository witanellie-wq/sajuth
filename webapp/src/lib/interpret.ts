// Interpretation engine.
//
// Turns a SajuChart into report sections in the requested language (th/en).
// This is the cheap, deterministic template layer (cost 0, instant). In
// production the final prose can be passed through Claude for extra polish
// (see rewrite.ts) — these templates are the seed + the offline fallback.

import type { SajuChart, Element } from "./saju";
import { analyzeStrength } from "./strength";
import { todayFortune, TODAY_PREFIX } from "./today";
import type { Lang } from "./i18n";

export interface ReportSection {
  key: string;
  title: string;
  body: string;
  locked: boolean; // true → shown blurred behind the paywall
}

type LText = Record<Lang, string>;

const ELEMENT_NAME: Record<Lang, Record<Element, string>> = {
  th: {
    wood: "ไม้ (木)", fire: "ไฟ (火)", earth: "ดิน (土)",
    metal: "ทอง (金)", water: "น้ำ (水)",
  },
  en: {
    wood: "Wood (木)", fire: "Fire (火)", earth: "Earth (土)",
    metal: "Metal (金)", water: "Water (水)",
  },
};

// Day Master (일간) → core personality. Keyed by the 10 heavenly stems.
const DAY_MASTER: Record<string, LText> = {
  "甲": {
    th: "คุณคือ ‘ต้นไม้ใหญ่’ — ตรงไปตรงมา มีหลักการ และเป็นที่พึ่งของคนรอบข้าง คุณเติบโตขึ้นเรื่อย ๆ และไม่ชอบยอมแพ้ แต่บางครั้งดื้อรั้นเกินไปจนไม่ยอมโอนอ่อน",
    en: "You are the Great Tree — upright, principled, someone others lean on. You keep growing and hate giving up, though at times you're too stubborn to bend.",
  },
  "乙": {
    th: "คุณคือ ‘ไม้เลื้อย’ — ยืดหยุ่น ปรับตัวเก่ง และอ่อนโยน คุณอยู่รอดได้ในทุกสภาพแวดล้อมด้วยความนุ่มนวล แต่ควรระวังการเกรงใจคนอื่นจนลืมความต้องการของตัวเอง",
    en: "You are the Vine — flexible, adaptive, and gentle. You thrive in any environment through softness, but be careful not to please others until you forget your own needs.",
  },
  "丙": {
    th: "คุณคือ ‘ดวงอาทิตย์’ — สดใส อบอุ่น และเป็นศูนย์กลางที่ดึงดูดผู้คน คุณให้พลังกับคนรอบตัวได้เสมอ แต่พออารมณ์ขึ้นก็ร้อนแรงและเปิดเผยเกินไป",
    en: "You are the Sun — bright, warm, a natural center of attention. You energize everyone around you, but when emotions flare you can burn hot and show too much.",
  },
  "丁": {
    th: "คุณคือ ‘เปลวเทียน’ — ละเอียดอ่อน มีเสน่ห์เงียบ ๆ และใส่ใจรายละเอียด คุณอบอุ่นกับคนที่ไว้ใจ แต่คิดมากและอ่อนไหวกับคำพูดของคนอื่น",
    en: "You are the Candle Flame — delicate, quietly charming, detail-minded. You're warm with those you trust, but you overthink and words affect you deeply.",
  },
  "戊": {
    th: "คุณคือ ‘ภูเขา’ — หนักแน่น มั่นคง และน่าเชื่อถือ คุณเป็นหลักให้คนอื่นพิงได้ แต่เปลี่ยนแปลงช้าและเก็บความรู้สึกไว้คนเดียวบ่อย ๆ",
    en: "You are the Mountain — steady, solid, dependable. Others lean on you, but you change slowly and often keep your feelings to yourself.",
  },
  "己": {
    th: "คุณคือ ‘ผืนดินเพาะปลูก’ — โอบอ้อม ดูแลคนเก่ง และประนีประนอม คุณทำให้ทุกอย่างเติบโตได้ แต่ระวังการแบกภาระคนอื่นไว้จนเหนื่อยเอง",
    en: "You are the Fertile Soil — nurturing, caring, diplomatic. You make everything grow, but watch out for carrying everyone's burdens until you exhaust yourself.",
  },
  "庚": {
    th: "คุณคือ ‘เหล็กกล้า’ — เด็ดขาด ยุติธรรม และลงมือจริง คุณกล้าตัดสินใจในเรื่องที่คนอื่นลังเล แต่บางครั้งตรงจนดูแข็งกระด้าง",
    en: "You are Forged Steel — decisive, fair, action-first. You make the calls others hesitate on, though your directness can come across as blunt.",
  },
  "辛": {
    th: "คุณคือ ‘อัญมณี’ — ประณีต มีรสนิยม และภูมิใจในตัวเอง คุณโดดเด่นด้วยคุณภาพ ไม่ใช่เสียงดัง แต่ไวต่อคำวิจารณ์และเก็บมาคิด",
    en: "You are the Jewel — refined, tasteful, quietly proud. You stand out through quality, not volume, but criticism cuts deep and stays with you.",
  },
  "壬": {
    th: "คุณคือ ‘มหาสมุทร’ — คิดกว้าง อิสระ และฉลาดปรับตัว คุณมองภาพใหญ่ได้ดีและเข้ากับคนหลากหลาย แต่บางครั้งใจลอยและเบื่อง่าย",
    en: "You are the Ocean — broad-minded, free, cleverly adaptive. You see the big picture and get along with all kinds of people, but you drift and bore easily.",
  },
  "癸": {
    th: "คุณคือ ‘สายฝน’ — อ่อนโยน ลึกซึ้ง และมีสัญชาตญาณดี คุณเข้าใจความรู้สึกคนอื่นไว แต่คิดเยอะและเก็บอารมณ์ไว้ข้างใน",
    en: "You are the Gentle Rain — soft, deep, intuitive. You read others' feelings instantly, but you overthink and keep emotions inside.",
  },
};

const TITLES: Record<Lang, Record<string, string>> = {
  th: {
    personality: "นิสัยพื้นฐานของคุณ",
    elements: "สมดุลธาตุทั้งห้า (โอแฮง)",
    love: "ความรักและเนื้อคู่",
    career: "การงานและเส้นทางอาชีพที่ใช่",
    wealth: "โชคลาภและการเงิน",
    luck10: "ดวงชะตา 10 ปีข้างหน้า (แดวอน)",
    lockedBody: "ปลดล็อกเพื่ออ่านผลวิเคราะห์แบบละเอียดของหมวดนี้",
  },
  en: {
    personality: "Your Core Personality",
    elements: "Five-Element Balance (Ohaeng)",
    love: "Love & Soulmate",
    career: "Career Path That Fits You",
    wealth: "Wealth & Money Luck",
    luck10: "The Next 10 Years (Daeun)",
    lockedBody: "Unlock to read the full analysis of this section",
  },
};

function dominantElement(counts: Record<Element, number>): Element {
  return (Object.keys(counts) as Element[]).reduce((a, b) =>
    counts[b] > counts[a] ? b : a
  );
}

function missingElements(counts: Record<Element, number>): Element[] {
  return (Object.keys(counts) as Element[]).filter((e) => counts[e] === 0);
}

export function interpret(chart: SajuChart, lang: Lang = "th"): ReportSection[] {
  const t = TITLES[lang];
  const elName = ELEMENT_NAME[lang];
  const sections: ReportSection[] = [];

  // 1. Core personality — FREE (the hook)
  sections.push({
    key: "personality",
    title: t.personality,
    body:
      DAY_MASTER[chart.dayMaster]?.[lang] ??
      (lang === "th"
        ? "ธาตุประจำวันเกิดของคุณสะท้อนบุคลิกเฉพาะตัวที่โดดเด่น"
        : "Your birth-day element reflects a distinctive personality."),
    locked: false,
  });

  // 2. Five-element balance — FREE
  const dom = dominantElement(chart.elementCounts);
  const missing = missingElements(chart.elementCounts);
  const balanceBody =
    lang === "th"
      ? `ธาตุที่โดดเด่นในดวงของคุณคือ ${elName[dom]} ` +
        `ซึ่งเป็นพลังงานหลักที่ขับเคลื่อนชีวิตคุณ` +
        (missing.length
          ? ` ส่วนธาตุที่ขาดคือ ${missing.map((e) => elName[e]).join(", ")} — ` +
            `เป็นจุดที่ควรเสริมเพื่อสมดุลชีวิต`
          : ` ธาตุทั้งห้าของคุณค่อนข้างสมดุล ถือว่าเป็นดวงที่กลมกล่อม`)
      : `The dominant element in your chart is ${elName[dom]} — the main energy ` +
        `driving your life.` +
        (missing.length
          ? ` Missing: ${missing.map((e) => elName[e]).join(", ")} — worth ` +
            `strengthening to bring your life into balance.`
          : ` Your five elements are well balanced — a smooth, rounded chart.`);
  sections.push({ key: "elements", title: t.elements, body: balanceBody, locked: false });

  // 3. Day Master strength (신강/신약) + 용신 — FREE, the depth layer
  const strength = analyzeStrength(chart, lang);
  sections.push({
    key: "strength",
    title:
      lang === "th"
        ? `พลังธาตุประจำตัว — ${strength.bandLabel}`
        : `Day-Master Energy — ${strength.bandLabel}`,
    body: strength.body,
    locked: false,
  });

  // 4. Today's fortune — FREE, changes daily (revisit hook)
  const today = todayFortune(chart, new Date(), lang);
  sections.push({
    key: "today",
    title: `${TODAY_PREFIX[lang]} · ${today.title}`,
    body: today.body,
    locked: false,
  });

  // 5-8. Locked premium sections. Real bodies live in PREMIUM_BY_DAY_MASTER
  // and are revealed by unlock(); here they stay hidden behind the blur.
  for (const key of ["love", "career", "wealth", "luck10"]) {
    sections.push({ key, title: t[key], body: t.lockedBody, locked: true });
  }

  return sections;
}

// Premium bodies keyed by Day Master (일간, 10 stems) so two people who share
// an element but differ in yin/yang still get distinct readings.
const PREMIUM_BY_DAY_MASTER: Record<string, Record<string, LText>> = {
  "甲": {
    love: {
      th: "คุณรักแบบจริงจังและปกป้อง มองหาคนที่เติบโตไปด้วยกัน ระวังการยึดหลักการจนไม่ยอมง้อ",
      en: "You love loyally and protectively, seeking a partner to grow with. Don't let your principles keep you from making up first.",
    },
    career: {
      th: "เหมาะกับงานที่ได้บุกเบิกและนำทีม เช่น ผู้ก่อตั้ง การศึกษา หรือสายที่ได้สร้างจากศูนย์",
      en: "Suited to pioneering and leading — founding something, education, or building from zero.",
    },
    wealth: {
      th: "การเงินโตแบบต้นไม้ ค่อยเป็นค่อยไปแต่มั่นคง ลงทุนระยะยาวเข้าทางคุณ",
      en: "Your money grows like a tree — slow but solid. Long-term investing is your lane.",
    },
    luck10: {
      th: "10 ปีข้างหน้าเป็นช่วงวางรากและขยายอาณาเขต สิ่งที่ปลูกวันนี้จะเป็นป่าในวันหน้า",
      en: "The next decade is for putting down roots and expanding — what you plant now becomes a forest.",
    },
  },
  "乙": {
    love: {
      th: "คุณรักแบบยืดหยุ่นและประคับประคอง ผูกพันลึก ระวังยอมอีกฝ่ายจนลืมใจตัวเอง",
      en: "You love flexibly and supportively, bonding deep. Careful not to yield until you lose your own heart.",
    },
    career: {
      th: "เก่งงานที่ต้องปรับตัวและประสานคน เช่น ดีไซน์ พีอาร์ งานบริการ หรือคอนเทนต์",
      en: "You shine in adaptive, people-weaving work — design, PR, service, or content.",
    },
    wealth: {
      th: "หาเงินได้หลายช่องทางเล็ก ๆ รวมกันแล้วมั่นคง เหมาะกระจายความเสี่ยง",
      en: "Many small income streams add up to stability — diversification suits you.",
    },
    luck10: {
      th: "10 ปีข้างหน้าค่อย ๆ ไต่ขึ้นอย่างนุ่มนวล เครือข่ายคนคือทรัพย์สินที่ใหญ่ที่สุด",
      en: "A soft, steady climb over the next decade — your network is your biggest asset.",
    },
  },
  "丙": {
    love: {
      th: "คุณรักอย่างร้อนแรงและเปิดเผย ดึงดูดคนง่าย แต่ควรระวังใจร้อนช่วงมีปากเสียง",
      en: "You love passionately and openly, attracting people with ease — just watch the temper in arguments.",
    },
    career: {
      th: "โดดเด่นในงานที่ได้เป็นสปอตไลต์ เช่น การตลาด บันเทิง งานขาย หรือครีเอทีฟ",
      en: "You shine in the spotlight — marketing, entertainment, sales, or creative fields.",
    },
    wealth: {
      th: "รายได้เข้าไวแต่ใช้ไว ตั้งระบบออมอัตโนมัติไว้กันเงินรั่ว",
      en: "Money comes fast and goes fast — set up automatic savings to stop the leaks.",
    },
    luck10: {
      th: "10 ปีข้างหน้ามีจังหวะชื่อเสียงมาแรง ใช้โอกาสตอนพีคให้เต็มที่",
      en: "A fame window opens in the coming decade — use your peak to the fullest.",
    },
  },
  "丁": {
    love: {
      th: "คุณรักแบบอบอุ่นลึกซึ้งกับคนที่ไว้ใจ แต่คิดมากและอ่อนไหว ต้องการความมั่นใจจากคู่",
      en: "You love warmly and deeply once trust is built, but you overthink — you need steady reassurance from a partner.",
    },
    career: {
      th: "เก่งงานละเอียดที่ต้องใช้ฝีมือเฉพาะ เช่น งานคราฟต์ เขียน วิจัย หรือดูแลเฉพาะทาง",
      en: "You excel at fine, skilled work — craft, writing, research, or specialist care.",
    },
    wealth: {
      th: "เงินมาจากความเชี่ยวชาญเฉพาะตัว สะสมช้าแต่ยั่งยืน",
      en: "Wealth comes from your unique expertise — it builds slowly but lasts.",
    },
    luck10: {
      th: "10 ปีข้างหน้าเป็นช่วงที่ฝีมือเปล่งประกายและมีคนเห็นคุณค่าอย่างแท้จริง",
      en: "In the coming decade your craft finally shines and gets truly recognized.",
    },
  },
  "戊": {
    love: {
      th: "คุณเป็นคู่ที่มั่นคงและเป็นหลักให้พิงได้ ระวังเก็บความรู้สึกไว้จนอีกฝ่ายเดาใจไม่ออก",
      en: "You're a steady anchor of a partner — just don't bottle feelings until they can't read you.",
    },
    career: {
      th: "เหมาะกับงานที่ต้องอาศัยความน่าเชื่อถือ เช่น อสังหาฯ บริหาร ก่อสร้าง หรือราชการ",
      en: "Trust-based fields fit you — real estate, management, construction, or public service.",
    },
    wealth: {
      th: "สะสมทรัพย์ก้อนใหญ่ได้ดี ที่ดิน/อสังหาฯ คือจุดแข็ง",
      en: "You accumulate big assets well — land and property are your strong suit.",
    },
    luck10: {
      th: "10 ปีข้างหน้าเป็นช่วงสร้างฐานที่มั่นคง เหมาะลงหลักปักฐานเรื่องบ้าน/ที่ดิน",
      en: "A decade of building solid foundations — a good time to settle on a home or land.",
    },
  },
  "己": {
    love: {
      th: "คุณดูแลคู่แบบโอบอ้อมและอ่อนโยน คู่จะรู้สึกอุ่นใจ ระวังแบกอารมณ์อีกฝ่ายจนเหนื่อยเอง",
      en: "You care for a partner gently and generously — they'll feel safe. Just don't carry their emotions until you burn out.",
    },
    career: {
      th: "เก่งงานที่ได้ดูแลและทำให้คนอื่นเติบโต เช่น เอชอาร์ การศึกษา สุขภาพ หรือที่ปรึกษา",
      en: "You shine at helping people grow — HR, education, health, or consulting.",
    },
    wealth: {
      th: "เก็บเงินเก่งแบบไม่โฉ่งฉ่าง ค่อย ๆ สะสมได้มั่นคงกว่าที่คิด",
      en: "A quiet, steady saver — you build more security than people realize.",
    },
    luck10: {
      th: "10 ปีข้างหน้าเป็นช่วงเก็บเกี่ยวจากสิ่งที่บ่มเพาะไว้ ผลผลิตทยอยออกดอก",
      en: "The coming decade is harvest season — what you've nurtured starts to bloom.",
    },
  },
  "庚": {
    love: {
      th: "คุณรักแบบตรงและมีขอบเขตชัด ซื่อสัตย์สูง ต้องการคนที่เคารพพื้นที่ส่วนตัว",
      en: "You love directly with clear boundaries and high loyalty — you need someone who respects your space.",
    },
    career: {
      th: "เก่งงานที่ต้องตัดสินใจเด็ดขาด เช่น กฎหมาย การแพทย์ วิศวะ ทหาร/ตำรวจ หรือการเงิน",
      en: "Decisive fields fit you — law, medicine, engineering, uniformed service, or finance.",
    },
    wealth: {
      th: "บริหารเงินมีวินัย เหมาะการลงทุนที่มีกฎเกณฑ์ชัด ไม่หวือหวา",
      en: "You manage money with discipline — rule-based, unflashy investing works best.",
    },
    luck10: {
      th: "10 ปีข้างหน้าเป็นช่วงพิสูจน์ฝีมือและได้เลื่อนขั้นจากผลงานที่จับต้องได้",
      en: "A proving decade — advancement comes from results people can touch.",
    },
  },
  "辛": {
    love: {
      th: "คุณรักแบบประณีตและภูมิใจในตัวเอง เสน่ห์เงียบ ๆ แต่ไวต่อคำพูดของคู่",
      en: "You love with refinement and quiet pride — subtly charming, but a partner's words affect you deeply.",
    },
    career: {
      th: "โดดเด่นในงานที่เน้นคุณภาพและรสนิยม เช่น แบรนด์ ความงาม จิวเวลรี่ หรืองานดีเทล",
      en: "Quality-and-taste fields suit you — branding, beauty, jewelry, or detail work.",
    },
    wealth: {
      th: "เงินมาจากของดีมีระดับ เน้นคุณภาพมากกว่าปริมาณ",
      en: "Money follows premium quality for you — quality over quantity, always.",
    },
    luck10: {
      th: "10 ปีข้างหน้าชื่อเสียงด้านความเชี่ยวชาญเฉพาะจะพาโอกาสดี ๆ เข้ามา",
      en: "In the coming decade, your specialist reputation draws in the right opportunities.",
    },
  },
  "壬": {
    love: {
      th: "คุณรักแบบอิสระและเข้าใจคนกว้าง แต่เบื่อง่าย ต้องการคู่ที่ตามความคิดคุณทัน",
      en: "You love freely and understand many kinds of people, but you bore easily — you need a partner who keeps up with your mind.",
    },
    career: {
      th: "เก่งงานที่ใช้ไหวพริบและการเดินทาง เช่น ค้าขาย ท่องเที่ยว โลจิสติกส์ หรือสื่อสาร",
      en: "Wit-and-movement work fits you — trade, travel, logistics, or communication.",
    },
    wealth: {
      th: "โอกาสเงินมาหลายทาง แต่ควรโฟกัส อย่ากระจายจนจับอะไรไม่ได้เต็มมือ",
      en: "Money chances come from many directions — focus; don't scatter until nothing lands solidly.",
    },
    luck10: {
      th: "10 ปีข้างหน้าเต็มไปด้วยการเดินทางและโอกาสข้ามพรมแดน ยืดหยุ่นไว้จะได้เปรียบ",
      en: "A decade full of travel and cross-border chances — flexibility is your edge.",
    },
  },
  "癸": {
    love: {
      th: "คุณรักลึกซึ้งและเข้าใจใจคนไว แต่คิดเยอะ ควรสื่อสารสิ่งที่รู้สึกออกมาตรง ๆ",
      en: "You love deeply and read hearts fast, but you overthink — say what you feel out loud.",
    },
    career: {
      th: "เก่งงานที่ใช้สัญชาตญาณและการวิเคราะห์ เช่น วิจัย จิตวิทยา การเงิน หรือสายลึกลับ",
      en: "Intuition-and-analysis work fits you — research, psychology, finance, or the esoteric.",
    },
    wealth: {
      th: "เงินไหลมาเงียบ ๆ จากหลายจุด เก็บทีละน้อยแต่สม่ำเสมอจะได้ผล",
      en: "Money trickles in quietly from many spots — small, steady saving wins.",
    },
    luck10: {
      th: "10 ปีข้างหน้าเป็นช่วงบ่มลึกและตกผลึก สิ่งที่สั่งสมจะกลายเป็นความได้เปรียบ",
      en: "A deepening decade — everything you've accumulated crystallizes into an advantage.",
    },
  },
};

/** Reveal premium bodies after payment. Keyed by Day Master (일간). */
export function unlock(
  sections: ReportSection[],
  dayMaster: string,
  lang: Lang = "th"
): ReportSection[] {
  const bodies = PREMIUM_BY_DAY_MASTER[dayMaster] ?? {};
  return sections.map((s) =>
    s.locked && bodies[s.key]
      ? { ...s, body: bodies[s.key][lang], locked: false }
      : s
  );
}

// Back-compat export (Thai) — prefer DISCLAIMER from i18n.ts.
export const DISCLAIMER_TH =
  "ผลการทำนายนี้เป็นการอ้างอิงเพื่อความบันเทิงเท่านั้น";
