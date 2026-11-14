// Saju (사주팔자) engine.
//
// Wraps `lunar-javascript` (validated CJK almanac / 만세력) to derive the Four
// Pillars from a birth moment, and adds the corrections that a Korean-style
// saju reading needs but the raw library does not apply for us:
//
//   1. True solar time (진태양시) — shift clock time by the birth longitude's
//      offset from the timezone meridian, so the hour pillar (시주) is correct.
//   2. Five-element (오행) distribution across all 8 characters.
//   3. Day Master (일간) extraction — the anchor of every interpretation.
//
// lunar-javascript already handles the hard parts: solar-term (절기) month-pillar
// boundaries and the 子시 day rollover. We do NOT reimplement those.

// lunar-javascript ships no types; load it untyped.
// eslint-disable-next-line @typescript-eslint/no-var-requires
const { Solar } = require("lunar-javascript");
import { findPlace } from "./places";
import { validSijin } from "./sijin";

export type Element = "wood" | "fire" | "earth" | "metal" | "water";

export interface Pillar {
  gan: string; // 天干 heavenly stem, e.g. "甲"
  zhi: string; // 地支 earthly branch, e.g. "子"
  ganElement: Element;
  zhiElement: Element;
}

export interface SajuChart {
  year: Pillar;
  month: Pillar;
  day: Pillar;
  hour: Pillar | null; // null when birth time is unknown
  dayMaster: string; // 일간 = day.gan
  dayMasterElement: Element;
  elementCounts: Record<Element, number>;
  // Debug / verification aids:
  solarUsed: { y: number; m: number; d: number; h: number; min: number };
  trueSolarCorrectionMin: number;
}

export interface SajuInput {
  year: number;
  month: number; // 1-12 (solar / 양력)
  day: number;
  hour?: number; // 0-23, omit if unknown
  minute?: number;
  /**
   * Birth longitude in degrees East. Defaults to Bangkok (100.5°E).
   * Used for the true-solar-time correction against the +7 meridian (105°E).
   */
  longitude?: number;
  /** Timezone meridian in degrees East. Thailand ICT = 105°E. */
  tzMeridian?: number;
  /** Apply true solar time correction. Default true. */
  trueSolarTime?: boolean;
  /**
   * Birth country code (places.ts). When set, the clock time is converted to
   * an absolute instant with that country's historical UTC offset (incl. DST),
   * 절기 (year/month pillars) are judged on the absolute instant, and the
   * day/hour pillars on the birthplace's true (mean) solar time — the Korean
   * 만세력 method for foreign births.
   */
  place?: string;
  /** 시진(0=자 … 11=해)만 아는 경우. hour/minute 대신 사용. */
  sijin?: number;
}

const GAN_ELEMENT: Record<string, Element> = {
  "甲": "wood", "乙": "wood",
  "丙": "fire", "丁": "fire",
  "戊": "earth", "己": "earth",
  "庚": "metal", "辛": "metal",
  "壬": "water", "癸": "water",
};

const ZHI_ELEMENT: Record<string, Element> = {
  "子": "water", "丑": "earth", "寅": "wood", "卯": "wood",
  "辰": "earth", "巳": "fire", "午": "fire", "未": "earth",
  "申": "metal", "酉": "metal", "戌": "earth", "亥": "water",
};

function splitGanZhi(pillar: string): { gan: string; zhi: string } {
  // A pillar string is two chars: gan + zhi, e.g. "甲子".
  return { gan: pillar.charAt(0), zhi: pillar.charAt(1) };
}

function toPillar(pillar: string): Pillar {
  const { gan, zhi } = splitGanZhi(pillar);
  return {
    gan,
    zhi,
    ganElement: GAN_ELEMENT[gan],
    zhiElement: ZHI_ELEMENT[zhi],
  };
}

/**
 * Minutes to add to clock time to reach true solar time.
 * 4 minutes per degree of longitude away from the timezone meridian.
 * Bangkok (100.5°E) vs ICT meridian (105°E) → about -18 min.
 * (Equation of time is omitted in the MVP; < ~16 min, rarely flips the hour pillar.)
 */
export function trueSolarCorrectionMinutes(longitude: number, tzMeridian: number): number {
  return Math.round((longitude - tzMeridian) * 4);
}

/**
 * Birthplace → true-solar-time parameters.
 * Thailand: Bangkok 100.5°E vs ICT meridian 105°E (−18 min).
 * Korea: Seoul 127.0°E vs KST meridian 135°E (−32 min) — e.g. 01:30 born in
 * Korea lands in 자시, giving 丙子時 instead of 丁丑時.
 */
