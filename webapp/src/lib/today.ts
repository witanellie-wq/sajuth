// Daily fortune (오늘의 운) — deterministic per (user chart × calendar day).
//
// Today's day pillar (일진) is read from the almanac, then related to the
// user's Day Master via the five-element relations. Same user + same day →
// same text; tomorrow it changes. This is what makes the page worth
// revisiting daily (사주아이's re-visit hook).

// eslint-disable-next-line @typescript-eslint/no-var-requires
const { Solar } = require("lunar-javascript");

import type { SajuChart, Element } from "./saju";
import { relationTo, type Relation } from "./elements";
import { GAN_ELEMENT } from "./strength";

// How today's energy relates to the user's Day Master → tone of the day.
const RELATION_TH: Record<Relation, { title: string; body: string }> = {
  same: {
    title: "วันแห่งพลังเสริม",
    body: "วันนี้พลังงานของวันตรงกับธาตุของคุณ ทำอะไรก็ลื่นไหลเป็นพิเศษ เหมาะเริ่มสิ่งที่ต้องใช้ความมั่นใจ และเพื่อน ๆ จะเป็นตัวช่วยที่ดี",
  },
  resource: {
    title: "วันแห่งการเติมพลัง",
    body: "วันนี้เหมือนมีคนคอยหนุนหลัง เหมาะกับการเรียนรู้ ขอคำปรึกษา หรือพักฟื้นพลังใจ ผู้ใหญ่/ที่ปรึกษาจะให้โชค",
  },
  output: {
    title: "วันแห่งการแสดงออก",
    body: "วันนี้ความคิดสร้างสรรค์พุ่ง เหมาะนำเสนอผลงาน โพสต์สิ่งที่ทำ หรือเริ่มโปรเจกต์ใหม่ แต่ระวังพูดเร็วกว่าคิด",
  },
  wealth: {
    title: "วันแห่งโอกาสการเงิน",
    body: "วันนี้ดวงการเงินเปิด เหมาะเจรจา ปิดการขาย หรือจัดการเรื่องเงินที่ค้างไว้ แต่อย่าหว่านเงินตามอารมณ์",
  },
  officer: {
    title: "วันแห่งความรอบคอบ",
    body: "วันนี้มีแรงกดดันเข้ามาทดสอบ เหมาะเก็บงาน เคลียร์เอกสาร ทำตามกติกา เลี่ยงการปะทะและการตัดสินใจใหญ่",
  },
};

// Day-branch clash (六沖) with the user's day branch adds a caution note.
const CLASH: Record<string, string> = {
  "子": "午", "午": "子", "丑": "未", "未": "丑", "寅": "申", "申": "寅",
  "卯": "酉", "酉": "卯", "辰": "戌", "戌": "辰", "巳": "亥", "亥": "巳",
};

export interface TodayFortune {
  dateISO: string; // Bangkok calendar date the fortune is for
  todayPillar: string; // e.g. "甲子"
  title: string;
  body: string;
}

/** Bangkok calendar date parts for a given instant. */
function bangkokDate(now: Date): { y: number; m: number; d: number } {
  const ict = new Date(now.getTime() + 7 * 3600_000);
  return { y: ict.getUTCFullYear(), m: ict.getUTCMonth() + 1, d: ict.getUTCDate() };
}

export function todayFortune(chart: SajuChart, now: Date = new Date()): TodayFortune {
  const { y, m, d } = bangkokDate(now);
  // Noon avoids any 子시 day-boundary ambiguity for the calendar day.
  const ec = Solar.fromYmdHms(y, m, d, 12, 0, 0).getLunar().getEightChar();
  const pillar: string = ec.getDay();
  const gan = pillar.charAt(0);
  const zhi = pillar.charAt(1);

  const todayElement: Element = GAN_ELEMENT[gan];
  const rel = relationTo(chart.dayMasterElement, todayElement);
  const base = RELATION_TH[rel];

  let body = base.body;
  if (CLASH[chart.day.zhi] === zhi) {
    body +=
      " วันนี้ยังเป็นวันชง (沖) กับดวงคุณ อารมณ์อาจแกว่งง่าย ใจเย็น ๆ แล้วทุกอย่างจะผ่านไปด้วยดี";
  }

  return {
    dateISO: `${y}-${String(m).padStart(2, "0")}-${String(d).padStart(2, "0")}`,
    todayPillar: pillar,
    title: base.title,
    body,
  };
}
