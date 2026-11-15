// 명리 사실 계산 레이어 — 십신(十神)·12운성·추가 신살·세운·대운·나이.
//
// 원칙: AI는 여기서 계산한 "검증된 사실"만 근거로 쓸 수 있다. 엔진이 계산하지
// 않은 십신·신살·대운을 AI가 지어내지 못하게 하는 것이 이 파일의 목적이다.
// (사주아이·마법당 같은 경쟁 사이트가 근거 없는 합·살을 지어내는 문제를 막는다.)

import type { SajuChart, Pillar, Element } from "./saju";
import type { Lang } from "./i18n";
import { summaryFact } from "./summary";

// ── 기본 표 ───────────────────────────────────────────────────────────────
const STEMS = ["甲", "乙", "丙", "丁", "戊", "己", "庚", "辛", "壬", "癸"];
const BRANCHES = ["子", "丑", "寅", "卯", "辰", "巳", "午", "未", "申", "酉", "戌", "亥"];

const STEM_EL: Record<string, Element> = {
  "甲": "wood", "乙": "wood", "丙": "fire", "丁": "fire", "戊": "earth",
  "己": "earth", "庚": "metal", "辛": "metal", "壬": "water", "癸": "water",
};
const isYang = (stem: string) => STEMS.indexOf(stem) % 2 === 0;

// 지지 정기(正氣) — 지지의 십신은 정기 기준(子·午·巳·亥 체용 반영).
const MAIN_HIDDEN: Record<string, string> = {
  "子": "癸", "丑": "己", "寅": "甲", "卯": "乙", "辰": "戊", "巳": "丙",
  "午": "丁", "未": "己", "申": "庚", "酉": "辛", "戌": "戊", "亥": "壬",
};

const GEN: Record<Element, Element> = {
  wood: "fire", fire: "earth", earth: "metal", metal: "water", water: "wood",
};
const CTRL: Record<Element, Element> = {
  wood: "earth", earth: "water", water: "fire", fire: "metal", metal: "wood",
};

// ── 십신 ─────────────────────────────────────────────────────────────────
export type TenGod =
  | "bigyeon" | "geopjae" | "siksin" | "sanggwan" | "pyeonjae"
  | "jeongjae" | "pyeongwan" | "jeonggwan" | "pyeonin" | "jeongin";

export const TEN_GOD_NAME: Record<TenGod, Record<Lang, string>> = {
  bigyeon: { ko: "비견", th: "비견 (เพื่อนร่วมทาง)", en: "Companion (비견)" },
  geopjae: { ko: "겁재", th: "겁재 (คู่แข่ง)", en: "Rival (겁재)" },
  siksin: { ko: "식신", th: "식신 (พรสวรรค์)", en: "Talent (식신)" },
  sanggwan: { ko: "상관", th: "상관 (ความกล้าแสดงออก)", en: "Expression (상관)" },
  pyeonjae: { ko: "편재", th: "편재 (โชคลาภก้อนใหญ่)", en: "Windfall wealth (편재)" },
  jeongjae: { ko: "정재", th: "정재 (เงินมั่นคง)", en: "Steady wealth (정재)" },
  pyeongwan: { ko: "편관", th: "편관 (อำนาจ·แรงกดดัน)", en: "Power (편관)" },
  jeonggwan: { ko: "정관", th: "정관 (เกียรติ·หน้าที่)", en: "Honor (정관)" },
  pyeonin: { ko: "편인", th: "편인 (สัญชาตญาณ)", en: "Intuition (편인)" },
  jeongin: { ko: "정인", th: "정인 (การเรียนรู้·การดูแล)", en: "Nurture (정인)" },
};

/** 일간(dm) 기준으로 천간 target의 십신. */
export function tenGodOfStem(dm: string, target: string): TenGod {
  const a = STEM_EL[dm];
  const b = STEM_EL[target];
  const same = isYang(dm) === isYang(target);
  if (a === b) return same ? "bigyeon" : "geopjae";
  if (GEN[a] === b) return same ? "siksin" : "sanggwan";
  if (CTRL[a] === b) return same ? "pyeonjae" : "jeongjae";
  if (CTRL[b] === a) return same ? "pyeongwan" : "jeonggwan";
  return same ? "pyeonin" : "jeongin"; // GEN[b] === a
}

