// "내 사주 한눈에 보기" — 나 자신(일간), 가장 강한 오행(지장간·월령 가중),
// 합·충 반영 후 가장 강한 오행, 격(格), 용신·희신·기신.
//
// 원칙
// - 용신·희신은 strength.ts의 favorable 목록을 그대로 쓴다 → 무료 섹션·보완
//   아이템·AI 리포트와 절대 어긋나지 않는다.
// - 격은 자평진전식 내격: 월지가 건록·양인이면 건록격·양인격, 아니면 월지
//   지장간 중 천간에 투출한 것(정기 우선), 없으면 정기의 십신으로 정한다.
// - 합화는 월령(월지 오행)을 얻었을 때만 '화(化)'로 본다. 일간이 낀 합은
//   화하지 않고 '묶임'으로만 본다.

import type { SajuChart, Element } from "./saju";
import type { Lang } from "./i18n";
import { analyzeStrength } from "./strength";
import { generatedBy, controlledBy, ELEMENT_TH } from "./elements";

// (myeongri.ts는 대운 계산용 lunar-javascript를 끌고 오므로 클라이언트
// 번들에서 피하려고 십신 계산만 여기 복사)
type TenGod =
  | "bigyeon" | "geopjae" | "siksin" | "sanggwan" | "pyeonjae"
  | "jeongjae" | "pyeongwan" | "jeonggwan" | "pyeonin" | "jeongin";
const STEMS = "甲乙丙丁戊己庚辛壬癸";
const yang = (s: string) => STEMS.indexOf(s) % 2 === 0;
const GEN_N: Record<Element, Element> = { wood: "fire", fire: "earth", earth: "metal", metal: "water", water: "wood" };
const CTL_N: Record<Element, Element> = { wood: "earth", earth: "water", water: "fire", fire: "metal", metal: "wood" };
function tenGodOfStem(dm: string, t: string): TenGod {
  const a = STEM_EL_[dm], b = STEM_EL_[t], same = yang(dm) === yang(t);
  if (a === b) return same ? "bigyeon" : "geopjae";
  if (GEN_N[a] === b) return same ? "siksin" : "sanggwan";
  if (CTL_N[a] === b) return same ? "pyeonjae" : "jeongjae";
  if (CTL_N[b] === a) return same ? "pyeongwan" : "jeonggwan";
  return same ? "pyeonin" : "jeongin";
}

const STEM_EL: Record<string, Element> = {
  "甲": "wood", "乙": "wood", "丙": "fire", "丁": "fire", "戊": "earth",
  "己": "earth", "庚": "metal", "辛": "metal", "壬": "water", "癸": "water",
};
const STEM_EL_ = STEM_EL;
const BRANCH_EL: Record<string, Element> = {
  "子": "water", "丑": "earth", "寅": "wood", "卯": "wood", "辰": "earth", "巳": "fire",
  "午": "fire", "未": "earth", "申": "metal", "酉": "metal", "戌": "earth", "亥": "water",
};
// 지장간: 여기 → 중기 → 정기(마지막)
const HIDDEN: Record<string, string> = {
  "子": "壬癸", "丑": "癸辛己", "寅": "戊丙甲", "卯": "甲乙", "辰": "乙癸戊", "巳": "戊庚丙",
  "午": "丙己丁", "未": "丁乙己", "申": "戊壬庚", "酉": "庚辛", "戌": "辛丁戊", "亥": "戊甲壬",
};
const HIDDEN_W: Record<number, number[]> = { 1: [1], 2: [0.3, 0.7], 3: [0.15, 0.25, 0.6] };

