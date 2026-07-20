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
import { analyzeStrength } from "./strength";
import { todayFortune } from "./today";

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

  // 3. Day Master strength (신강/신약) + 용신 — FREE, the depth layer
  const strength = analyzeStrength(chart);
  sections.push({
    key: "strength",
    title: `พลังธาตุประจำตัว — ${strength.bandTh}`,
    body: strength.body,
    locked: false,
  });

  // 4. Today's fortune — FREE, changes daily (revisit hook)
  const today = todayFortune(chart);
  sections.push({
    key: "today",
    title: `ดวงวันนี้ · ${today.title}`,
    body: today.body,
    locked: false,
  });

  // 4-7. Locked premium sections (paywall / DM funnel). Real bodies live in
  // PREMIUM and are revealed by unlock(); here they stay hidden behind the blur.
  for (const [key, title] of PREMIUM_TITLES) {
    sections.push({
      key,
      title,
      body: "ปลดล็อกเพื่ออ่านผลวิเคราะห์แบบละเอียดของหมวดนี้",
      locked: true,
    });
  }

  return sections;
}

const PREMIUM_TITLES: Array<[string, string]> = [
  ["love", "ความรักและเนื้อคู่"],
  ["career", "การงานและเส้นทางอาชีพที่ใช่"],
  ["wealth", "โชคลาภและการเงิน"],
  ["luck10", "ดวงชะตา 10 ปีข้างหน้า (แดวอน)"],
];

