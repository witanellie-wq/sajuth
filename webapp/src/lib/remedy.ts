// 보완 오행 → 개운 아이템(오행 팔찌·오행 티) 추천.
//
// 개인: 용신(analyzeStrength.favorable) 중 원국에 가장 적은 오행을 "나의 보완
// 오행"으로 고른다. 궁합: 두 사람 각자의 보완 오행(커플 팔찌 = 각자 보완석)과
// 두 사람 합친 원국에서 비어 있는 공통 오행(커플 오행티)을 추천한다.
//
// ⚠️ 식품(티)은 태국 อย. 규정상 효능 표현 금지 → "개운·라이프스타일" 표현만.

import type { SajuChart, Element } from "./saju";
import { analyzeStrength } from "./strength";
import type { Lang } from "./i18n";

const EL_NAME: Record<Lang, Record<Element, string>> = {
  ko: { wood: "목(木)", fire: "화(火)", earth: "토(土)", metal: "금(金)", water: "수(水)" },
  th: { wood: "ไม้ (木)", fire: "ไฟ (火)", earth: "ดิน (土)", metal: "ทอง (金)", water: "น้ำ (水)" },
  en: { wood: "Wood (木)", fire: "Fire (火)", earth: "Earth (土)", metal: "Metal (金)", water: "Water (水)" },
};

export const STONE: Record<Element, Record<Lang, string>> = {
  wood: { ko: "그린 어벤추린·옥", th: "กรีนอเวนเจอรีน·หยก", en: "green aventurine & jade" },
  fire: { ko: "레드 아게이트·가넷", th: "เรดอาเกต·โกเมน", en: "red agate & garnet" },
  earth: { ko: "타이거아이·시트린", th: "ไทเกอร์อาย·ซิทริน", en: "tiger's eye & citrine" },
  metal: { ko: "클리어 쿼츠·문스톤", th: "เคลียร์ควอตซ์·มูนสโตน", en: "clear quartz & moonstone" },
  water: { ko: "블랙 오닉스·라피스 라줄리", th: "นิล·ลาพิส ลาซูลี", en: "black onyx & lapis lazuli" },
};

const COLOR: Record<Element, Record<Lang, string>> = {
  wood: { ko: "초록", th: "เขียว", en: "green" },
  fire: { ko: "빨강·코랄", th: "แดง·คอรัล", en: "red & coral" },
  earth: { ko: "노랑·베이지", th: "เหลือง·เบจ", en: "yellow & beige" },
  metal: { ko: "흰색·실버", th: "ขาว·ซิลเวอร์", en: "white & silver" },
  water: { ko: "블랙·네이비", th: "ดำ·กรมท่า", en: "black & navy" },
};

const TEA: Record<Lang, (el: string) => string> = {
  ko: (el) => `${el} 오행 블렌드 티`,
  th: (el) => `ชาโอแฮงธาตุ${el}`,
  en: (el) => `${el} Five-Element Blend Tea`,
};

const ALL: Element[] = ["wood", "fire", "earth", "metal", "water"];

/** 개인의 보완 오행: 용신 후보 중 원국에서 가장 적은 오행. */
export function supplementElement(chart: SajuChart): Element {
  const fav = analyzeStrength(chart, "ko").favorable;
  const pool = fav.length ? fav : ALL;
  return [...pool].sort((x, y) => chart.elementCounts[x] - chart.elementCounts[y])[0];
}

export interface Remedy {
  element: Element;
  title: string;
  body: string;
}

export const REMEDY_TITLE: Record<Lang, string> = {
  ko: "🧿 나의 보완 오행 & 개운 아이템",
  th: "🧿 ธาตุเสริมดวงของคุณ & ไอเท็มเสริมโชค",
  en: "🧿 Your Missing Element & Lucky Items",
};

export function personalRemedy(chart: SajuChart, lang: Lang): Remedy {
  const el = supplementElement(chart);
  const n = EL_NAME[lang][el];
  const body =
    lang === "ko"
      ? `당신에게 채워주면 좋은 오행은 ${n} 기운이에요. 평소 ${COLOR[el].ko} 톤을 가까이하면 기운의 균형이 잡혀요.\n` +
        `▸ 오행 팔찌: ${STONE[el].ko} — 매일 손목에 두는 가장 쉬운 개운법\n` +
        `▸ ${TEA.ko(n)} — 하루 한 잔, 나를 위한 오행 루틴`
      : lang === "th"
      ? `ธาตุที่ควรเติมให้ดวงของคุณคือ ${n} ลองใช้ของโทนสี${COLOR[el].th}บ่อย ๆ จะช่วยให้พลังสมดุลขึ้นค่ะ\n` +
        `▸ กำไลโอแฮง: ${STONE[el].th} — วิธีเสริมดวงที่ง่ายที่สุด ใส่ติดข้อมือทุกวัน\n` +
        `▸ ${TEA.th(n)} — วันละแก้ว รูทีนโอแฮงเพื่อตัวเอง`
      : `The element worth adding to your chart is ${n}. Keep ${COLOR[el].en} tones close to balance your energy.\n` +
        `▸ Five-element bracelet: ${STONE[el].en} — the easiest daily luck ritual\n` +
        `▸ ${TEA.en(n)} — one cup a day, your own five-element routine`;
  return { element: el, title: REMEDY_TITLE[lang], body };
}