const STEM_HAP: Record<string, Element> = {
  "甲己": "earth", "乙庚": "metal", "丙辛": "water", "丁壬": "wood", "戊癸": "fire",
};
const YUKHAP: Record<string, Element> = {
  "子丑": "earth", "寅亥": "wood", "卯戌": "fire", "辰酉": "metal", "巳申": "water", "午未": "fire",
};
const CHUNG = new Set(["子午", "丑未", "寅申", "卯酉", "辰戌", "巳亥"]);
const SAMHAP: Array<[string, Element, string]> = [
  ["申子辰", "water", "子"], ["亥卯未", "wood", "卯"], ["寅午戌", "fire", "午"], ["巳酉丑", "metal", "酉"],
];
const BANGHAP: Array<[string, Element]> = [
  ["寅卯辰", "wood"], ["巳午未", "fire"], ["申酉戌", "metal"], ["亥子丑", "water"],
];
// 건록(록지) · 양인(양간만)
const ROK: Record<string, string> = {
  "甲": "寅", "乙": "卯", "丙": "巳", "丁": "午", "戊": "巳", "己": "午",
  "庚": "申", "辛": "酉", "壬": "亥", "癸": "子",
};
const YANGIN: Record<string, string> = { "甲": "卯", "丙": "午", "戊": "午", "庚": "酉", "壬": "子" };

const key2 = (a: string, b: string, table: Record<string, unknown> | Set<string>) => {
  const k1 = a + b, k2 = b + a;
  if (table instanceof Set) return table.has(k1) ? k1 : table.has(k2) ? k2 : null;
  return k1 in table ? k1 : k2 in table ? k2 : null;
};

const EL_NAME: Record<Lang, Record<Element, string>> = {
  th: ELEMENT_TH,
  en: { wood: "Wood (木)", fire: "Fire (火)", earth: "Earth (土)", metal: "Metal (金)", water: "Water (水)" },
  ko: { wood: "목(木)", fire: "화(火)", earth: "토(土)", metal: "금(金)", water: "수(水)" },
};

const DM_IMAGE: Record<string, Record<Lang, string>> = {
  "甲": { th: "ต้นไม้ใหญ่", en: "Great Tree", ko: "큰 나무" },
  "乙": { th: "ดอกไม้", en: "Flower", ko: "꽃" },
  "丙": { th: "ดวงอาทิตย์", en: "Sun", ko: "태양" },
  "丁": { th: "เปลวเทียน", en: "Candle Flame", ko: "촛불" },
  "戊": { th: "ภูเขา", en: "Mountain", ko: "산" },
  "己": { th: "ผืนดินอุดม", en: "Fertile Field", ko: "기름진 밭" },
  "庚": { th: "เหล็กกล้า", en: "Steel", ko: "강철" },
  "辛": { th: "อัญมณี", en: "Jewel", ko: "보석" },
  "壬": { th: "มหาสมุทร", en: "Ocean", ko: "바다" },
  "癸": { th: "สายฝน", en: "Gentle Rain", ko: "단비" },
};
const DM_EMOJI: Record<string, string> = {
  "甲": "🌳", "乙": "🌸", "丙": "☀️", "丁": "🕯️", "戊": "⛰️",
  "己": "🌾", "庚": "⚔️", "辛": "💎", "壬": "🌊", "癸": "🌧️",
};

export type GyeokKey =
  | "jeonggwan" | "pyeongwan" | "jeongjae" | "pyeonjae" | "siksin" | "sanggwan"
  | "jeongin" | "pyeonin" | "geonrok" | "yangin" | "wolgeop";