/** 일간 기준 지지의 십신 (정기 기준). */
export function tenGodOfBranch(dm: string, branch: string): TenGod {
  return tenGodOfStem(dm, MAIN_HIDDEN[branch]);
}

// ── 12운성 ───────────────────────────────────────────────────────────────
export const STAGES = [
  "장생", "목욕", "관대", "건록", "제왕", "쇠", "병", "사", "묘", "절", "태", "양",
];
const STAGE_TH: Record<string, string> = {
  "장생": "เกิดใหม่", "목욕": "ชำระล้าง", "관대": "เติบโต", "건록": "มั่นคง",
  "제왕": "จุดสูงสุด", "쇠": "ผ่อนลง", "병": "อ่อนแรง", "사": "สงบนิ่ง",
  "묘": "เก็บสะสม", "절": "ตัดขาด", "태": "ก่อตัว", "양": "บ่มเพาะ",
};
const CHANGSAENG: Record<string, string> = {
  "甲": "亥", "丙": "寅", "戊": "寅", "庚": "巳", "壬": "申",
  "乙": "午", "丁": "酉", "己": "酉", "辛": "子", "癸": "卯",
};

/** 천간 stem이 지지 branch에서 갖는 12운성 (양간 순행, 음간 역행). */
export function twelveStage(stem: string, branch: string): string {
  const start = BRANCHES.indexOf(CHANGSAENG[stem]);
  const pos = BRANCHES.indexOf(branch);
  const step = isYang(stem) ? (pos - start + 12) % 12 : (start - pos + 12) % 12;
  return STAGES[step];
}

export function stageLabel(stage: string, lang: Lang): string {
  return lang === "th" ? `${stage} (${STAGE_TH[stage]})` : stage;
}

// ── 추가 신살 (기둥·위치 확정형) ─────────────────────────────────────────
// 백호·괴강은 "그 기둥 자체"가 해당 간지일 때만, 천을귀인은 일간 기준.
const BAEKHO = new Set(["甲辰", "乙未", "丙戌", "丁丑", "戊辰", "壬戌", "癸丑"]);
const GOEGANG = new Set(["庚辰", "庚戌", "壬辰", "壬戌", "戊戌"]);
const CHEONEUL: Record<string, string[]> = {
  "甲": ["丑", "未"], "戊": ["丑", "未"], "庚": ["丑", "未"],
  "乙": ["子", "申"], "己": ["子", "申"],
  "丙": ["亥", "酉"], "丁": ["亥", "酉"],
  "辛": ["寅", "午"],
  "壬": ["巳", "卯"], "癸": ["巳", "卯"],
};
// 원진(怨嗔) — 일지와 바로 옆 지지(월지·시지)끼리만 본다.
const WONJIN: Record<string, string> = {
  "子": "未", "未": "子", "丑": "午", "午": "丑", "寅": "酉", "酉": "寅",
  "卯": "申", "申": "卯", "辰": "亥", "亥": "辰", "巳": "戌", "戌": "巳",
};

export type PosKey = "year" | "month" | "day" | "hour";
export const POS_KO: Record<PosKey, string> = {
  year: "년주", month: "월주", day: "일주", hour: "시주",
};

export interface StarFact {
  key: "baekho" | "goegang" | "cheoneul" | "wonjin";
  positions: PosKey[];
}

