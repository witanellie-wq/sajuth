// 신살 (神煞) — 도화·홍염·화개·역마 detection, shared by the reading and
// compat engines. 삼합-group based stars use 년지 AND 일지 as the 기준 (either
// hit counts); 홍염 is day-stem based.

import type { SajuChart } from "./saju";
import type { Lang } from "./i18n";

export type SinsalKey = "dohwa" | "hongyeom" | "hwagae" | "yeokma";

// 삼합 group of each branch → the star branches for that group.
// 申子辰: 도화 酉 / 화개 辰 / 역마 寅 · 亥卯未: 子/未/巳 · 寅午戌: 卯/戌/申 · 巳酉丑: 午/丑/亥
const GROUP_STARS: Record<string, { dohwa: string; hwagae: string; yeokma: string }> = {
  "申": { dohwa: "酉", hwagae: "辰", yeokma: "寅" },
  "子": { dohwa: "酉", hwagae: "辰", yeokma: "寅" },
  "辰": { dohwa: "酉", hwagae: "辰", yeokma: "寅" },
  "亥": { dohwa: "子", hwagae: "未", yeokma: "巳" },
  "卯": { dohwa: "子", hwagae: "未", yeokma: "巳" },
  "未": { dohwa: "子", hwagae: "未", yeokma: "巳" },
  "寅": { dohwa: "卯", hwagae: "戌", yeokma: "申" },
  "午": { dohwa: "卯", hwagae: "戌", yeokma: "申" },
  "戌": { dohwa: "卯", hwagae: "戌", yeokma: "申" },
  "巳": { dohwa: "午", hwagae: "丑", yeokma: "亥" },
  "酉": { dohwa: "午", hwagae: "丑", yeokma: "亥" },
  "丑": { dohwa: "午", hwagae: "丑", yeokma: "亥" },
};

// 홍염살 — day stem → branch (갑오 을신 병인 정미 무진 기진 경술 신유 임자 계신).
const HONGYEOM: Record<string, string> = {
  "甲": "午", "乙": "申", "丙": "寅", "丁": "未", "戊": "辰",
  "己": "辰", "庚": "戌", "辛": "酉", "壬": "子", "癸": "申",
};

function branchesOf(c: SajuChart): string[] {
  return [c.year.zhi, c.month.zhi, c.day.zhi, ...(c.hour ? [c.hour.zhi] : [])];
}

/** Which 신살 the chart carries (기준: 년지·일지; 홍염 기준: 일간). */
export function findSinsal(chart: SajuChart): SinsalKey[] {
  const branches = branchesOf(chart);
  const found = new Set<SinsalKey>();
  for (const basis of [chart.year.zhi, chart.day.zhi]) {
    const stars = GROUP_STARS[basis];
    if (!stars) continue;
    if (branches.includes(stars.dohwa)) found.add("dohwa");
    if (branches.includes(stars.hwagae)) found.add("hwagae");
    if (branches.includes(stars.yeokma)) found.add("yeokma");
  }
  const hy = HONGYEOM[chart.dayMaster];
  if (hy && branches.includes(hy)) found.add("hongyeom");
  return [...found];
}

export const SINSAL_NAME: Record<SinsalKey, Record<Lang, string>> = {
  dohwa: { th: "🌸 도화살 — ดาวเสน่ห์", en: "🌸 도화살 — Peach-blossom charm", ko: "🌸 도화살(桃花) — 치명적 매력" },
  hongyeom: { th: "🔥 홍염살 — เสน่หายั่วใจ", en: "🔥 홍염살 — Red charm", ko: "🔥 홍염살(紅艶) — 달콤한 유혹" },
  hwagae: { th: "🎨 화개살 — ศิลปะและจิตวิญญาณ", en: "🎨 화개살 — Art & spirit", ko: "🎨 화개살(華蓋) — 예술과 고독" },
  yeokma: { th: "🐎 역마살 — การเดินทางและการเปลี่ยนแปลง", en: "🐎 역마살 — Travel & movement", ko: "🐎 역마살(驛馬) — 이동과 변화" },
};

export const SINSAL_BODY: Record<SinsalKey, Record<Lang, string>> = {
  dohwa: {
    th: "คุณมีดาวเสน่ห์ (도화살) — เป็นคนที่ดึงดูดสายตาผู้คนโดยธรรมชาติ มีเสน่ห์ที่อธิบายยาก ใช้ให้ถูกทางจะเป็นพลังมหาศาลในงานที่ต้องพบผู้คน แต่ควรระวังเรื่องรักซ้อน",
    en: "You carry the peach-blossom star (도화살) — a natural, hard-to-explain magnetism. Channeled well, it's a superpower in people-facing work; just watch romantic entanglements.",
    ko: "도화살이 있어요 — 설명하기 어려운 타고난 매력으로 시선을 끄는 사람입니다. 사람을 상대하는 일에서는 큰 무기가 되지만, 연애사가 복잡해지지 않게만 조심하면 됩니다.",
  },
  hongyeom: {
    th: "คุณมีดาวเสน่หายั่วใจ (홍염살) — เสน่ห์แบบอบอุ่นหวานซึ้งที่ทำให้คนใกล้ชิดหลงใหล มักได้รับความรักความเอ็นดูจากคนรอบข้าง",
    en: "You carry the red-charm star (홍염살) — a warm, sweet allure that captivates those close to you; affection tends to find you.",
    ko: "홍염살이 있어요 — 은근하고 달콤한 매력으로 가까운 사람을 사로잡는 기운입니다. 주변의 사랑과 호감을 자연스럽게 받는 편이에요.",
  },
  hwagae: {
    th: "คุณมีดาวศิลปะ (화개살) — ลึกซึ้ง ชอบอยู่กับโลกภายใน มีพรสวรรค์ด้านศิลปะ ศาสนา หรือการศึกษา ยิ่งอยู่คนเดียวยิ่งสร้างสรรค์",
    en: "You carry the canopy star (화개살) — depth, an inner world, and talent for art, spirituality, or scholarship; solitude fuels your creativity.",
    ko: "화개살이 있어요 — 예술·종교·학문에 재능이 있고 내면세계가 깊은 기운입니다. 고독을 즐길 줄 알며, 혼자 있는 시간이 창조력의 원천이 됩니다.",
  },
  yeokma: {
    th: "คุณมีดาวการเดินทาง (역마살) — ชีวิตผูกกับการเคลื่อนไหว การเดินทาง ต่างประเทศ หรือการเปลี่ยนแปลง อยู่นิ่ง ๆ แล้วอึดอัด ยิ่งเคลื่อนไหวยิ่งเปิดโชค",
    en: "You carry the travel star (역마살) — a life wired for movement: journeys, foreign lands, change. Staying still stifles you; motion opens your luck.",
    ko: "역마살이 있어요 — 이동·여행·해외·변화와 인연이 깊은 기운입니다. 한곳에 머무르면 답답해지고, 움직일수록 운이 열리는 타입이에요.",
  },
};

export const SINSAL_TITLE: Record<Lang, string> = {
  th: "⭐ ดาวพิเศษในดวง (신살)",
  en: "⭐ Special stars (신살)",
  ko: "⭐ 내 사주의 신살",
};