const GYEOK_NAME: Record<GyeokKey, Record<Lang, string>> = {
  jeonggwan: { th: "เจิงกวานกยอก (정관격) · ผู้บริหารมีระเบียบ", en: "Jeonggwan-gyeok (정관격) · Principled Leader", ko: "정관격" },
  pyeongwan: { th: "พยอนกวานกยอก (편관격) · นักสู้ใจกล้า", en: "Pyeongwan-gyeok (편관격) · Bold Fighter", ko: "편관격(칠살격)" },
  jeongjae: { th: "เจิงแจกยอก (정재격) · นักสะสมมั่นคง", en: "Jeongjae-gyeok (정재격) · Steady Builder", ko: "정재격" },
  pyeonjae: { th: "พยอนแจกยอก (편재격) · นักธุรกิจใจกว้าง", en: "Pyeonjae-gyeok (편재격) · Big-picture Dealmaker", ko: "편재격" },
  siksin: { th: "ชิกชินกยอก (식신격) · นักสร้างสรรค์สายเอนจอย", en: "Siksin-gyeok (식신격) · Joyful Creator", ko: "식신격" },
  sanggwan: { th: "ซังกวานกยอก (상관격) · ศิลปินหัวขบถ", en: "Sanggwan-gyeok (상관격) · Rebel Talent", ko: "상관격" },
  jeongin: { th: "เจิงอินกยอก (정인격) · ผู้รอบรู้ใจดี", en: "Jeongin-gyeok (정인격) · Gentle Scholar", ko: "정인격" },
  pyeonin: { th: "พยอนอินกยอก (편인격) · นักคิดลึกลับ", en: "Pyeonin-gyeok (편인격) · Mystic Thinker", ko: "편인격" },
  geonrok: { th: "กอนรกกยอก (건록격) · คนสร้างตัวเอง", en: "Geonrok-gyeok (건록격) · Self-made", ko: "건록격" },
  yangin: { th: "ยังอินกยอก (양인격) · ผู้นำใจเด็ด", en: "Yangin-gyeok (양인격) · Fearless Leader", ko: "양인격" },
  wolgeop: { th: "วอลกอบกยอก (월겁격) · คนพึ่งพาเครือข่าย", en: "Wolgeop-gyeok (월겁격) · Network Player", ko: "월겁격" },
};
const TG_TO_GYEOK: Partial<Record<TenGod, GyeokKey>> = {
  jeonggwan: "jeonggwan", pyeongwan: "pyeongwan", jeongjae: "jeongjae", pyeonjae: "pyeonjae",
  siksin: "siksin", sanggwan: "sanggwan", jeongin: "jeongin", pyeonin: "pyeonin",
};

export type RelKind = "stemHapHwa" | "stemHap" | "yukhap" | "samhap" | "banhap" | "banghap" | "chung";
export interface Relation { kind: RelKind; chars: string; element?: Element }

export interface SajuSummary {
  dm: { stem: string; element: Element; image: string; emoji: string };
  strongest: { element: Element; pct: number };
  afterRel: { element: Element; pct: number; changed: boolean };
  relations: Relation[];
  gyeok: { key: GyeokKey; name: string; basis: string; sub?: { key: GyeokKey; name: string } };
  yong: Element;
  hee: Element[];
  gi: Element;
  elName: Record<Element, string>;
}

function emptyScores(): Record<Element, number> {
  return { wood: 0, fire: 0, earth: 0, metal: 0, water: 0 };
}
function top(s: Record<Element, number>): { element: Element; pct: number } {
  const total = Object.values(s).reduce((a, b) => a + b, 0) || 1;
  const el = (Object.keys(s) as Element[]).reduce((a, b) => (s[b] > s[a] ? b : a));
  return { element: el, pct: Math.round((s[el] / total) * 100) };
}

