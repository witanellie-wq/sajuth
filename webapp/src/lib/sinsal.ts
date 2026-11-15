// 신살 (神煞) — 도화·홍염·화개·역마 detection, shared by the reading and
// compat engines. 삼합-group based stars use 년지 AND 일지 as the 기준 (either
// hit counts); 홍염 is day-stem based.

import type { SajuChart } from "./saju";
import type { Lang } from "./i18n";

export type SinsalKey =
  | "dohwa" | "hongyeom" | "hwagae" | "yeokma"
  | "cheoneul" | "munchang" | "baekho" | "goegang" | "yangin" | "wonjin";

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

// 천을귀인 — day stem → noble branches.
const CHEONEUL: Record<string, string[]> = {
  "甲": ["丑", "未"], "戊": ["丑", "未"], "庚": ["丑", "未"],
  "乙": ["子", "申"], "己": ["子", "申"],
  "丙": ["亥", "酉"], "丁": ["亥", "酉"],
  "辛": ["寅", "午"],
  "壬": ["巳", "卯"], "癸": ["巳", "卯"],
};
// 문창귀인 — day stem → branch.
const MUNCHANG: Record<string, string> = {
  "甲": "巳", "乙": "午", "丙": "申", "丁": "酉", "戊": "申",
  "己": "酉", "庚": "亥", "辛": "子", "壬": "寅", "癸": "卯",
};
// 양인살 — 양간 일간의 제왕지.
const YANGIN: Record<string, string> = { "甲": "卯", "丙": "午", "戊": "午", "庚": "酉", "壬": "子" };
// 백호·괴강 — 그 기둥 자체가 해당 간지일 때.
const BAEKHO = new Set(["甲辰", "乙未", "丙戌", "丁丑", "戊辰", "壬戌", "癸丑"]);
const GOEGANG = new Set(["庚辰", "庚戌", "壬辰", "壬戌", "戊戌"]);
// 원진 — 일지와 바로 옆(월지·시지)만.
const WONJIN: Record<string, string> = {
  "子": "未", "未": "子", "丑": "午", "午": "丑", "寅": "酉", "酉": "寅",
  "卯": "申", "申": "卯", "辰": "亥", "亥": "辰", "巳": "戌", "戌": "巳",
};

function branchesOf(c: SajuChart): string[] {
  return [c.year.zhi, c.month.zhi, c.day.zhi, ...(c.hour ? [c.hour.zhi] : [])];
}

/**
 * Which 신살 the chart carries (group basis: 년지·일지; 홍염 basis: 일간).
 *
 * 도화·화개 are only reported as "진도화(眞桃花)·진화개(眞華蓋)" — i.e. when the
 * star sits in the 일지 or 시지 (the potent 日時 positions). A 도화/화개 that
 * only shows up in the 년지·월지 is peripheral and NOT flagged, so we never
 * overstate a charm/canopy star the chart doesn't strongly carry.
 */
export function findSinsal(chart: SajuChart): SinsalKey[] {
  const branches = branchesOf(chart);
  // 진도화·진화개 positions: 일지 + 시지(시주를 아는 경우에 한함).
  const prominent = [chart.day.zhi, ...(chart.hour ? [chart.hour.zhi] : [])];
  const found = new Set<SinsalKey>();
  for (const basis of [chart.year.zhi, chart.day.zhi]) {
    const stars = GROUP_STARS[basis];
    if (!stars) continue;
    if (prominent.includes(stars.dohwa)) found.add("dohwa");
    if (prominent.includes(stars.hwagae)) found.add("hwagae");
    if (branches.includes(stars.yeokma)) found.add("yeokma");
  }
  const hy = HONGYEOM[chart.dayMaster];
  if (hy && branches.includes(hy)) found.add("hongyeom");
  const dm = chart.dayMaster;
  if (CHEONEUL[dm]?.some((b) => branches.includes(b))) found.add("cheoneul");
  if (MUNCHANG[dm] && branches.includes(MUNCHANG[dm])) found.add("munchang");
  if (YANGIN[dm] && branches.includes(YANGIN[dm])) found.add("yangin");
  const pillars = [chart.year, chart.month, chart.day, ...(chart.hour ? [chart.hour] : [])];
  if (pillars.some((p) => BAEKHO.has(p.gan + p.zhi))) found.add("baekho");
  if (pillars.some((p) => GOEGANG.has(p.gan + p.zhi))) found.add("goegang");
  const wj = WONJIN[chart.day.zhi];
  if (wj && (chart.month.zhi === wj || chart.hour?.zhi === wj)) found.add("wonjin");
  // 귀인(좋은 별) 먼저 보여준다.
  const ORDER: SinsalKey[] = ["cheoneul", "munchang", "dohwa", "hongyeom", "hwagae", "yeokma", "goegang", "baekho", "yangin", "wonjin"];
  return ORDER.filter((k) => found.has(k));
}

