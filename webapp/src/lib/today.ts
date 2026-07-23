// Daily fortune (오늘의 운) — deterministic per (user chart × calendar day).
//
// Today's day pillar (일진) is read from the almanac, then related to the
// user's Day Master via the five-element relations. Same user + same day →
// same text; tomorrow it changes. This is the daily revisit hook.

// eslint-disable-next-line @typescript-eslint/no-var-requires
const { Solar } = require("lunar-javascript");

import type { SajuChart, Element } from "./saju";
import { relationTo, type Relation } from "./elements";
import { GAN_ELEMENT, analyzeStrength } from "./strength";
import type { Lang } from "./i18n";

// 용신-based lucky charm: 오행 수리 (numbers) + wardrobe colors per element.
const LUCKY: Record<Element, { nums: string; color: Record<Lang, string> }> = {
  wood: { nums: "3, 8", color: { th: "เขียว·มิ้นต์", en: "green & mint", ko: "초록·민트" } },
  fire: { nums: "2, 7", color: { th: "แดง·พีช·คอรัล", en: "red & coral", ko: "빨강·코랄" } },
  earth: { nums: "5, 10", color: { th: "เหลือง·เบจ", en: "yellow & beige", ko: "노랑·베이지" } },
  metal: { nums: "4, 9", color: { th: "ขาว·ซิลเวอร์", en: "white & silver", ko: "흰색·실버" } },
  water: { nums: "1, 6", color: { th: "น้ำเงิน·ดำ", en: "navy & black", ko: "네이비·블랙" } },
};

const LUCKY_TEXT: Record<Lang, (color: string, nums: string) => string> = {
  th: (color, nums) =>
    ` 🍀 เคล็ดลับเสริมดวงวันนี้: แต่งตัวหรือพกของโทนสี${color} (ธาตุนำโชคของคุณ) และเลขนำโชคคือ ${nums}`,
  en: (color, nums) =>
    ` 🍀 Luck booster: wear or carry ${color} tones (your lucky element) — lucky numbers ${nums}.`,
  ko: (color, nums) =>
    ` 🍀 행운 팁: ${color} 톤의 옷·소품이 당신의 용신 기운을 더해줘요. 행운의 숫자는 ${nums}.`,
};

const RELATION_TEXT: Record<Lang, Record<Relation, { title: string; body: string }>> = {
  th: {
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
  },
  ko: {
    same: {
      title: "기운 충전의 날",
      body: "오늘의 기운이 당신 오행과 같은 날 — 뭐든 술술 풀려요. 자신감이 필요한 일을 시작하기 좋고, 친구가 힘이 됩니다.",
    },
    resource: {
      title: "에너지 보충의 날",
      body: "누군가 등을 받쳐주는 듯한 날. 배우고, 조언을 구하고, 쉬며 충전하기 좋아요. 윗사람·멘토가 행운을 줍니다.",
    },
    output: {
      title: "표현의 날",
      body: "창의력이 솟는 날 — 발표하고, 만든 걸 올리고, 새 프로젝트를 시작하세요. 말이 생각보다 앞서지 않게만 조심.",
    },
    wealth: {
      title: "재물 기회의 날",
      body: "돈의 문이 열리는 날 — 협상, 계약, 밀린 돈 정리에 좋아요. 충동 지출만 금물.",
    },
    officer: {
      title: "신중의 날",
      body: "압박이 들어와 시험하는 날. 일을 마무리하고 서류를 정리하고 규칙을 지키세요 — 충돌과 큰 결정은 피하기.",
    },
  },
  en: {
    same: {
      title: "Power-Up Day",
      body: "Today's energy matches your element — everything flows. Start what needs confidence; friends bring good support.",
    },
    resource: {
      title: "Recharge Day",
      body: "Feels like someone has your back today. Learn, ask advice, or rest and refill; mentors and elders bring luck.",
    },
    output: {
      title: "Expression Day",
      body: "Creativity spikes today — present your work, post what you made, start a project. Just don't speak faster than you think.",
    },
    wealth: {
      title: "Money-Window Day",
      body: "Money luck opens today — good for negotiating, closing deals, or clearing pending finances. No impulse spending though.",
    },
    officer: {
      title: "Careful Day",
      body: "Pressure tests you today. Wrap up tasks, clear paperwork, follow the rules — avoid clashes and big decisions.",
    },
  },
};

const CLASH_NOTE: Record<Lang, string> = {
  th: " วันนี้ยังเป็นวันชง (沖) กับดวงคุณ อารมณ์อาจแกว่งง่าย ใจเย็น ๆ แล้วทุกอย่างจะผ่านไปด้วยดี",
  en: " It's also a clash (沖) day against your chart — emotions may swing; stay calm and it will pass.",
  ko: " 오늘은 당신 사주와 충(沖)이 드는 날이기도 해요 — 감정이 흔들릴 수 있으니 한 템포 쉬어가면 무사히 지나갑니다.",
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

export function todayFortune(
  chart: SajuChart,
  now: Date = new Date(),
  lang: Lang = "th"
): TodayFortune {
  const { y, m, d } = bangkokDate(now);
  // Noon avoids any 子시 day-boundary ambiguity for the calendar day.
  const ec = Solar.fromYmdHms(y, m, d, 12, 0, 0).getLunar().getEightChar();
  const pillar: string = ec.getDay();
  const gan = pillar.charAt(0);
  const zhi = pillar.charAt(1);

  const todayElement: Element = GAN_ELEMENT[gan];
  const rel = relationTo(chart.dayMasterElement, todayElement);
  const base = RELATION_TEXT[lang][rel];

  let body = base.body;
  if (CLASH[chart.day.zhi] === zhi) body += CLASH_NOTE[lang];

  // Lucky color + number from the chart's favorable element (용신).
  const fav = analyzeStrength(chart, lang).favorable[0];
  if (fav && LUCKY[fav]) {
    body += LUCKY_TEXT[lang](LUCKY[fav].color[lang], LUCKY[fav].nums);
  }

  return {
    dateISO: `${y}-${String(m).padStart(2, "0")}-${String(d).padStart(2, "0")}`,
    todayPillar: pillar,
    title: base.title,
    body,
  };
}

export const TODAY_PREFIX: Record<Lang, string> = { th: "ดวงวันนี้", en: "Today", ko: "오늘의 운" };