export const COUPLE_REMEDY_TITLE: Record<Lang, string> = {
  ko: "🧿 두 사람의 보완 오행 & 커플 개운 아이템",
  th: "🧿 ธาตุเสริมของคู่คุณ & ไอเท็มคู่เสริมดวง",
  en: "🧿 Your Couple's Elements & Matching Lucky Items",
};

/** 두 사람 합친 원국에서 가장 비어 있는 오행 — 관계를 채우는 공통 오행. */
export function sharedElement(a: SajuChart, b: SajuChart): Element {
  const favA = analyzeStrength(a, "ko").favorable;
  const favB = analyzeStrength(b, "ko").favorable;
  const common = favA.filter((e) => favB.includes(e));
  const pool = common.length ? common : ALL;
  const sum = (e: Element) => a.elementCounts[e] + b.elementCounts[e];
  return [...pool].sort((x, y) => sum(x) - sum(y))[0];
}


// 살아있는 용신: 상대의 일간(또는 원국)이 내가 필요한 기운(보완 오행)인지.
type Living = "dm" | "rich" | null;
function livingYong(me: SajuChart, other: SajuChart): Living {
  const need = supplementElement(me);
  if (other.dayMasterElement === need) return "dm";
  if ((other.elementCounts as Record<string, number>)[need] >= 2) return "rich";
  return null;
}
function livingLine(lang: Lang, n1: string, n2: string, el: string, kind: Living): string {
  if (!kind) return "";
  if (lang === "ko")
    return kind === "dm"
      ? `✨ ${n2}님 자체가 ${n1}님의 '살아있는 용신' — ${n1}님에게 필요한 ${el} 기운을 ${n2}님이 타고났어요(일간). 곁에 있는 것만으로 채워져요.\n`
      : `✨ ${n2}님 사주에 ${n1}님에게 필요한 ${el} 기운이 넉넉해요 — 함께 있으면 자연스럽게 채워지는 사이예요.\n`;
  if (lang === "th")
    return kind === "dm"
      ? `✨ ${n2} คือ 'ยงชินที่มีชีวิต' (살아있는 용신) ของ ${n1} — ${n2} เกิดมาพร้อมธาตุ${el}ที่ ${n1} ต้องการ แค่อยู่ใกล้กันก็เติมเต็มแล้วค่ะ\n`
      : `✨ ดวงของ ${n2} มีธาตุ${el}ที่ ${n1} ต้องการอยู่มาก — อยู่ด้วยกันก็เติมให้กันโดยธรรมชาติค่ะ\n`;
  return kind === "dm"
    ? `✨ ${n2} is ${n1}'s 'living lucky element' (살아있는 용신) — born with the ${el} energy ${n1} needs. Just being together fills it.\n`
    : `✨ ${n2}'s chart is rich in the ${el} energy ${n1} needs — you top each other up naturally.\n`;
}