export function findExtraStars(chart: SajuChart): StarFact[] {
  const out: StarFact[] = [];
  const pillars: Array<[PosKey, Pillar | null]> = [
    ["year", chart.year], ["month", chart.month], ["day", chart.day], ["hour", chart.hour],
  ];
  const bh: PosKey[] = [];
  const gg: PosKey[] = [];
  const ce: PosKey[] = [];
  for (const [k, p] of pillars) {
    if (!p) continue;
    const gz = p.gan + p.zhi;
    if (BAEKHO.has(gz)) bh.push(k);
    if (GOEGANG.has(gz)) gg.push(k);
    if (CHEONEUL[chart.dayMaster]?.includes(p.zhi)) ce.push(k);
  }
  if (bh.length) out.push({ key: "baekho", positions: bh });
  if (gg.length) out.push({ key: "goegang", positions: gg });
  if (ce.length) out.push({ key: "cheoneul", positions: ce });
  const wj: PosKey[] = [];
  if (WONJIN[chart.day.zhi] === chart.month.zhi) wj.push("month");
  if (chart.hour && WONJIN[chart.day.zhi] === chart.hour.zhi) wj.push("hour");
  if (wj.length) out.push({ key: "wonjin", positions: ["day", ...wj] });
  return out;
}

const STAR_KO: Record<StarFact["key"], string> = {
  baekho: "백호살", goegang: "괴강살", cheoneul: "천을귀인", wonjin: "원진",
};

// ── 세운 · 나이 ─────────────────────────────────────────────────────────
/** 해당 연도의 세운 간지 (입춘 기준 연도 — 연 단위 서술에 사용). */
export function yearPillar(year: number): string {
  return STEMS[(((year - 4) % 10) + 10) % 10] + BRANCHES[(((year - 4) % 12) + 12) % 12];
}

/** 만 나이 (방콕 기준 오늘). */
export function ageOn(
  birth: { year: number; month: number; day: number },
  now: Date = new Date()
): number {
  const ict = new Date(now.getTime() + 7 * 3600_000);
  const y = ict.getUTCFullYear();
  const m = ict.getUTCMonth() + 1;
  const d = ict.getUTCDate();
  let age = y - birth.year;
  if (m < birth.month || (m === birth.month && d < birth.day)) age--;
  return age;
}

// ── 대운 (lunar-javascript Yun) ─────────────────────────────────────────
export interface DaeunStep {
  startAge: number;
  startYear: number;
  pillar: string;
}

/**
 * 대운 목록 (한국식). 성별이 없으면 순행·역행을 정할 수 없으므로 null.
 * - 대운수: 생일~절입일 거리(3일=1년)를 반올림 (예: 6년 9개월 → 7대운). 0이면 1.
 * - 나이는 한국 만세력 관례대로 '한국나이(세는 나이)' 기준: 대운수, +10, +20 …
 * - startYear: 그 한국나이가 되는 해 (출생연도 + 나이 − 1).
 * lunar-javascript: EightChar.getYun(1=남, 0=여) — getDaYun() index 0은 대운 전 구간.
 */
export function computeDaeun(
  solarUsed: SajuChart["solarUsed"],
  gender: string | undefined,
  count = 9
): DaeunStep[] | null {
  if (gender !== "M" && gender !== "F") return null;
  try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const { Solar } = require("lunar-javascript");
    const ec = Solar.fromYmdHms(
      solarUsed.y, solarUsed.m, solarUsed.d, solarUsed.h, solarUsed.min, 0
    ).getLunar().getEightChar();
    const yun = ec.getYun(gender === "M" ? 1 : 0);
    const su = Math.max(
      1,
      Math.round(yun.getStartYear() + yun.getStartMonth() / 12 + yun.getStartDay() / 365)
    );
    const list = yun.getDaYun(count + 1) as Array<{ getGanZhi(): string }>;
    return list
      .filter((d) => d.getGanZhi())
      .map((d, i) => {
        const startAge = su + 10 * i;
        return { startAge, startYear: solarUsed.y + startAge - 1, pillar: d.getGanZhi() };
      });
  } catch {
    return null;
  }
}

/** 지금 한국나이에 해당하는 대운. */
export function currentDaeun(list: DaeunStep[] | null, koreanAge: number): DaeunStep | null {
  if (!list?.length) return null;
  let cur: DaeunStep | null = null;
  for (const d of list) if (d.startAge <= koreanAge) cur = d;
  return cur;
}