export function placeCoords(place?: string): Partial<SajuInput> {
  if (place === "none") return { trueSolarTime: false };
  const p = findPlace(place) ?? findPlace("th")!;
  return { place: p.code, longitude: p.longitude };
}

export function computeSaju(input: SajuInput): SajuChart {
  const {
    year, month, day,
    hour, minute = 0,
    longitude = 100.5,
    tzMeridian = 105,
    trueSolarTime = true,
  } = input;

  const sijin = validSijin(input.sijin) ? input.sijin : undefined;
  const hasTime = typeof hour === "number" || sijin !== undefined;

  // lunar-javascript reads a wall-clock moment as China time (UTC+8) for 절기.
  // 한국 만세력 기준: 子시(23시~)가 시작되면 일주도 다음 날로 넘어간다
  // (lunar-javascript sect 1). 기본값(sect 2)은 23시대를 전날 일주로 두는
  // 중국식 야자시 처리라 사주아이·마법당 등 한국 앱과 일주가 달라진다.
  const ecAt = (dt: Date) => {
    const ec = Solar.fromYmdHms(
      dt.getUTCFullYear(), dt.getUTCMonth() + 1, dt.getUTCDate(),
      dt.getUTCHours(), dt.getUTCMinutes(), 0
    ).getLunar().getEightChar();
    ec.setSect(1);
    return ec;
  };

  let corr = 0;
  let local = new Date(Date.UTC(year, month - 1, day, hasTime ? hour! : 12, minute, 0));
  let ecLocal; // day / hour pillars
  let ecTerm; // year / month pillars (절기)
  const placeDef = input.place ? findPlace(input.place) : undefined;

  if (sijin !== undefined) {
    // 시진만 아는 경우: 진태양시로 그 시진의 가운데(자시는 그 날 00:30)를
    // 바로 사용 — 시주가 선택한 시진으로 확정되고 일주는 입력한 날짜 기준.
    const solarLocal = new Date(
      Date.UTC(year, month - 1, day, sijin === 0 ? 0 : sijin * 2, sijin === 0 ? 30 : 0, 0)
    );
    const lon = placeDef ? longitude : tzMeridian;
    const utcMs = solarLocal.getTime() - (lon / 15) * 3600_000;
    local = solarLocal;
    ecLocal = ecAt(solarLocal);
    ecTerm = ecAt(new Date(utcMs + 8 * 3600_000));
  } else if (hasTime && trueSolarTime && placeDef) {
    // Clock time → absolute instant via the birthplace's historical offset.
    const offsetH = placeDef.offsetAt(year, month, day, hour!);
    const utcMs = local.getTime() - offsetH * 3600_000;
    const solarLocal = new Date(utcMs + (longitude / 15) * 3600_000); // 진태양시(평균)
    const chinaClock = new Date(utcMs + 8 * 3600_000);
    corr = Math.round((solarLocal.getTime() - local.getTime()) / 60_000);
    local = solarLocal;
    ecLocal = ecAt(solarLocal);
    ecTerm = ecAt(chinaClock);
  } else {
    // Legacy path (tests, "none", or unknown time): single moment.
    if (hasTime && trueSolarTime) {
      corr = trueSolarCorrectionMinutes(longitude, tzMeridian);
      local = new Date(local.getTime() + corr * 60_000);
    }
    ecLocal = ecAt(local);
    ecTerm = ecLocal;
  }

  const y = local.getUTCFullYear();
  const mo = local.getUTCMonth() + 1;
  const d = local.getUTCDate();
  const h = local.getUTCHours();
  const mi = local.getUTCMinutes();

  const yearP = toPillar(ecTerm.getYear());
  const monthP = toPillar(ecTerm.getMonth());
  const dayP = toPillar(ecLocal.getDay());
  const hourP = hasTime ? toPillar(ecLocal.getTime()) : null;

  const elementCounts: Record<Element, number> = {
    wood: 0, fire: 0, earth: 0, metal: 0, water: 0,
  };
  const pillars = [yearP, monthP, dayP, ...(hourP ? [hourP] : [])];
  for (const p of pillars) {
    elementCounts[p.ganElement]++;
    elementCounts[p.zhiElement]++;
  }

  return {
    year: yearP,
    month: monthP,
    day: dayP,
    hour: hourP,
    dayMaster: dayP.gan,
    dayMasterElement: dayP.ganElement,
    elementCounts,
    solarUsed: { y, m: mo, d, h: hasTime ? h : 12, min: hasTime ? mi : 0 },
    trueSolarCorrectionMin: corr,
  };
}