export function summarize(chart: SajuChart, lang: Lang = "th"): SajuSummary {
  const pillars = [chart.year, chart.month, chart.day, ...(chart.hour ? [chart.hour] : [])];
  const MONTH = 1;

  // ── 기본 세력: 천간 1.0, 지지는 지장간 비율, 월지 ×2 (월령) ──
  const stemW = pillars.map(() => 1);
  const branchW = pillars.map((_, i) => (i === MONTH ? 2 : 1));
  const score = (stemMul: number[], branchMul: number[], stemEl: Element[]) => {
    const s = emptyScores();
    pillars.forEach((p, i) => {
      s[stemEl[i]] += stemW[i] * stemMul[i];
      const hs = HIDDEN[p.zhi];
      const ws = HIDDEN_W[hs.length];
      [...hs].forEach((h, j) => (s[STEM_EL[h]] += ws[j] * branchW[i] * branchMul[i]));
    });
    return s;
  };
  const baseStemEl = pillars.map((p) => STEM_EL[p.gan]);
  const ones = pillars.map(() => 1);
  const base = score(ones, ones, baseStemEl);

  // ── 합·충 ──
  const relations: Relation[] = [];
  const stemEl = [...baseStemEl];
  const branchMul = pillars.map(() => 1);
  const bonus = emptyScores();
  const monthEl = BRANCH_EL[chart.month.zhi];
  for (let i = 0; i + 1 < pillars.length; i++) {
    const a = pillars[i], b = pillars[i + 1];
    const sh = key2(a.gan, b.gan, STEM_HAP);
    if (sh) {
      const el = STEM_HAP[sh];
      const involvesDM = i + 1 === 2 || i === 2;
      if (!involvesDM && monthEl === el) {
        stemEl[i] = el;
        stemEl[i + 1] = el;
        relations.push({ kind: "stemHapHwa", chars: a.gan + b.gan, element: el });
      } else {
        relations.push({ kind: "stemHap", chars: a.gan + b.gan, element: el });
      }
    }
    const yk = key2(a.zhi, b.zhi, YUKHAP);
    if (yk) {
      relations.push({ kind: "yukhap", chars: a.zhi + b.zhi, element: YUKHAP[yk] });
      bonus[YUKHAP[yk]] += 0.6;
    }
    if (key2(a.zhi, b.zhi, CHUNG)) {
      relations.push({ kind: "chung", chars: a.zhi + b.zhi });
      branchMul[i] *= 0.6;
      branchMul[i + 1] *= 0.6;
    }
  }
  const zhis = pillars.map((p) => p.zhi);
  for (const [g, el, king] of SAMHAP) {
    const hit = [...g].filter((c) => zhis.includes(c));
    if (hit.length === 3) {
      relations.push({ kind: "samhap", chars: g, element: el });
      bonus[el] += 2;
    } else if (hit.length === 2 && hit.includes(king)) {
      relations.push({ kind: "banhap", chars: hit.join(""), element: el });
      bonus[el] += 1;
    }
  }
  for (const [g, el] of BANGHAP) {
    if ([...g].every((c) => zhis.includes(c))) {
      relations.push({ kind: "banghap", chars: g, element: el });
      bonus[el] += 2;
    }
  }
  const adj = score(ones, branchMul, stemEl);
  (Object.keys(bonus) as Element[]).forEach((e) => (adj[e] += bonus[e]));

  const strongest = top(base);
  const after = top(adj);

  // ── 격 ──
  const dm = chart.dayMaster;
  const mz = chart.month.zhi;
  const visibleStems = [chart.year.gan, chart.month.gan, ...(chart.hour ? [chart.hour.gan] : [])];
  let gyeok: GyeokKey;
  let basis: string;
  let sub: GyeokKey | undefined;
  if (ROK[dm] === mz) {
    gyeok = "geonrok";
    basis = `${mz}`;
  } else if (YANGIN[dm] === mz) {
    gyeok = "yangin";
    basis = `${mz}`;
  } else {
    // 월지 지장간 중 천간에 투출한 것을 격으로 잡는다 (자평진전).
    //  1) 정기가 투출했으면 정기
    //  2) 여러 개가 투출했으면 세력이 강한 것 — 지지에 뿌리(통근)가 많은 것.
    //     뿌리 점수: 같은 오행 지장간이 정기면 1, 중기 0.5, 여기 0.3 (월지 ×2).
    //     동점이면 월간 > 연간 > 시간 (월령에 가까운 자리).
    //  3) 투출이 없으면 정기
    // 정기의 십신이 주격과 다르면 '보조격'으로 함께 표시한다.
    const hs = [...HIDDEN[mz]].reverse(); // [정기, 중기, 여기]
    const main = hs[0];
    const posOrder: Array<[string, number]> = [
      [chart.month.gan, 0], [chart.year.gan, 1], ...(chart.hour ? [[chart.hour.gan, 2] as [string, number]] : []),
    ];
    const RANK_W = [1, 0.5, 0.3]; // 정기·중기·여기
    const rootScore = (stem: string) =>
      pillars.reduce((sum, p, i) => {
        const r = [...HIDDEN[p.zhi]].reverse();
        let w = 0;
        r.forEach((h, k) => { if (STEM_EL[h] === STEM_EL[stem]) w = Math.max(w, RANK_W[k] ?? 0.3); });
        return sum + w * (i === MONTH ? 2 : 1);
      }, 0);
    const cands: Array<{ h: string; pos: number; root: number }> = [];
    hs.forEach((h) => {
      if (!TG_TO_GYEOK[tenGodOfStem(dm, h)]) return; // 비겁 투출은 격 아님
      const hit = posOrder.find(([g]) => g === h);
      if (hit) cands.push({ h, pos: hit[1], root: rootScore(h) });
    });
    let pick: string;
    if (cands.some((c) => c.h === main)) pick = main;
    else if (cands.length) pick = cands.sort((x, y) => y.root - x.root || x.pos - y.pos)[0].h;
    else pick = main;
    gyeok = TG_TO_GYEOK[tenGodOfStem(dm, pick)] ?? "wolgeop";
    basis = `${mz}→${pick}`;
    const mainG = TG_TO_GYEOK[tenGodOfStem(dm, main)];
    if (mainG && mainG !== gyeok) sub = mainG;
  }

  // ── 용신·희신·기신 (strength.ts와 동일 기준) ──
  const fav = analyzeStrength(chart, lang).favorable;
  const yong = fav[0];
  let hee = fav.slice(1);
  if (hee.length === 0) hee = [generatedBy(yong)];
  let gi = controlledBy(yong);
  if (fav.includes(gi)) {
    const alt = (["wood", "fire", "earth", "metal", "water"] as Element[]).find(
      (e) => !fav.includes(e) && (controlledBy(e) === yong || e === controlledBy(hee[0]))
    );
    gi = alt ?? gi;
  }

  return {
    dm: { stem: dm, element: chart.dayMasterElement, image: DM_IMAGE[dm]?.[lang] ?? dm, emoji: DM_EMOJI[dm] ?? "⭐" },
    strongest,
    afterRel: { ...after, changed: after.element !== strongest.element },
    relations,
    gyeok: { key: gyeok, name: GYEOK_NAME[gyeok][lang], basis, sub: sub ? { key: sub, name: GYEOK_NAME[sub][lang] } : undefined },
    yong,
    hee,
    gi,
    elName: EL_NAME[lang],
  };
}