export const SINSAL_NAME: Record<SinsalKey, Record<Lang, string>> = {
  dohwa: { th: "🌸 도화살 — ดาวเสน่ห์", en: "🌸 도화살 — Peach-blossom charm", ko: "🌸 도화살(桃花) — 치명적 매력" },
  hongyeom: { th: "🔥 홍염살 — เสน่หายั่วใจ", en: "🔥 홍염살 — Red charm", ko: "🔥 홍염살(紅艶) — 달콤한 유혹" },
  hwagae: { th: "🎨 화개살 — ศิลปะและจิตวิญญาณ", en: "🎨 화개살 — Art & spirit", ko: "🎨 화개살(華蓋) — 예술과 고독" },
  yeokma: { th: "🐎 역마살 — การเดินทางและการเปลี่ยนแปลง", en: "🐎 역마살 — Travel & movement", ko: "🐎 역마살(驛馬) — 이동과 변화" },
  cheoneul: { th: "🌟 천을귀인 — ดาวผู้อุปถัมภ์", en: "🌟 천을귀인 — Noble benefactor star", ko: "🌟 천을귀인(天乙貴人) — 하늘이 보낸 귀인" },
  munchang: { th: "📜 문창귀인 — ดาวปัญญาและวาทศิลป์", en: "📜 문창귀인 — Star of wit & words", ko: "📜 문창귀인(文昌貴人) — 총명함과 글솜씨" },
  baekho: { th: "🐯 백호살 — ดาวเสือขาว พลังใจเด็ดเดี่ยว", en: "🐯 백호살 — White Tiger drive", ko: "🐯 백호살(白虎) — 강한 추진력" },
  goegang: { th: "⚔️ 괴강살 — ดาวผู้นำใจแกร่ง", en: "⚔️ 괴강살 — Iron-willed leader", ko: "⚔️ 괴강살(魁罡) — 카리스마 리더" },
  yangin: { th: "🗡️ 양인살 — พลังนักสู้", en: "🗡️ 양인살 — Warrior's edge", ko: "🗡️ 양인살(羊刃) — 승부사의 기운" },
  wonjin: { th: "🌀 원진살 — ใจละเอียดอ่อน", en: "🌀 원진살 — Sensitive heart", ko: "🌀 원진살(怨嗔) — 섬세한 감수성" },
};

export const SINSAL_BODY = {
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
} as Record<SinsalKey, Record<Lang, string>>;