// ── 원국 상세 (화면 표 + AI 사실 목록 공용) ───────────────────────────────
export interface PillarDetail {
  pos: PosKey;
  gan: string;
  zhi: string;
  ganGod: TenGod | "self";
  zhiGod: TenGod;
  stage: string; // 일간 기준 12운성
}

export function pillarDetails(chart: SajuChart): PillarDetail[] {
  const dm = chart.dayMaster;
  const rows: Array<[PosKey, Pillar | null]> = [
    ["hour", chart.hour], ["day", chart.day], ["month", chart.month], ["year", chart.year],
  ];
  return rows
    .filter((r): r is [PosKey, Pillar] => !!r[1])
    .map(([pos, p]) => ({
      pos,
      gan: p.gan,
      zhi: p.zhi,
      ganGod: pos === "day" ? "self" : tenGodOfStem(dm, p.gan),
      zhiGod: tenGodOfBranch(dm, p.zhi),
      stage: twelveStage(dm, p.zhi),
    }));
}

/**
 * AI 프롬프트용 "검증된 사실" 블록 (한국어). AI는 이 목록에 있는 십신·신살·
 * 대운·세운만 인용할 수 있다.
 */
export function factSheet(
  chart: SajuChart,
  opts: { gender?: string; birth: { year: number; month: number; day: number }; now?: Date }
): string {
  const now = opts.now ?? new Date();
  const age = ageOn(opts.birth, now);
  const lines: string[] = [];
  lines.push(`만 나이: ${age}세 (${opts.birth.year}년생)`);
  lines.push(`일주: ${chart.day.gan}${chart.day.zhi}`);
  for (const d of pillarDetails(chart)) {
    const g = d.ganGod === "self" ? "일간(나)" : TEN_GOD_NAME[d.ganGod].ko;
    lines.push(
      `${POS_KO[d.pos]} ${d.gan}${d.zhi}: 천간=${g}, 지지=${TEN_GOD_NAME[d.zhiGod].ko}, 12운성=${d.stage}`
    );
  }
  const stars = findExtraStars(chart);
  lines.push(
    `추가 신살: ${
      stars.length
        ? stars.map((s) => `${STAR_KO[s.key]}(${s.positions.map((p) => POS_KO[p]).join("·")})`).join(", ")
        : "없음"
    }`
  );
  const daeun = computeDaeun(chart.solarUsed, opts.gender);
  if (daeun) {
    const ictY = new Date(now.getTime() + 7 * 3600_000).getUTCFullYear();
    const koreanAge = ictY - opts.birth.year + 1;
    const cur = currentDaeun(daeun, koreanAge);
    lines.push(`한국나이: ${koreanAge}세 (대운은 한국나이 기준, 대운수 ${daeun[0].startAge})`);
    lines.push(
      `대운(10년 단위): ${daeun.map((d) => `${d.pillar} ${d.startYear}~${d.startYear + 9}년(한국나이 ${d.startAge}~${d.startAge + 9}세)`).join(" → ")}`
    );
    lines.push(
      `현재 대운: ${cur ? `${cur.pillar} ${cur.startYear}~${cur.startYear + 9}년 (${ictY - cur.startYear + 1}년째)` : "대운 시작 전"}`
    );
    lines.push(`대운 서술 규칙: 본문에서 대운 시기는 나이가 아니라 연도(예: 2024~2033년)로만 써라. 나이 계산법이 나라마다 달라 혼동된다.`);
  } else {
    lines.push(`대운: 성별 미입력으로 계산 불가 — 대운 간지·시기를 지어내지 말고 일반적 흐름만 서술`);
  }
  const ict = new Date(now.getTime() + 7 * 3600_000);
  const y = ict.getUTCFullYear();
  lines.push(`세운: 올해 ${y}년 ${yearPillar(y)}, 내년 ${y + 1}년 ${yearPillar(y + 1)}`);
  // 무료 화면 '한눈에 보기' 카드와 같은 격·용신·희신·기신 — 리포트가 이와 다르게 말하면 안 됨.
  lines.push(summaryFact(chart));
  return lines.join("\n");
}