// Premium bodies keyed by Day Master (일간, 10 stems) so two people who share
// an element but differ in yin/yang still get distinct readings. First-pass
// Thai draft — Claude rewrite (rewrite.ts) personalizes further at runtime.
const PREMIUM_BY_DAY_MASTER: Record<string, Record<string, string>> = {
  "甲": {
    love: "คุณรักแบบจริงจังและปกป้อง มองหาคนที่เติบโตไปด้วยกัน ระวังการยึดหลักการจนไม่ยอมง้อ",
    career: "เหมาะกับงานที่ได้บุกเบิกและนำทีม เช่น ผู้ก่อตั้ง การศึกษา หรือสายที่ได้สร้างจากศูนย์",
    wealth: "การเงินโตแบบต้นไม้ ค่อยเป็นค่อยไปแต่มั่นคง ลงทุนระยะยาวเข้าทางคุณ",
    luck10: "10 ปีข้างหน้าเป็นช่วงวางรากและขยายอาณาเขต สิ่งที่ปลูกวันนี้จะเป็นป่าในวันหน้า",
  },
  "乙": {
    love: "คุณรักแบบยืดหยุ่นและประคับประคอง ผูกพันลึก ระวังยอมอีกฝ่ายจนลืมใจตัวเอง",
    career: "เก่งงานที่ต้องปรับตัวและประสานคน เช่น ดีไซน์ พีอาร์ งานบริการ หรือคอนเทนต์",
    wealth: "หาเงินได้หลายช่องทางเล็ก ๆ รวมกันแล้วมั่นคง เหมาะกระจายความเสี่ยง",
    luck10: "10 ปีข้างหน้าค่อย ๆ ไต่ขึ้นอย่างนุ่มนวล เครือข่ายคนคือทรัพย์สินที่ใหญ่ที่สุด",
  },
  "丙": {
    love: "คุณรักอย่างร้อนแรงและเปิดเผย ดึงดูดคนง่าย แต่ควรระวังใจร้อนช่วงมีปากเสียง",
    career: "โดดเด่นในงานที่ได้เป็นสปอตไลต์ เช่น การตลาด บันเทิง งานขาย หรือครีเอทีฟ",
    wealth: "รายได้เข้าไวแต่ใช้ไว ตั้งระบบออมอัตโนมัติไว้กันเงินรั่ว",
    luck10: "10 ปีข้างหน้ามีจังหวะชื่อเสียงมาแรง ใช้โอกาสตอนพีคให้เต็มที่",
  },
  "丁": {
    love: "คุณรักแบบอบอุ่นลึกซึ้งกับคนที่ไว้ใจ แต่คิดมากและอ่อนไหว ต้องการความมั่นใจจากคู่",
    career: "เก่งงานละเอียดที่ต้องใช้ฝีมือเฉพาะ เช่น งานคราฟต์ เขียน วิจัย หรือดูแลเฉพาะทาง",
    wealth: "เงินมาจากความเชี่ยวชาญเฉพาะตัว สะสมช้าแต่ยั่งยืน",
    luck10: "10 ปีข้างหน้าเป็นช่วงที่ฝีมือเปล่งประกายและมีคนเห็นคุณค่าอย่างแท้จริง",
  },
  "戊": {
    love: "คุณเป็นคู่ที่มั่นคงและเป็นหลักให้พิงได้ ระวังเก็บความรู้สึกไว้จนอีกฝ่ายเดาใจไม่ออก",
    career: "เหมาะกับงานที่ต้องอาศัยความน่าเชื่อถือ เช่น อสังหาฯ บริหาร ก่อสร้าง หรือราชการ",
    wealth: "สะสมทรัพย์ก้อนใหญ่ได้ดี ที่ดิน/อสังหาฯ คือจุดแข็ง",
    luck10: "10 ปีข้างหน้าเป็นช่วงสร้างฐานที่มั่นคง เหมาะลงหลักปักฐานเรื่องบ้าน/ที่ดิน",
  },
  "己": {
    love: "คุณดูแลคู่แบบโอบอ้อมและอ่อนโยน คู่จะรู้สึกอุ่นใจ ระวังแบกอารมณ์อีกฝ่ายจนเหนื่อยเอง",
    career: "เก่งงานที่ได้ดูแลและทำให้คนอื่นเติบโต เช่น เอชอาร์ การศึกษา สุขภาพ หรือที่ปรึกษา",
    wealth: "เก็บเงินเก่งแบบไม่โฉ่งฉ่าง ค่อย ๆ สะสมได้มั่นคงกว่าที่คิด",
    luck10: "10 ปีข้างหน้าเป็นช่วงเก็บเกี่ยวจากสิ่งที่บ่มเพาะไว้ ผลผลิตทยอยออกดอก",
  },
  "庚": {
    love: "คุณรักแบบตรงและมีขอบเขตชัด ซื่อสัตย์สูง ต้องการคนที่เคารพพื้นที่ส่วนตัว",
    career: "เก่งงานที่ต้องตัดสินใจเด็ดขาด เช่น กฎหมาย การแพทย์ วิศวะ ทหาร/ตำรวจ หรือการเงิน",
    wealth: "บริหารเงินมีวินัย เหมาะการลงทุนที่มีกฎเกณฑ์ชัด ไม่หวือหวา",
    luck10: "10 ปีข้างหน้าเป็นช่วงพิสูจน์ฝีมือและได้เลื่อนขั้นจากผลงานที่จับต้องได้",
  },
  "辛": {
    love: "คุณรักแบบประณีตและภูมิใจในตัวเอง เสน่ห์เงียบ ๆ แต่ไวต่อคำพูดของคู่",
    career: "โดดเด่นในงานที่เน้นคุณภาพและรสนิยม เช่น แบรนด์ ความงาม จิวเวลรี่ หรืองานดีเทล",
    wealth: "เงินมาจากของดีมีระดับ เน้นคุณภาพมากกว่าปริมาณ",
    luck10: "10 ปีข้างหน้าชื่อเสียงด้านความเชี่ยวชาญเฉพาะจะพาโอกาสดี ๆ เข้ามา",
  },
  "壬": {
    love: "คุณรักแบบอิสระและเข้าใจคนกว้าง แต่เบื่อง่าย ต้องการคู่ที่ตามความคิดคุณทัน",
    career: "เก่งงานที่ใช้ไหวพริบและการเดินทาง เช่น ค้าขาย ท่องเที่ยว โลจิสติกส์ หรือสื่อสาร",
    wealth: "โอกาสเงินมาหลายทาง แต่ควรโฟกัส อย่ากระจายจนจับอะไรไม่ได้เต็มมือ",
    luck10: "10 ปีข้างหน้าเต็มไปด้วยการเดินทางและโอกาสข้ามพรมแดน ยืดหยุ่นไว้จะได้เปรียบ",
  },
  "癸": {
    love: "คุณรักลึกซึ้งและเข้าใจใจคนไว แต่คิดเยอะ ควรสื่อสารสิ่งที่รู้สึกออกมาตรง ๆ",
    career: "เก่งงานที่ใช้สัญชาตญาณและการวิเคราะห์ เช่น วิจัย จิตวิทยา การเงิน หรือสายลึกลับ",
    wealth: "เงินไหลมาเงียบ ๆ จากหลายจุด เก็บทีละน้อยแต่สม่ำเสมอจะได้ผล",
    luck10: "10 ปีข้างหน้าเป็นช่วงบ่มลึกและตกผลึก สิ่งที่สั่งสมจะกลายเป็นความได้เปรียบ",
  },
};

/** Reveal premium bodies after payment. Keyed by Day Master (일간). */
export function unlock(sections: ReportSection[], dayMaster: string): ReportSection[] {
  const bodies = PREMIUM_BY_DAY_MASTER[dayMaster] ?? {};
  return sections.map((s) =>
    s.locked && bodies[s.key]
      ? { ...s, body: bodies[s.key], locked: false }
      : s
  );
}

export const DISCLAIMER_TH =
  "ผลการทำนายนี้เป็นการอ้างอิงเพื่อความบันเทิงเท่านั้น";