Object.assign(SINSAL_BODY, {
  cheoneul: {
    th: "คุณมีดาวผู้อุปถัมภ์ (천을귀인) — ดาวที่ดีที่สุดในซาจู เวลาลำบากจะมีคนเข้ามาช่วยเสมอ ผู้ใหญ่เอ็นดู ปัญหาใหญ่มักคลี่คลายได้อย่างน่าประหลาดใจ",
    en: "You carry the noble benefactor star (천을귀인) — the luckiest star in saju. When things get hard, help shows up; elders favor you and big problems tend to untangle.",
    ko: "천을귀인이 있어요 — 사주에서 가장 좋은 별입니다. 어려울 때마다 도와주는 사람이 나타나고, 윗사람의 사랑을 받으며 큰 문제도 신기하게 풀리는 복이 있어요.",
  },
  munchang: {
    th: "คุณมีดาวปัญญา (문창귀인) — หัวไว เรียนรู้เร็ว พูดและเขียนเก่ง มีเสน่ห์ทางความคิด เหมาะกับงานสอน งานเขียน งานคอนเทนต์",
    en: "You carry the star of wit (문창귀인) — quick mind, fast learner, gifted with words. Teaching, writing and content come naturally.",
    ko: "문창귀인이 있어요 — 머리가 좋고 배우는 속도가 빠르며 말과 글에 재능이 있어요. 가르치는 일, 글쓰기, 콘텐츠에서 빛나는 기운입니다.",
  },
  baekho: {
    th: "คุณมีดาวเสือขาว (백호살) — พลังใจแรง กล้าตัดสินใจ ลงมือแล้วไม่ถอย เป็นคนที่ทำเรื่องยากให้สำเร็จได้ แค่พักให้พอ อย่าฝืนตัวเองเกินไป",
    en: "You carry the White Tiger star (백호살) — strong will and decisive action; you get hard things done. Just rest enough and don't overpush.",
    ko: "백호살이 있어요 — 기세가 강하고 결단력이 있어서, 남들이 어려워하는 일을 해내는 힘이 있어요. 무리하지 않고 충분히 쉬어주기만 하면 됩니다.",
  },
  goegang: {
    th: "คุณมีดาวผู้นำ (괴강살) — ใจแกร่ง ฉลาด มีออร่าผู้นำ ไม่ยอมแพ้ใครง่าย ๆ ยิ่งเจอเรื่องใหญ่ยิ่งเปล่งประกาย",
    en: "You carry the iron-willed leader star (괴강살) — sharp, tough, a natural leader's aura; the bigger the stage, the brighter you shine.",
    ko: "괴강살이 있어요 — 총명하고 강인한 리더의 기운입니다. 쉽게 굽히지 않고, 큰 무대일수록 더 빛나는 타입이에요.",
  },
  yangin: {
    th: "คุณมีพลังนักสู้ (양인살) — แข่งขันเก่ง ไม่กลัวความท้าทาย มีแรงผลักดันมหาศาล ใช้ให้ถูกทางจะประสบความสำเร็จเร็ว",
    en: "You carry the warrior's edge (양인살) — competitive, fearless, with huge drive; aimed well, it brings fast success.",
    ko: "양인살이 있어요 — 승부욕과 추진력이 대단한 기운이에요. 도전을 두려워하지 않아서, 방향만 잘 잡으면 빠르게 성공합니다.",
  },
  wonjin: {
    th: "คุณมีดาวใจละเอียด (원진살) — อ่านใจคนเก่ง รู้สึกไว เข้าใจความรู้สึกคนอื่นลึกซึ้ง แค่อย่าเก็บเรื่องเล็กไว้คิดนาน",
    en: "You carry the sensitive-heart star (원진살) — perceptive and empathetic, you read people well; just don't dwell on small things.",
    ko: "원진살이 있어요 — 감수성이 섬세해서 사람 마음을 잘 읽고 공감을 잘해요. 작은 일을 오래 마음에 담아두지만 않으면 돼요.",
  },
} as Partial<Record<SinsalKey, Record<Lang, string>>>);

// 인기 신살(도화·홍염)은 없어도 "없음 + 나만의 매력"으로 항상 보여준다 — 콘텐츠(바람기·도화살 확인)와 이어지게.
export const CHARM_ABSENT: Record<"dohwa" | "hongyeom", Record<Lang, string>> = {
  dohwa: {
    th: "🌸 ดาวเสน่ห์ (도화살) — ไม่มีในดวง\nเสน่ห์ของคุณไม่ใช่แบบดึงดูดสายตาตั้งแต่แรกเห็น แต่เป็นเสน่ห์แบบยิ่งรู้จักยิ่งหลง คนที่อยู่ใกล้คุณจะผูกพันนานและจริงใจ",
    en: "🌸 Peach-blossom star (도화살) — not in your chart\nYour charm isn't the love-at-first-sight kind; it's the kind that grows the longer people know you, so the bonds you form run deep and loyal.",
    ko: "🌸 도화살 — 없음\n첫눈에 시선을 끄는 매력보다, 알면 알수록 빠져드는 매력이에요. 곁에 있는 사람과 오래 깊게 가는 인연이 많아요.",
  },
  hongyeom: {
    th: "🔥 ดาวเสน่หายั่วใจ (홍염살) — ไม่มีในดวง\nความรักของคุณไม่วูบวาบ แต่มั่นคงและน่าไว้ใจ คนที่ได้รักคุณจะรู้สึกปลอดภัย",
    en: "🔥 Red-charm star (홍염살) — not in your chart\nYour love isn't fleeting flame but steady warmth; whoever you love feels safe with you.",
    ko: "🔥 홍염살 — 없음\n금방 타오르는 연애보다 믿음직하고 안정적인 사랑을 하는 타입이에요. 연인이 가장 편안하게 느끼는 사람이에요.",
  },
};

export const SINSAL_TITLE: Record<Lang, string> = {
  th: "⭐ ดาวพิเศษในดวง (신살)",
  en: "⭐ Special stars (신살)",
  ko: "⭐ 내 사주의 신살",
};