export function coupleRemedy(
  a: SajuChart,
  b: SajuChart,
  names: { a: string; b: string },
  lang: Lang,
  romantic: boolean
): Remedy {
  const ea = supplementElement(a);
  const eb = supplementElement(b);
  const es = sharedElement(a, b);
  const N = EL_NAME[lang];
  const pair =
    lang === "ko" ? (romantic ? "커플 팔찌" : "우정 팔찌")
    : lang === "th" ? (romantic ? "กำไลคู่รัก" : "กำไลคู่เพื่อน")
    : romantic ? "couple bracelets" : "friendship bracelets";
  // 팔찌는 오행별 표준 5종만 생산 → 각자 자기 보완 오행 팔찌를 "제안"만 한다
  // (서로의 비즈를 섞는 맞춤 제작 없음). 같은 오행이면 같은 팔찌 커플 세트.
  const same = ea === eb;
  const living =
    livingLine(lang, names.a, names.b, N[ea], livingYong(a, b)) +
    livingLine(lang, names.b, names.a, N[eb], livingYong(b, a));
  const intro =
    living &&
    (lang === "ko" ? "서로에게 필요한 기운을 서로가 가지고 있어요\n" : lang === "th" ? "ต่างคนต่างมีธาตุที่อีกฝ่ายต้องการค่ะ\n" : "Each of you carries the energy the other needs\n");
  const body =
    intro + living + (living ? "\n" : "") +
    (lang === "ko"
      ? `보완 오행 — ${names.a}님: ${N[ea]} / ${names.b}님: ${N[eb]}\n` +
        (same
          ? `▸ ${pair}: 두 분 모두 ${N[ea]} 팔찌(${STONE[ea].ko}) — 같은 팔찌로 맞추면 그대로 커플 아이템이 돼요\n`
          : `▸ ${pair}: ${names.a}님은 ${N[ea]} 팔찌(${STONE[ea].ko}), ${names.b}님은 ${N[eb]} 팔찌(${STONE[eb].ko}) — 각자 부족한 기운을 채우는 서로 다른 색의 커플 팔찌\n`) +
        `▸ 함께 마시는 ${TEA.ko(N[es])} — 두 사람에게 함께 좋은 기운을 같이 채우는 루틴`
      : lang === "th"
      ? `ธาตุเสริมของ ${names.a} คือ ${N[ea]} ส่วนของ ${names.b} คือ ${N[eb]} ค่ะ\n` +
        (same
          ? `▸ ${pair}: ทั้งคู่ใส่กำไลธาตุ${N[ea]} (${STONE[ea].th}) — ใส่เส้นเดียวกันก็เป็นไอเท็มคู่ได้เลย\n`
          : `▸ ${pair}: ${names.a} ใส่กำไลธาตุ${N[ea]} (${STONE[ea].th}) ส่วน ${names.b} ใส่กำไลธาตุ${N[eb]} (${STONE[eb].th}) — คนละสี เติมธาตุที่แต่ละคนขาด\n`) +
        `▸ ${TEA.th(N[es])} ดื่มด้วยกัน — รูทีนเติมธาตุที่ดีต่อคุณทั้งคู่`
      : `${names.a}'s element to add is ${N[ea]}; ${names.b}'s is ${N[eb]}.\n` +
        (same
          ? `▸ ${pair}: both wear the ${N[ea]} bracelet (${STONE[ea].en}) — matching as is\n`
          : `▸ ${pair}: ${names.a} wears the ${N[ea]} bracelet (${STONE[ea].en}), ${names.b} the ${N[eb]} bracelet (${STONE[eb].en}) — two colors, each filling what you lack\n`) +
        `▸ ${TEA.en(N[es])} to share — a ritual for the element that suits you both`);
  return { element: es, title: COUPLE_REMEDY_TITLE[lang], body };
}

/** AI 프롬프트용 한 줄 사실 (한국어). */
export function remedyFactPersonal(chart: SajuChart): string {
  const el = supplementElement(chart);
  return `보완 오행: ${EL_NAME.ko[el]} → 추천 아이템: 오행 팔찌(${STONE[el].ko}), ${TEA.ko(EL_NAME.ko[el])}`;
}

export function remedyFactCouple(a: SajuChart, b: SajuChart, nameA: string, nameB: string): string {
  const ea = supplementElement(a);
  const eb = supplementElement(b);
  const es = sharedElement(a, b);
  return (
    `보완 오행: ${nameA}=${EL_NAME.ko[ea]}(추천 ${EL_NAME.ko[ea]} 팔찌: ${STONE[ea].ko}), ` +
    `${nameB}=${EL_NAME.ko[eb]}(추천 ${EL_NAME.ko[eb]} 팔찌: ${STONE[eb].ko}) — 팔찌는 오행별 기성 5종이므로 각자 자기 오행 팔찌만 제안하고 비즈를 섞는 맞춤 제작은 언급 금지. ` +
    `함께 마실 티: ${TEA.ko(EL_NAME.ko[es])}` +
    (() => {
      const la = livingYong(a, b), lb = livingYong(b, a);
      const t = (n1: string, n2: string, el: string, k: Living) =>
        k === "dm" ? `${n2}의 일간이 곧 ${n1}의 용신 ${el} → ${n2}는 ${n1}의 '살아있는 용신'` : k === "rich" ? `${n2}의 원국에 ${n1}의 용신 ${el}이 넉넉함` : "";
      const lines = [t(nameA, nameB, EL_NAME.ko[ea], la), t(nameB, nameA, EL_NAME.ko[eb], lb)].filter(Boolean);
      return lines.length ? `\n[살아있는 용신 — 전체 총평 첫 부분에서 '서로에게 필요한 기운을 서로가 가지고 있다'를 먼저 말하라] ${lines.join(" / ")}` : "";
    })()
  );
}
