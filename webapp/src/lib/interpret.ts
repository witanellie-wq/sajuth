// Interpretation engine.
//
// Turns a SajuChart into report sections. This is the cheap, deterministic
// template layer (cost 0, instant). In production the final prose is passed
// through Claude for a natural Thai tone (see PLAN.md 6.3) — these templates
// are the seed + the offline fallback.
//
// NOTE: Thai copy below is a first-pass DRAFT meant to be refined by a native
// editor / Claude rewrite. Structure is final; wording is placeholder-quality.

import type { SajuChart, Element } from "./saju";

export interface ReportSection {
  key: string;
  title: string; // Thai
  body: string; // Thai
  locked: boolean; // true → shown blurred behind the paywall
}

const ELEMENT_TH: Record<Element, string> = {
  wood: "ไม้ (木)",
  fire: "ไฟ (火)",
  earth: "ดิน (土)",
  metal: "ทอง (金)",
  water: "น้ำ (水)",
};

// Day Master (일간) → core personality. Keyed by the 10 heavenly stems.
const DAY_MASTER_TH: Record<string, string> = {
  "甲": "คุณคือ ‘ต้นไม้ใหญ่’ — ตรงไปตรงมา มีหลักการ และเป็นที่พึ่งของคนรอบข้าง คุณเติบโตขึ้นเรื่อย ๆ และไม่ชอบยอมแพ้ แต่บางครั้งดื้อรั้นเกินไปจนไม่ยอมโอนอ่อน",
  "乙": "คุณคือ ‘ไม้เลื้อย’ — ยืดหยุ่น ปรับตัวเก่ง และอ่อนโยน คุณอยู่รอดได้ในทุกสภาพแวดล้อมด้วยความนุ่มนวล แต่ควรระวังการเกรงใจคนอื่นจนลืมความต้องการของตัวเอง",
  "丙": "คุณคือ ‘ดวงอาทิตย์’ — สดใส อบอุ่น และเป็นศูนย์กลางที่ดึงดูดผู้คน คุณให้พลังกับคนรอบตัวได้เสมอ แต่พออารมณ์ขึ้นก็ร้อนแรงและเปิดเผยเกินไป",
  "丁": "คุณคือ ‘เปลวเทียน’ — ละเอียดอ่อน มีเสน่ห์เงียบ ๆ และใส่ใจรายละเอียด คุณอบอุ่นกับคนที่ไว้ใจ แต่คิดมากและอ่อนไหวกับคำพูดของคนอื่น",
  "戊": "คุณคือ ‘ภูเขา’ — หนักแน่น มั่นคง และน่าเชื่อถือ คุณเป็นหลักให้คนอื่นพิงได้ แต่เปลี่ยนแปลงช้าและเก็บความรู้สึกไว้คนเดียวบ่อย ๆ",
  "己": "คุณคือ ‘ผืนดินเพาะปลูก’ — โอบอ้อม ดูแลคนเก่ง และประนีประนอม คุณทำให้ทุกอย่างเติบโตได้ แต่ระวังการแบกภาระคนอื่นไว้จนเหนื่อยเอง",
  "庚": "คุณคือ ‘เหล็กกล้า’ — เด็ดขาด ยุติธรรม และลงมือจริง คุณกล้าตัดสินใจในเรื่องที่คนอื่นลังเล แต่บางครั้งตรงจนดูแข็งกระด้าง",
  "辛": "คุณคือ ‘อัญมณี’ — ประณีต มีรสนิยม และภูมิใจในตัวเอง คุณโดดเด่นด้วยคุณภาพ ไม่ใช่เสียงดัง แต่ไวต่อคำวิจารณ์และเก็บมาคิด",
  "壬": "คุณคือ ‘มหาสมุทร’ — คิดกว้าง อิสระ และฉลาดปรับตัว คุณมองภาพใหญ่ได้ดีและเข้ากับคนหลากหลาย แต่บางครั้งใจลอยและเบื่อง่าย",
  "癸": "คุณคือ ‘สายฝน’ — อ่อนโยน ลึกซึ้ง และมีสัญชาตญาณดี คุณเข้าใจความรู้สึกคนอื่นไว แต่คิดเยอะและเก็บอารมณ์ไว้ข้างใน",
};

function dominantElement(counts: Record<Element, number>): Element {
  return (Object.keys(counts) as Element[]).reduce((a, b) =>
    counts[b] > counts[a] ? b : a
  );
}

function missingElements(counts: Record<Element, number>): Element[] {
  return (Object.keys(counts) as Element[]).filter((e) => counts[e] === 0);
}

export function interpret(chart: SajuChart): ReportSection[] {
  const sections: ReportSection[] = [];

  // 1. Core personality — FREE (the hook)
  sections.push({
    key: "personality",
    title: "นิสัยพื้นฐานของคุณ",
    body:
      DAY_MASTER_TH[chart.dayMaster] ??
      "ธาตุประจำวันเกิดของคุณสะท้อนบุคลิกเฉพาะตัวที่โดดเด่น",
    locked: false,
  });

  // 2. Five-element balance — FREE
  const dom = dominantElement(chart.elementCounts);
  const missing = missingElements(chart.elementCounts);
  const balanceBody =
    `ธาตุที่โดดเด่นในดวงของคุณคือ ${ELEMENT_TH[dom]} ` +
    `ซึ่งเป็นพลังงานหลักที่ขับเคลื่อนชีวิตคุณ` +
    (missing.length
      ? ` ส่วนธาตุที่ขาดคือ ${missing.map((e) => ELEMENT_TH[e]).join(", ")} — ` +
        `เป็นจุดที่ควรเสริมเพื่อสมดุลชีวิต`
      : ` ธาตุทั้งห้าของคุณค่อนข้างสมดุล ถือว่าเป็นดวงที่กลมกล่อม`);
  sections.push({
    key: "elements",
    title: "สมดุลธาตุทั้งห้า (โอแฮง)",
    body: balanceBody,
    locked: false,
  });

  // 3. Today's brief note — FREE
  sections.push({
    key: "today",
    title: "พลังงานของคุณช่วงนี้",
    body: "ช่วงนี้เหมาะกับการเริ่มต้นสิ่งเล็ก ๆ ที่คุณเลื่อนมานาน ฟังสัญชาตญาณตัวเองให้มากขึ้น",
    locked: false,
  });

  // 4-7. Locked premium sections (paywall / DM funnel)
  const locked: Array<[string, string]> = [
    ["love", "ความรักและเนื้อคู่"],
    ["career", "การงานและเส้นทางอาชีพที่ใช่"],
    ["wealth", "โชคลาภและการเงิน"],
    ["luck10", "ดวงชะตา 10 ปีข้างหน้า (แดวอน)"],
  ];
  for (const [key, title] of locked) {
    sections.push({
      key,
      title,
      body: "ปลดล็อกเพื่ออ่านผลวิเคราะห์แบบละเอียดของหมวดนี้",
      locked: true,
    });
  }

  return sections;
}

export const DISCLAIMER_TH =
  "ผลการทำนายนี้เป็นการอ้างอิงเพื่อความบันเทิงเท่านั้น";