/** AI 프롬프트용 한 줄 요약 (한국어 사실). */
export function summaryFact(chart: SajuChart): string {
  const s = summarize(chart, "ko");
  const rel = s.relations
    .map((r) => {
      const n = { stemHapHwa: "천간합화", stemHap: "천간합(묶임)", yukhap: "육합", samhap: "삼합국", banhap: "반합", banghap: "방합", chung: "충" }[r.kind];
      return `${r.chars} ${n}${r.element ? `(${s.elName[r.element]})` : ""}`;
    })
    .join(", ");
  const monthBranch = chart.month?.zhi ?? "";
  const season = "寅卯辰".includes(monthBranch) && monthBranch ? "봄" : "巳午未".includes(monthBranch) && monthBranch ? "여름" : "申酉戌".includes(monthBranch) && monthBranch ? "가을" : "亥子丑".includes(monthBranch) && monthBranch ? "겨울" : "";
  const yinYang = "甲丙戊庚壬".includes(s.dm.stem) ? "양" : "음";
  return [
    `- 일간 상징(고정): ${s.dm.stem} = ${DM_IMAGE[s.dm.stem]?.ko ?? s.dm.stem} (${yinYang}${s.elName[s.dm.element]})` +
      (season ? ` · ${season} 출생 → 비유는 반드시 '${season}의 ${DM_IMAGE[s.dm.stem]?.ko ?? s.dm.stem}'으로` : ""),
    `- 격국: ${s.gyeok.name}${s.gyeok.sub ? ` (보조격 ${s.gyeok.sub.name})` : ""} (근거 월지 ${s.gyeok.basis})`,
    `- 용신: ${s.elName[s.yong]} / 희신: ${s.hee.map((e) => s.elName[e]).join("·")} / 기신: ${s.elName[s.gi]}`,
    `- 가장 강한 오행(지장간·월령 가중): ${s.elName[s.strongest.element]} ${s.strongest.pct}%` +
      (s.afterRel.changed ? ` → 합·충 반영 후 ${s.elName[s.afterRel.element]} ${s.afterRel.pct}%` : ""),
    `- 원국 합·충: ${rel || "없음"}`,
  ].join("\n");
}
