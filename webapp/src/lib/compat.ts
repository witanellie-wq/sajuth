// Compatibility (궁합) engine — scores two charts and writes a localized verdict.
//
// Blends three classic signals:
//   1. Day-master (일간) element relation — 상생 supportive, 상극 tension, same comfortable.
//   2. Day-branch (일지 = spouse palace) relation — 六合/三合 harmony, 六沖 clash.
//   3. 용신 complement — does each partner supply what the other's chart lacks?

import type { SajuChart } from "./saju";
import { relationTo } from "./elements";
import { analyzeStrength } from "./strength";
import { findSinsal } from "./sinsal";
import type { Lang } from "./i18n";

export interface CompatSection {
  key: string;
  title: string;
  body: string;
  locked: boolean;
}

export interface Compatibility {
  score: number; // 0..99 overall
  intimate?: number; // 0..99 속궁합 (romantic relationships only)
  bandTh: string; // localized band label (name kept for back-compat)
  headline: string;
  rel: string; // day-master relation key — drives premium content
  relationship: string;
  lang: Lang;
  sections: CompatSection[];
  // Factual list of every cross-chart combination the engine found, with
  // positions ("{A}의 시지 亥 ↔ {B}의 일지 戌 — 암합"). {A}/{B} tokens are
  // replaced with real names in the report prompt; the AI may only cite
  // combinations from this list, never invent its own.
  combos?: string[];
}

// 六合 harmony pairs.
const LIU_HE = new Set(["子丑", "寅亥", "卯戌", "辰酉", "巳申", "午未"]);
// 六沖 clash pairs.
const LIU_CHONG = new Set(["子午", "丑未", "寅申", "卯酉", "辰戌", "巳亥"]);
// 三合 trine groups.
const SAN_HE: string[][] = [
  ["申", "子", "辰"],
  ["亥", "卯", "未"],
  ["寅", "午", "戌"],
  ["巳", "酉", "丑"],
];
// 암합 (hidden combinations) — derived from 지장간 (hidden stems) forming
// 천간합 pairs. Value = number of hidden combos (丑寅 triple is strongest).
// 子午 (a CLASH pair!) hides 壬丁 — why clash couples still burn for each
// other. 辰酉/巳申 excluded (already visible 육합).
const AMHAP_COMBOS: Record<string, number> = {
  "丑寅": 3, "寅丑": 3,
  "子戌": 2, "戌子": 2,
  "午亥": 2, "亥午": 2,
  "子午": 1, "午子": 1,
  "子巳": 1, "巳子": 1,
  "寅未": 1, "未寅": 1,
  "卯申": 1, "申卯": 1,
  "戌亥": 1, "亥戌": 1,
};
// Pairs whose hidden combo is 丁壬 (정임) — feeds the intimate boost.
const AMHAP_JEONGIM = new Set(["子午", "午子", "子戌", "戌子", "午亥", "亥午", "戌亥", "亥戌"]);
// 우합/隅合 (corner combinations, 모서리합) — adjacent "corner" pairs of the
// branch square: 丑寅, 辰巳, 未申, 戌亥. A subtle, steady pull.
const WOOHAP = new Set(["丑寅", "辰巳", "未申", "戌亥"]);

const WINTER = new Set(["亥", "子", "丑"]);
const SUMMER = new Set(["巳", "午", "未"]);

// What controls each element (element → its controller).
const CONTROLLER: Record<string, string> = {
  water: "earth", fire: "water", metal: "fire", wood: "metal", earth: "wood",
};
// What each element generates.
const GENERATES: Record<string, string> = {
  wood: "fire", fire: "earth", earth: "metal", metal: "water", water: "wood",
};
// What each element controls (element → its target). 여자의 관성 = CONTROLLER[her
// element]; 남자의 재성 = CONTROLS[his element].
const CONTROLS: Record<string, string> = {
  wood: "earth", earth: "water", water: "fire", fire: "metal", metal: "wood",
};
// 양간 stems — polarity decides 정(different polarity) vs 편(same polarity).
const STEM_YANG = new Set(["甲", "丙", "戊", "庚", "壬"]);
// 천을귀인 (天乙貴人) — day stem → noble branches. 갑무경 축미, 을기 자신,
// 병정 해유, 신 인오, 임계 사묘.
const CHEONEUL: Record<string, string[]> = {
  "甲": ["丑", "未"], "戊": ["丑", "未"], "庚": ["丑", "未"],
  "乙": ["子", "申"], "己": ["子", "申"],
  "丙": ["亥", "酉"], "丁": ["亥", "酉"],
  "辛": ["寅", "午"],
  "壬": ["巳", "卯"], "癸": ["巳", "卯"],
};

type LText = Record<Lang, string>;

const NOTES: Record<string, LText> = {
  dmResource: {
    th: "ธาตุประจำตัวของทั้งคู่ ‘ส่งเสริมกัน’ (相生) ฝ่ายหนึ่งช่วยเติมพลังให้อีกฝ่าย",
    en: "Your core elements feed each other (相生) — one naturally recharges the other.",
    ko: "두 사람의 일간이 상생(相生) 관계예요 — 한쪽이 자연스럽게 다른 쪽의 에너지를 채워줍니다.",
  },
  dmSame: {
    th: "ธาตุประจำตัวเหมือนกัน เข้าใจกันง่ายเหมือนเพื่อนสนิท แต่ต้องระวังความเหมือนจนเบื่อ",
    en: "Same core element — you understand each other like close friends; just don't let sameness turn stale.",
    ko: "일간 오행이 같아요 — 절친처럼 서로를 쉽게 이해하지만, 너무 비슷해서 밋밋해지지 않게 관리가 필요해요.",
  },
  dmSameRomantic: {
    th: "ทั้งคู่มีธาตุประจำวันเดียวกัน (비견) — เข้าใจกันง่ายเหมือนเพื่อนสนิท แต่ในฐานะคู่รักมักแย่งกันนำและปะทะด้วยความดื้อของทั้งคู่ ต้องแบ่งบทบาทและเคารพพื้นที่ของกันและกัน",
    en: "You share the same Day Master (비견) — you click like best friends, but as a couple you'll wrestle over the lead and clash on stubbornness. Divide roles and respect each other's turf.",
    ko: "일간이 같은 '비견' 관계예요 — 친구처럼 잘 통하지만 부부·연인으로는 주도권 경쟁과 고집 대립이 생기기 쉬워요. 역할을 나누고 서로의 영역을 인정하는 게 관건입니다.",
  },
  dmOpposite: {
    th: "ธาตุประจำตัวมีแรงดึงดูดแบบตรงข้าม (相剋) มีเสน่ห์และความท้าทายปนกัน",
    en: "Opposite-pole attraction (相剋) between your elements — charm and challenge mixed together.",
    ko: "일간이 상극(相剋)의 끌림이에요 — 매력과 긴장이 공존하는 조합입니다.",
  },
  branchHe: {
    th: "เรือนคู่ครอง (일지) เป็น ‘六合’ — เข้าขากันสูงมาก ผูกพันแน่นแฟ้น",
    en: "Your spouse palaces (day branches) form 六合 harmony — deeply bonded and highly in sync.",
    ko: "배우자궁(일지)이 육합(六合)이에요 — 손발이 잘 맞고 유대가 깊은 조합.",
  },
  branchSanhe: {
    th: "เรือนคู่ครองเป็น ‘三合’ — เสริมกันดี ไปในทิศทางเดียวกัน",
    en: "Your spouse palaces form a 三合 trine — well aligned, heading the same direction.",
    ko: "배우자궁이 삼합(三合)이에요 — 같은 방향을 보며 서로를 보완합니다.",
  },
  branchSame: {
    th: "เรือนคู่ครองธาตุเดียวกัน จูนกันง่าย",
    en: "Same spouse-palace energy — easy to tune to each other.",
    ko: "배우자궁 기운이 같아 쉽게 맞춰집니다.",
  },
  branchChong: {
    th: "เรือนคู่ครองเป็น ‘六沖’ — มีแรงกระทบกัน ต้องสื่อสารและให้พื้นที่กันมากขึ้น",
    en: "Your spouse palaces clash (六沖) — extra communication and personal space are needed.",
    ko: "배우자궁이 충(六沖)이에요 — 부딪히는 힘이 있어 대화와 각자의 공간이 더 필요합니다.",
  },
  yongBoth: {
    th: "ต่างเติมเต็มธาตุที่อีกฝ่ายขาด (용신) — เป็นคู่ที่ ‘พากันดีขึ้น’",
    en: "You each supply the element the other lacks (yongsin) — a pair that makes each other better.",
    ko: "서로가 서로의 용신을 채워줘요 — '함께 있을수록 좋아지는' 짝입니다.",
  },
  yongOne: {
    th: "ฝ่ายหนึ่งช่วยเติมธาตุที่อีกฝ่ายต้องการ ประคองกันได้ดี",
    en: "One of you supplies the element the other needs — good mutual support.",
    ko: "한쪽이 상대에게 필요한 오행을 채워줘요 — 든든하게 지탱하는 관계.",
  },
  climate: {
    th: "ดวงของทั้งคู่เติมเต็มอุณหภูมิให้กันอย่างสมบูรณ์ (조후) — ฝ่ายหนึ่งเย็นลึก อีกฝ่ายอบอุ่น เหมือนแสงแดดยามเช้าที่สาดลงทะเลหนาว อยู่ด้วยกันแล้วรู้สึก ‘พอดี’ อย่างประหลาด",
    en: "Your charts complete each other's temperature (조후 climate balance) — one runs deep and cool, the other warm, like morning sunlight on a winter sea. Together it simply feels right.",
    ko: "두 사주가 서로의 온도를 완벽하게 보완해요(조후) — 한쪽은 차고 깊고, 한쪽은 따뜻하죠. 겨울 바다에 아침 햇살이 비치듯, 함께 있으면 이상하리만큼 '딱 맞는' 느낌이 듭니다.",
  },
  control: {
    th: "ธาตุที่ล้นเกินของฝ่ายหนึ่งถูกธาตุของอีกฝ่ายโอบรับไว้พอดี (เช่น ดินโอบน้ำ 土克水) ทำให้อารมณ์และจังหวะชีวิตนิ่งขึ้นมากเมื่ออยู่ด้วยกัน",
    en: "One partner's overflowing element is gently banked by the other's (like earth holding water, 土克水) — life feels far steadier together.",
    ko: "한쪽의 넘치는 기운을 상대의 오행이 부드럽게 받아줘요(토극수처럼). 함께 있으면 감정과 생활 리듬이 훨씬 안정됩니다.",
  },
  feed: {
    th: "มีหลายตำแหน่งในดวงที่ธาตุของฝ่ายหนึ่งคอย ‘หล่อเลี้ยง’ ธาตุของอีกฝ่าย ยิ่งใช้เวลาด้วยกัน อีกฝ่ายยิ่งเบ่งบาน",
    en: "Many positions in your charts where one partner's energy feeds the other's — the longer you're together, the more you both bloom.",
    ko: "사주 곳곳에서 한쪽의 기운이 상대를 살리는 자리가 많아요 — 함께할수록 서로 피어나는 관계.",
  },
  amhap: {
    th: "มีคู่ ‘암합(暗合)’ ซ่อนอยู่หลายตำแหน่ง — แรงดึงดูดลึก ๆ ที่อธิบายไม่ถูก คนนอกมองไม่เห็น แต่ใจของทั้งคู่รู้ดี",
    en: "Several hidden bonds (암합) run between your charts — a quiet, unexplainable pull that outsiders can't see but you both feel.",
    ko: "두 사주 사이에 암합(暗合)이 여럿 있어요 — 겉으론 안 보여도 서로만 아는 깊은 끌림이 흐릅니다.",
  },
  onui: {
    th: "เดือนเกิด (월지) ของทั้งคู่เป็นราศีเดียวกัน — สบายใจเหมือนพี่น้อง (오누이) เข้าใจกันง่ายมาก แต่ประกายโรแมนติกจางเร็ว ต้องตั้งใจเดตกันต่อเนื่อง",
    en: "You share the same birth-month branch — comfortable like siblings (오누이). Easy understanding, but the romantic spark fades fast; keep dating on purpose.",
    ko: "월지가 같은 오누이 궁합이에요 — 남매처럼 편하고 잘 통하지만, 설렘이 빨리 무뎌질 수 있어 의식적으로 데이트를 챙겨야 해요.",
  },
  spouseStarJeong: {
    th: "ธาตุประจำวันของฝ่ายชายเป็น 'ดาวสามี' (정관) ของฝ่ายหญิง และฝ่ายหญิงเป็น 'ดาวภรรยา' (정재) ของฝ่ายชาย — โครงสร้างคู่แท้แบบตำราที่ทำให้มองกันเป็น 'คู่ชีวิต' ตั้งแต่แรกพบ",
    en: "His day master is her 정관 (husband star) and she is his 정재 (wife star) — the textbook spouse-star pairing that makes two people register each other as marriage material.",
    ko: "남자의 일간이 여자에게 정관(남편성), 여자의 일간이 남자에게 정재(아내성)가 되는 교과서적 배필 구조예요 — 서로를 처음부터 '배우자감'으로 강하게 의식하게 되는 인연입니다.",
  },
  spouseStarPyeon: {
    th: "ธาตุประจำวันของฝ่ายชายเป็น 편관 ของฝ่ายหญิง และฝ่ายหญิงเป็น 편재 ของฝ่ายชาย — แรงดึงดูดแบบเข้มข้น เร่าร้อน หยุดคิดถึงกันไม่ได้",
    en: "His day master is her 편관 and she is his 편재 — the intense, magnetic version of the spouse-star pull; hard to get each other out of your heads.",
    ko: "남자의 일간이 여자에게 편관, 여자의 일간이 남자에게 편재가 되는 구조예요 — 정(正)보다 자극적이고 강렬한 끌림으로, 서로가 자꾸 생각나는 인연입니다.",
  },
  officerPull: {
    th: "ดวงฝ่ายชายเต็มไปด้วยธาตุ 'ดาวสามี' (관성) ของฝ่ายหญิง — ฝ่ายหญิงจะรู้สึกว่าเขา 'แมนมาก' และถูกดึงดูดได้ง่าย",
    en: "His chart is rich in her officer element (관성, the husband star) — she instinctively reads him as 'very much a man' and is drawn in.",
    ko: "남자의 원국에 여자의 관성(남편성) 기운이 가득해요 — 여자 쪽에서 본능적으로 '남자답다'고 느끼며 끌리기 쉬운 구조입니다.",
  },
  wealthPull: {
    th: "ดวงฝ่ายหญิงเต็มไปด้วยธาตุ 'ดาวภรรยา' (재성) ของฝ่ายชาย — ฝ่ายชายจะมองเธอเป็นคู่ชีวิตโดยธรรมชาติ",
    en: "Her chart is rich in his wealth element (재성, the wife star) — he naturally reads her as wife material and is drawn in.",
    ko: "여자의 원국에 남자의 재성(아내성) 기운이 풍부해요 — 남자 쪽에서 자연스럽게 '아내감'으로 느끼며 강하게 끌리는 구조입니다.",
  },
  nobleBoth: {
    th: "ในดวงของทั้งคู่มี 천을귀인 (ดาวผู้อุปถัมภ์) ของอีกฝ่ายอยู่ — แค่อยู่ข้างกันก็ช่วยเหลือเกื้อกูลกัน เป็นการพบกันของผู้มีบุญคุณต่อกัน",
    en: "Each of you carries the other's 천을귀인 (noble star) — simply being together brings help and care both ways; a meeting of mutual benefactors.",
    ko: "서로의 사주에 상대의 천을귀인(天乙貴人)이 들어 있어요 — 곁에 있는 것만으로 서로를 돕고 아껴주게 되는, 귀인끼리의 만남입니다.",
  },
  nobleOne: {
    th: "ดวงฝ่ายหนึ่งมี 천을귀인 (ดาวผู้อุปถัมภ์) ของอีกฝ่ายอยู่ — อยู่ใกล้คนนี้แล้วเรื่องต่าง ๆ จะคลี่คลาย ได้รับการดูแลเหมือนมีผู้ใหญ่คุ้มครอง",
    en: "One chart carries the other's 천을귀인 (noble star) — beside this person, things untangle and care flows naturally; a benefactor bond.",
    ko: "한쪽 사주에 상대의 천을귀인(天乙貴人)이 자리해요 — 그 사람 곁에 있으면 일이 풀리고 보살핌을 받게 되는 귀인 인연입니다.",
  },
  dohwaBoth: {
    th: "ทั้งคู่มี 도화살 (ดาวเสน่ห์) ในดวง — ต่างคนต่างมีแรงดึงดูดทางเสน่ห์สูง เจอกันแล้วประกายไฟติดง่ายมาก",
    en: "Both carry 도화살 (the peach-blossom charm star) — two magnetic people; sparks fly fast when they meet.",
    ko: "두 사람 모두 도화살(桃花)을 지녔어요 — 각자 매력이 강한 사람들이라, 만나는 순간 불꽃이 튀기 쉬운 조합입니다.",
  },
  dohwaOne: {
    th: "ฝ่ายหนึ่งมี 도화살 (ดาวเสน่ห์) ในดวง — เสน่ห์ของคนนี้คือแรงดึงดูดหลักของความสัมพันธ์",
    en: "One of you carries 도화살 (the peach-blossom charm star) — that person's magnetism is a main engine of this bond.",
    ko: "한쪽이 도화살(桃花)을 지녔어요 — 그 사람의 매력이 이 인연을 끌고 가는 힘 중 하나입니다.",
  },
  hongyeom: {
    th: "มี 홍염살 (ดาวเสน่หายั่วใจ) ในดวง — เสน่ห์แบบอบอุ่นหวานซึ้งที่ทำให้คนใกล้ตัวหลงใหล ความสัมพันธ์นี้มีความโรแมนติกสูง",
    en: "홍염살 (the red-charm star) is present — a warm, sweet magnetism that makes this relationship run romantic and affectionate.",
    ko: "홍염살(紅艶)이 있어요 — 은근하고 달콤한 매력으로 상대를 사로잡는 기운이라, 이 관계는 로맨틱한 밀도가 높습니다.",
  },
  hwagaeBoth: {
    th: "ทั้งคู่มี 화개살 (ดาวศิลปะและจิตวิญญาณ) — คุยกันลึกได้ถึงเรื่องศิลปะ ปรัชญา จิตใจ เป็นคู่ที่เหงาแล้วเข้าใจกัน",
    en: "Both carry 화개살 (the canopy star of art and spirit) — deep talks about art, philosophy, and the inner world come naturally; two solitudes that understand each other.",
    ko: "두 사람 모두 화개살(華蓋)을 지녔어요 — 예술·철학·정신세계 이야기가 통하는, 고독을 서로 알아봐주는 깊은 교감의 짝입니다.",
  },
  myeonghap: {
    th: "มีธาตุฟ้า (천간) ของทั้งคู่จับคู่กันแบบเปิดเผย (명합) — ความเข้ากันที่มองเห็นได้ชัด คนรอบข้างก็สัมผัสได้",
    en: "Your visible heavenly stems form open combinations (명합) — a compatibility even people around you can feel.",
    ko: "두 사주의 천간이 겉으로 드러나게 합(명합)을 이뤄요 — 주변 사람들도 느낄 만큼 잘 어울리는 조합입니다.",
  },
  branchHeAll: {
    th: "มีคู่ 육합 ระหว่างเสาต่าง ๆ ของทั้งสองดวง — จุดเชื่อมที่ทำให้ชีวิตประสานกันได้หลายด้าน",
    en: "육합 harmonies link various pillars across your charts — connection points that sync your lives on several fronts.",
    ko: "두 사주의 여러 기둥 사이에 육합이 걸려 있어요 — 삶의 여러 방면이 자연스럽게 맞물리는 연결고리입니다.",
  },
  earthWater: {
    th: "คู่ธาตุดิน×น้ำ — เหมือนเขื่อนกับสายน้ำ ฝ่ายหนึ่งให้ทิศทาง อีกฝ่ายให้ความลึกและความยืดหยุ่น ตำราถือว่าเป็นคู่ครองที่เกื้อกูลกันเป็นพิเศษ",
    en: "An Earth × Water pairing — like a dam and its river: one gives direction, the other depth and flow. Classically an especially nourishing match.",
    ko: "토×수 조합 — 제방과 강물처럼 한쪽은 방향을, 한쪽은 깊이와 유연함을 줘요. 명리에서 특히 서로를 살리는 배필로 보는 짝입니다.",
  },
  woohap: {
    th: "มีคู่ ‘우합(隅合)’ ระหว่างดวงของทั้งสอง (เช่น 술해합·축인합) — แรงดึงดูดแบบมุมชนมุม เงียบแต่เหนียวแน่น ยิ่งอยู่ใกล้ยิ่งผูกพันโดยไม่รู้ตัว",
    en: "A 우합 (corner combination — like 戌亥 or 丑寅) links your charts: a quiet, corner-to-corner pull that binds you more the longer you're close.",
    ko: "두 사주 사이에 우합(隅合, 술해합·축인합 등)이 있어요 — 모서리끼리 만나듯 조용하지만 끈끈하게 끌리는 인연입니다.",
  },
};

// 속궁합 (intimate chemistry) signal texts — assembled into the paid section.
const INTIMATE_TEXT = {
  intro: {
    th: (n: number) => `คะแนนเคมีเชิงลึก (속궁합) ของคู่คุณคือ ${n}%`,
    en: (n: number) => `Your intimate-chemistry (속궁합) score is ${n}%.`,
    ko: (n: number) => `두 사람의 속궁합 점수는 ${n}%입니다.`,
  },
  chong: {
    th: "แรงปะทะระหว่างเสาวัน/เสาเวลา (沖) กลายเป็นแรงดึงดูดทางกายที่รุนแรง — ยิ่งใกล้กันยิ่งร้อนแรง ทะเลาะแล้วยิ่งคิดถึง",
    en: "The clash (沖) between your day/hour pillars turns into fierce physical chemistry — the closer you get, the hotter it burns; even fights end in longing.",
    ko: "일지·시지의 충(沖)이 오히려 강렬한 끌림으로 작동해요 — 가까울수록 뜨겁고, 다투고 나면 더 그리워지는 조합.",
  },
  amhap: {
    th: "암합 หลายตำแหน่งสร้างเคมีลับที่คนนอกมองไม่เห็น — สบตากันนิดเดียวก็รู้ใจ สัมผัสเดียวก็เข้าใจ",
    en: "Multiple hidden bonds (암합) create a secret chemistry outsiders can't see — one glance, one touch, and you both know.",
    ko: "암합이 여러 자리라 남들은 모르는 은밀한 케미가 있어요 — 눈빛 하나, 스침 하나로 통합니다.",
  },
  jeongim: {
    th: "ในดวงมี ‘정임합(丁壬)’ — คู่ธาตุแห่งแรงดึงดูดต้านไม่ได้ตามตำรา เสน่หาลึก เหนียวแน่น และหวานเป็นพิเศษ",
    en: "Your charts carry the 丁壬 combination — the textbook bond of irresistible attraction. Deep, clinging, unusually sweet.",
    ko: "사주에 정임합(丁壬)이 있어요 — 명리에서 말하는 '거부할 수 없는 끌림'의 조합. 깊고 끈끈하며 유난히 달콤합니다.",
  },
  water: {
    th: "เสาวัน/เสาปีของทั้งคู่รวมกันกลายเป็นธาตุน้ำ (합화수) — ธาตุแห่งความใกล้ชิด อารมณ์ และความลึกซึ้งทางกาย คู่แบบนี้เคมีตอนอยู่กันสองคนดีเป็นพิเศษ",
    en: "Your day/year branches combine into Water (합화수) — the element of closeness, emotion, and physical depth. Alone together, your chemistry peaks.",
    ko: "일지·년지가 합쳐져 수(水)로 변해요(합화수) — 친밀함과 감정을 관장하는 기운이라 둘만 있을 때 케미가 절정입니다.",
  },
  onui: {
    th: "แต่เพราะเป็นคู่ 오누이 (เกิดเดือนราศีเดียวกัน) ความสบายใจแบบพี่น้องอาจกลบประกายเสน่หา ต้องตั้งใจสร้างบรรยากาศพิเศษให้กันบ้าง",
    en: "That said, as an 오누이 pair (same birth-month branch) the sibling-like comfort can mute the spark — set the mood on purpose.",
    ko: "다만 오누이 궁합(같은 월지)이라 남매 같은 편안함이 설렘을 덮기 쉬워요 — 특별한 분위기는 의식적으로 만들어야 합니다.",
  },
  bikyeon: {
    th: "และการเป็น 비견 (ธาตุประจำวันเดียวกัน) ทำให้บางจังหวะเหมือนเพื่อนสนิทมากกว่าคู่รัก ต้องคอยเติมโหมดโรแมนติก",
    en: "And as 비견 (same Day Master) you slip into best-friend mode more easily than lovers' mode — keep feeding the romance.",
    ko: "비견(같은 일간) 조합이라 연인보다 친구 모드로 흐르기 쉬운 점도 반영했어요 — 로맨틱 모드를 자주 켜주세요.",
  },
  base: {
    th: "เคมีเชิงลึกของคู่คุณอยู่ในระดับอบอุ่น ค่อย ๆ สร้างความไว้ใจ ความใกล้ชิดจะลึกขึ้นตามเวลา",
    en: "Your intimate chemistry runs warm and steady — build trust and it deepens with time.",
    ko: "속궁합은 따뜻하고 안정적인 편이에요. 신뢰가 쌓일수록 친밀함도 깊어집니다.",
  },
};

const INTIMATE_TITLE: Record<Lang, string> = {
  th: "ความเข้ากันเชิงลึก (속궁합)",
  en: "Intimate Chemistry (속궁합)",
  ko: "속궁합",
};

// Band labels for non-romantic relationships (friends/coworkers/other).
const PLATONIC_BANDS: Array<{ min: number; band: LText }> = [
  { min: 85, band: { th: "คู่หูที่ฟ้าส่งมา", en: "A Dream Team", ko: "하늘이 맺어준 짝꿍" } },
  { min: 70, band: { th: "เข้าขากันสุด ๆ", en: "Great Chemistry", ko: "환상의 케미" } },
  { min: 55, band: { th: "เข้ากันได้พอสมควร", en: "A Fair Match", ko: "무난한 사이" } },
  { min: 40, band: { th: "ต้องปรับจูนกัน", en: "Needs Tuning", ko: "조율이 필요한 사이" } },
  { min: 0, band: { th: "ท้าทายแต่เป็นไปได้", en: "Challenging but Workable", ko: "쉽지 않지만 가능한 사이" } },
];

const BANDS: Array<{ min: number; band: LText; headline: LText }> = [
  {
    min: 85,
    band: { th: "เนื้อคู่ระดับพรหมลิขิต", en: "A Destined Match", ko: "천생연분" },
    headline: {
      th: "เป็นคู่ที่ส่งเสริมและเข้าใจกันสูงมาก ยิ่งอยู่ยิ่งดี",
      en: "A pair that lifts and understands each other — the longer together, the better it gets.",
      ko: "서로를 끌어올리고 깊이 이해하는 짝 — 오래될수록 더 좋아집니다.",
    },
  },
  {
    min: 70,
    band: { th: "เข้ากันได้ดีมาก", en: "Very Compatible", ko: "아주 잘 맞는 궁합" },
    headline: {
      th: "เคมีตรงกันหลายด้าน ประคองความต่างเล็กน้อยก็ไปได้ไกล",
      en: "Chemistry aligns on many fronts — smooth out the small differences and you'll go far.",
      ko: "여러 면에서 케미가 맞아요. 작은 차이만 다듬으면 멀리 갑니다.",
    },
  },
  {
    min: 55,
    band: { th: "เข้ากันได้พอสมควร", en: "A Fair Match", ko: "무난한 궁합" },
    headline: {
      th: "เป็นคู่ที่พอไปด้วยกันได้ มีทั้งจุดที่เสริมและจุดที่ต้องปรับ ถ้าเข้าใจจังหวะของกันและกันจะราบรื่นขึ้น",
      en: "A workable pair — some strengths, some things to adjust. Understand each other's rhythm and it gets smoother.",
      ko: "무난하게 어울리는 편이에요 — 보완되는 면도, 맞춰가야 할 면도 있어요. 서로의 리듬을 이해하면 훨씬 편안해집니다.",
    },
  },
  {
    min: 40,
    band: { th: "ต้องปรับจูนกัน", en: "Needs Tuning", ko: "조율이 필요한 궁합" },
    headline: {
      th: "มีทั้งแรงดึงดูดและแรงเสียดทาน การสื่อสารคือกุญแจสำคัญ",
      en: "Both attraction and friction are present — communication is the key.",
      ko: "끌림과 마찰이 공존해요 — 소통이 열쇠입니다.",
    },
  },
  {
    min: 0,
    band: { th: "ท้าทาย แต่ไม่ใช่เป็นไปไม่ได้", en: "Challenging, Not Impossible", ko: "쉽지 않지만 불가능은 아닌 궁합" },
    headline: {
      th: "ความต่างสูง ต้องอาศัยความเข้าใจและพื้นที่ให้กันมากเป็นพิเศษ",
      en: "High contrast — this pairing needs extra understanding and generous space.",
      ko: "차이가 큰 만큼, 더 큰 이해와 여유가 필요합니다.",
    },
  },
];

const PREMIUM_TITLES: Record<Lang, Array<[string, string]>> = {
  th: [
    ["marriage", "ดวงแต่งงานของคู่นี้"],
    ["conflict", "จุดที่ต้องระวังเป็นพิเศษ"],
    ["longterm", "อนาคตระยะยาวของความสัมพันธ์"],
  ],
  en: [
    ["marriage", "Marriage Outlook"],
    ["conflict", "What to Watch Out For"],
    ["longterm", "The Long Run"],
  ],
  ko: [
    ["marriage", "결혼운"],
    ["conflict", "특히 조심할 점"],
    ["longterm", "관계의 장기 전망"],
  ],
};

const LOCKED_BODY: LText = {
  th: "ปลดล็อกเพื่ออ่านผลวิเคราะห์เชิงลึกของคู่คุณ",
  en: "Unlock to read the in-depth analysis for your pair",
  ko: "잠금을 해제하면 두 사람의 심층 분석을 볼 수 있어요",
};

const NOTE_TITLE: Record<Lang, (i: number) => string> = {
  th: (i) => `จุดที่ ${i}`,
  en: (i) => `Point ${i}`,
  ko: (i) => `포인트 ${i}`,
};

// Category titles for each analysis point — shown instead of "포인트 N" so
// readers immediately know which layer (일간/배우자궁/용신/조후/암합…) it is.
const NOTE_CAT: Record<string, LText> = {
  dmResource: { th: "💞 การเติมพลังให้กัน (일간 상생)", en: "💞 How you recharge each other", ko: "💞 기운의 흐름 — 서로를 채워주는 사이" },
  dmSame: { th: "👯 ธาตุเดียวกัน (비견)", en: "👯 Same day master (비견)", ko: "👯 비견 — 닮은 두 사람" },
  dmSameRomantic: { th: "👯 ธาตุเดียวกัน (비견)", en: "👯 Same day master (비견)", ko: "👯 비견 — 닮은 두 사람" },
  dmOpposite: { th: "⚡ แรงดึงดูดขั้วตรงข้าม (상극)", en: "⚡ Opposites attract (상극)", ko: "⚡ 상극의 끌림" },
  earthWater: { th: "⛰️🌊 ดินโอบน้ำ (토와 수)", en: "⛰️🌊 Earth embraces Water", ko: "⛰️🌊 토와 수 — 흙이 물을 품다" },
  branchHe: { th: "💍 เรือนคู่ครอง (일지)", en: "💍 Spouse palace (일지)", ko: "💍 배우자궁 — 일지의 합" },
  branchSanhe: { th: "💍 เรือนคู่ครอง (일지)", en: "💍 Spouse palace (일지)", ko: "💍 배우자궁 — 일지 삼합" },
  branchSame: { th: "💍 เรือนคู่ครอง (일지)", en: "💍 Spouse palace (일지)", ko: "💍 배우자궁 — 같은 기운" },
  branchChong: { th: "💥 เรือนคู่ครองชนกัน (충)", en: "💥 Spouse-palace clash (충)", ko: "💥 배우자궁 — 충의 긴장" },
  yongBoth: { th: "🔑 เติมธาตุที่ขาด (용신)", en: "🔑 Yongsin complement", ko: "🔑 용신 보완 — 서로의 약" },
  yongOne: { th: "🔑 เติมธาตุที่ขาด (용신)", en: "🔑 Yongsin complement", ko: "🔑 용신 보완 — 한쪽의 지원" },
  climate: { th: "🌡️ สมดุลอุณหภูมิ (조후)", en: "🌡️ Climate balance (조후)", ko: "🌡️ 조후 — 온도 궁합" },
  control: { th: "🧘 ความนิ่งทางอารมณ์ (오행 조절)", en: "🧘 Emotional steadiness", ko: "🧘 감정 안정 — 오행의 조절" },
  feed: { th: "🌱 สายหล่อเลี้ยง (상생 라인)", en: "🌱 Feeding lanes (상생)", ko: "🌱 상생 라인 — 살려주는 자리" },
  amhap: { th: "🤫 암합 — แรงดึงดูดที่ซ่อนอยู่", en: "🤫 Hidden bonds (암합)", ko: "🤫 암합 — 숨은 끌림" },
  spouseStarJeong: { th: "💘 ดาวคู่ครอง (정관·정재)", en: "💘 Spouse stars (정관·정재)", ko: "💘 배우자성 — 정관과 정재" },
  spouseStarPyeon: { th: "💘 ดาวคู่ครอง (편관·편재)", en: "💘 Spouse stars (편관·편재)", ko: "💘 배우자성 — 편관과 편재" },
  officerPull: { th: "💘 ดาวสามี (관성)", en: "💘 Husband star (관성)", ko: "💘 배우자성 — 남편성의 끌림" },
  wealthPull: { th: "💘 ดาวภรรยา (재성)", en: "💘 Wife star (재성)", ko: "💘 배우자성 — 아내성의 끌림" },
  nobleBoth: { th: "🌟 천을귀인 — ผู้อุปถัมภ์ของกันและกัน", en: "🌟 Mutual noble stars (천을귀인)", ko: "🌟 천을귀인 — 서로의 귀인" },
  nobleOne: { th: "🌟 천을귀인 — ดาวผู้อุปถัมภ์", en: "🌟 Noble star (천을귀인)", ko: "🌟 천을귀인 — 귀인 인연" },
  dohwaBoth: { th: "🌸 도화살 — เสน่ห์ชนเสน่ห์", en: "🌸 Peach-blossom charm (도화살)", ko: "🌸 도화살 — 매력과 매력의 만남" },
  dohwaOne: { th: "🌸 도화살 — ดาวเสน่ห์", en: "🌸 Peach-blossom charm (도화살)", ko: "🌸 도화살 — 치명적 매력" },
  hongyeom: { th: "🔥 홍염살 — เสน่หายั่วใจ", en: "🔥 Red-charm star (홍염살)", ko: "🔥 홍염살 — 달콤한 유혹" },
  hwagaeBoth: { th: "🎨 화개살 — จิตวิญญาณที่เข้าใจกัน", en: "🎨 Canopy star (화개살)", ko: "🎨 화개살 — 정신적 교감" },
  onui: { th: "🧸 ดวงพี่น้อง (오누이) — ข้อควรระวัง", en: "🧸 Sibling-like match (오누이)", ko: "🧸 오누이 궁합 — 주의 포인트" },
  myeonghap: { th: "🌟 명합 — คู่ที่มองเห็นได้", en: "🌟 Visible combos (명합)", ko: "🌟 명합 — 드러난 합" },
  branchHeAll: { th: "🔗 จุดเชื่อม 육합", en: "🔗 육합 connection points", ko: "🔗 육합 — 인연의 고리" },
  woohap: { th: "📐 우합 — มุมพิเศษ", en: "📐 Corner bond (우합)", ko: "📐 우합 — 모서리 인연" },
};

// Premium bodies keyed by the day-master relation.
const PREMIUM_COMPAT: Record<string, Record<string, LText>> = {
  same: {
    marriage: {
      th: "คู่ธาตุเดียวกันแต่งงานแล้วเหมือนได้เพื่อนร่วมทีมตลอดชีวิต จังหวะชีวิตใกล้กัน ตัดสินใจใหญ่ ๆ ไปทางเดียวกันง่าย",
      en: "Married, you're lifelong teammates — matching rhythms make the big decisions come easy.",
      ko: "같은 오행 부부는 평생 팀메이트 같아요 — 생활 리듬이 비슷해 큰 결정도 쉽게 한 방향으로 갑니다.",
    },
    conflict: {
      th: "จุดเสี่ยงคือ ‘เหมือนกันเกินไป’ — พอเหนื่อยพร้อมกันจะไม่มีใครประคองใคร หาสิ่งใหม่ทำด้วยกันเป็นระยะ",
      en: "The risk is being too alike — when you both burn out at once, no one carries the other. Keep finding new things to do together.",
      ko: "'너무 닮은 것'이 리스크예요 — 둘 다 지치면 서로 못 받쳐줘요. 함께할 새로운 것을 계속 찾으세요.",
    },
    longterm: {
      th: "ระยะยาวมั่นคงแบบเพื่อนคู่คิด ยิ่งอายุมากยิ่งสนิท เงื่อนไขเดียวคืออย่าลืมเติมความตื่นเต้นให้กันบ้าง",
      en: "Long-term, a steady best-friend marriage that grows closer with age — just keep feeding it fresh excitement.",
      ko: "오래될수록 절친 같은 단단한 결혼이 됩니다 — 신선한 설렘만 잊지 말고 채워주세요.",
    },
  },
  resource: {
    marriage: {
      th: "คู่แบบ ‘ผู้เติม-ผู้รับ’ (相生) แต่งงานแล้วฝ่ายหนึ่งจะเป็นกำลังใจหลักของอีกฝ่ายโดยธรรมชาติ บ้านจะเป็นที่พักใจจริง ๆ",
      en: "A giver-and-receiver pair (相生) — one of you naturally becomes the other's main source of strength; home becomes a true resting place.",
      ko: "채워주는 쪽과 받는 쪽(相生)의 짝 — 한쪽이 자연스레 상대의 큰 힘이 되고, 집이 진짜 쉼터가 됩니다. 결혼운이 특히 좋아요.",
    },
    conflict: {
      th: "ระวังสมดุลการให้-การรับเอียงไปข้างเดียวจนฝ่ายให้หมดแรง ต้องสลับบทบาทกันบ้าง",
      en: "Watch for one-sided giving until the giver runs dry — swap roles from time to time.",
      ko: "주고받음이 한쪽으로 기울어 주는 쪽이 지치지 않게 — 가끔 역할을 바꿔보세요.",
    },
    longterm: {
      th: "ยิ่งอยู่ด้วยกันนานยิ่งเข้าขา เพราะพลังงานไหลเวียนต่อกันเป็นวงจร คู่แบบนี้แก่ไปด้วยกันได้สวยมาก",
      en: "The longer together, the better attuned — your energies circulate in a loop. This pair grows old beautifully.",
      ko: "오래 함께할수록 합이 좋아지는 순환 구조 — 곱게 늙어가는 짝입니다.",
    },
  },
  output: {
    marriage: {
      th: "คู่ที่ฝ่ายหนึ่งจุดประกายความคิดสร้างสรรค์ของอีกฝ่าย ชีวิตแต่งงานจะไม่น่าเบื่อ เหมาะทำธุรกิจคู่",
      en: "One of you sparks the other's creativity — married life never gets boring; great pair for a couple business.",
      ko: "한쪽이 상대의 창의력을 깨우는 짝 — 결혼 생활이 지루할 틈이 없고 부부 사업에도 좋아요.",
    },
    conflict: {
      th: "พลังไหลออกทางเดียวนาน ๆ อาจทำให้ฝ่ายที่ถูกดึงพลังรู้สึกล้า ต้องมีเวลาชาร์จส่วนตัว และอย่าเอาไอเดียมาแข่งกันเอง",
      en: "Energy flowing one way too long tires the drained side — protect personal recharge time, and don't compete over ideas.",
      ko: "기운이 한쪽으로만 오래 흐르면 빨리는 쪽이 지쳐요 — 각자 충전 시간을 지키고, 아이디어로 경쟁하지 마세요.",
    },
    longterm: {
      th: "ระยะยาวโตไปด้วยกันแบบหุ้นส่วนชีวิต ทั้งเรื่องงานและความฝัน ขอแค่แบ่งบทให้ชัดว่าใครนำเรื่องไหน",
      en: "Long-term, you grow as true life partners — in work and in dreams. Just assign clearly who leads what.",
      ko: "일도 꿈도 함께 키우는 인생 파트너로 성장합니다 — 분야별 리더만 정해두세요.",
    },
  },
  wealth: {
    marriage: {
      th: "คู่แรงดึงดูดแบบ ‘ขั้วตรงข้ามที่ลงตัว’ ฝ่ายหนึ่งคุมจังหวะ อีกฝ่ายเปิดโอกาส เรื่องการเงินครอบครัวมักไปได้ดีถ้าวางกติกาแต่แรก",
      en: "Opposites that click — one sets the tempo, the other opens doors. Family finances thrive if you set ground rules early.",
      ko: "'맞물리는 정반대'의 짝 — 한쪽이 페이스를 잡고 한쪽이 기회를 열어요. 초반에 규칙만 정하면 집안 재정이 잘 굴러갑니다.",
    },
    conflict: {
      th: "แรงดึงดูดสูงมาพร้อมแรงเสียดทาน เรื่องเงินและอำนาจการตัดสินใจคือสนามหลัก ตกลงกันให้ชัดตั้งแต่ต้น",
      en: "Strong attraction comes with friction — money and decision power are the main arena; agree who owns what from the start.",
      ko: "강한 끌림엔 마찰이 따라와요 — 돈과 결정권이 주 전장이니 처음부터 담당을 정하세요.",
    },
    longterm: {
      th: "ถ้าผ่านการปรับจูน 2-3 ปีแรกไปได้ คู่แบบนี้จะแข็งแรงมาก เพราะต่างคนต่างเติมสิ่งที่อีกฝ่ายไม่มี",
      en: "Survive the first 2–3 years of tuning and this pair becomes very strong — each fills what the other lacks.",
      ko: "처음 2~3년의 조율만 넘기면 서로의 빈 곳을 채우는 아주 단단한 짝이 됩니다.",
    },
  },
  officer: {
    marriage: {
      th: "คู่ที่อีกฝ่ายทำให้คุณอยากเป็นคนที่ดีขึ้น มีวินัยขึ้น ชีวิตแต่งงานมีโครงสร้างชัดเจน เหมาะกับคนที่อยากสร้างครอบครัวแบบจริงจัง",
      en: "A partner who makes you want to be better — married life has real structure; ideal for serious family-builders.",
      ko: "나를 더 나은 사람이 되고 싶게 만드는 상대 — 구조가 잡힌 결혼 생활, 진지한 가정을 꿈꾸는 사람에게 최적.",
    },
    conflict: {
      th: "ระวังความรู้สึก ‘ถูกควบคุม’ สะสมโดยไม่พูด ฝ่ายที่ถูกกดต้องกล้าบอกขอบเขต และฝ่ายที่นำต้องฟังมากกว่าสั่ง",
      en: "Beware the silent buildup of feeling controlled — the led must voice boundaries, and the leader must listen more than direct.",
      ko: "'통제당한다'는 느낌이 말없이 쌓이지 않게 — 눌리는 쪽은 경계를 말하고, 이끄는 쪽은 지시보다 경청을.",
    },
    longterm: {
      th: "ระยะยาวจะกลายเป็นคู่ที่คนรอบข้างนับถือ ขอแค่เปลี่ยนการควบคุมเป็นการดูแล ความเกรงใจเป็นความเข้าใจ",
      en: "Long-term you become a couple others respect — just turn control into care, and courtesy into understanding.",
      ko: "주변이 존경하는 부부가 됩니다 — 통제를 보살핌으로, 어려움을 이해로 바꾸면 됩니다.",
    },
  },
};

function branchPair(a: string, b: string): "he" | "chong" | "sanhe" | "same" | "none" {
  if (a === b) return "same";
  if (LIU_HE.has(a + b) || LIU_HE.has(b + a)) return "he";
  if (LIU_CHONG.has(a + b) || LIU_CHONG.has(b + a)) return "chong";
  if (SAN_HE.some((g) => g.includes(a) && g.includes(b))) return "sanhe";
  return "none";
}

const CAP = Number(process.env.COMPAT_CAP ?? 95);
function clamp(n: number): number {
  // Cap at 95 — even destined pairs keep a little mystery, and a believable
  // top score reads as more trustworthy than a perfect 100. Floor at 25 —
  // paying customers shouldn't see a single-digit verdict.
  return Math.max(25, Math.min(CAP, Math.round(n)));
}

// Perceptual remap of the clamped raw score. Practitioner preference: mid
// matches should read one tier warmer — a raw 50-something → 60s, a raw
// 60-something → 70s — while the top stays compressed near the 95 cap so
// 천생연분 remains rare and the anchor couple holds ~93-94. Piecewise-linear
// through these (raw → shown) anchor points, monotonic throughout.
const REMAP_POINTS: Array<[number, number]> = [
  [25, 25], [40, 48], [50, 60], [60, 70], [70, 76], [80, 84], [90, 92], [95, 95],
];
function remapScore(s: number): number {
  if (s <= REMAP_POINTS[0][0]) return REMAP_POINTS[0][1];
  const last = REMAP_POINTS[REMAP_POINTS.length - 1];
  if (s >= last[0]) return last[1];
  for (let i = 1; i < REMAP_POINTS.length; i++) {
    const [x0, y0] = REMAP_POINTS[i - 1];
    const [x1, y1] = REMAP_POINTS[i];
    if (s <= x1) return Math.round(y0 + ((s - x0) / (x1 - x0)) * (y1 - y0));
  }
  return s;
}

export function computeCompatibility(
  a: SajuChart,
  b: SajuChart,
  lang: Lang = "th",
  relationship: string = "lovers",
  genders?: { a?: string; b?: string } // "F" | "M" — drives 배우자성 signals
): Compatibility {
  const romantic = ROMANTIC.has(relationship);
  // Base for an "unremarkable" couple. The signal weights below are sized so
  // the median random couple lands in the honest 무난 band (~60), a strong
  // multi-signal pair reaches 천생연분 (85+) only rarely, and no single signal
  // alone can peg the ceiling — the score is meant to be believable, not
  // flattering.
  let score = 29;
  const notes: Array<{ k: string; text: string }> = [];

  // 1. Day master element relation.
  const rel = relationTo(a.dayMasterElement, b.dayMasterElement);
  const relBack = relationTo(b.dayMasterElement, a.dayMasterElement);
  if (rel === "resource" || relBack === "resource") {
    score += 12;
    notes.push({ k: "dmResource", text: NOTES.dmResource[lang] });
  } else if (rel === "same") {
    // 비견 — great as friends/colleagues, contentious as spouses.
    if (romantic) {
      score -= 4;
      notes.push({ k: "dmSameRomantic", text: NOTES.dmSameRomantic[lang] });
    } else {
      score += 8;
      notes.push({ k: "dmSame", text: NOTES.dmSame[lang] });
    }
  } else if (rel === "wealth" || rel === "officer") {
    const pairSet = [a.dayMasterElement, b.dayMasterElement].sort().join("-");
    if (pairSet === "earth-water") {
      // 토×수 — 재성/관성 중에서도 특히 좋은 짝 (제방과 물의 상)
      score += 11;
      notes.push({ k: "earthWater", text: NOTES.earthWater[lang] });
    } else {
      // 상극(재성·관성) — 여자의 관성=남편, 남자의 재성=아내. 부부 궁합의
      // 핵심 축이므로 상생 못지않게 비중을 준다.
      score += 9;
      notes.push({ k: "dmOpposite", text: NOTES.dmOpposite[lang] });
    }
  }

  // 2. Day-branch (spouse palace) relation.
  let dayChong: { x: string; y: string } | null = null;
  const bp = branchPair(a.day.zhi, b.day.zhi);
  if (bp === "he") {
    score += 15;
    notes.push({ k: "branchHe", text: NOTES.branchHe[lang] });
  } else if (bp === "sanhe") {
    score += 11;
    notes.push({ k: "branchSanhe", text: NOTES.branchSanhe[lang] });
  } else if (bp === "same") {
    score += 6;
    notes.push({ k: "branchSame", text: NOTES.branchSame[lang] });
  } else if (bp === "chong") {
    score -= 14;
    notes.push({ k: "branchChong", text: NOTES.branchChong[lang] });
  } else {
    score += 5;
  }
  // Record the spouse-palace pairing for the report AI (육합 is captured by
  // the 육합 sweep below; 삼합 by the 삼합 sweep).
  if (bp === "chong") dayChong = { x: a.day.zhi, y: b.day.zhi };

  // 3. 용신 complement — does each supply the other's favorable element?
  const sa = analyzeStrength(a, lang);
  const sb = analyzeStrength(b, lang);
  const aHelpsB = sb.favorable.includes(a.dayMasterElement);
  const bHelpsA = sa.favorable.includes(b.dayMasterElement);
  if (aHelpsB && bHelpsA) {
    score += 9;
    notes.push({ k: "yongBoth", text: NOTES.yongBoth[lang] });
  } else if (aHelpsB || bHelpsA) {
    score += 5;
    notes.push({ k: "yongOne", text: NOTES.yongOne[lang] });
  }

  // 4. 조후 상보 — one cold chart (water excess / winter-born) warmed by a
  // fire-carrying partner, or a hot chart cooled by a watery one.
  const coldA = a.elementCounts.water >= 3 || WINTER.has(a.month.zhi);
  const coldB = b.elementCounts.water >= 3 || WINTER.has(b.month.zhi);
  const warmA = a.elementCounts.fire >= 2 || a.dayMasterElement === "fire";
  const warmB = b.elementCounts.fire >= 2 || b.dayMasterElement === "fire";
  const hotA = a.elementCounts.fire >= 3 || SUMMER.has(a.month.zhi);
  const hotB = b.elementCounts.fire >= 3 || SUMMER.has(b.month.zhi);
  const wetA = a.elementCounts.water >= 2 || a.dayMasterElement === "water";
  const wetB = b.elementCounts.water >= 2 || b.dayMasterElement === "water";
  if ((coldA && warmB) || (coldB && warmA) || (hotA && wetB) || (hotB && wetA)) {
    score += 6;
    notes.push({ k: "climate", text: NOTES.climate[lang] });
  }

  // 5. 과다 제어 — climate-critical excess (flooding water / raging fire)
  // held by the partner's controller: 토극수 (earth banks water) or
  // 수극화 (water cools fire). Restricted to water/fire so it stays special.
  const excessControlled = (x: SajuChart, y: SajuChart, el: "water" | "fire"): boolean =>
    x.elementCounts[el] >= 3 &&
    (y.elementCounts as Record<string, number>)[CONTROLLER[el]] >= 2;
  if (excessControlled(a, b, "water") || excessControlled(b, a, "water")) {
    // 토극수 — the dam-and-water pairing, extra favorable.
    score += 7;
    notes.push({ k: "control", text: NOTES.control[lang] });
  } else if (excessControlled(a, b, "fire") || excessControlled(b, a, "fire")) {
    score += 5;
    notes.push({ k: "control", text: NOTES.control[lang] });
  }

  // 6. 상생 자리 — distinct element pairs where one partner's present element
  // generates an element the other actually has. More feeding lanes = better.
  const present = (c: SajuChart): string[] =>
    (Object.entries(c.elementCounts) as Array<[string, number]>)
      .filter(([, n]) => n > 0)
      .map(([el]) => el);
  const feedLanes = (from: SajuChart, to: SajuChart): number =>
    present(from).filter((el) => present(to).includes(GENERATES[el])).length;
  const lanes = Math.max(feedLanes(a, b), feedLanes(b, a));
  if (lanes >= 4) {
    score += Math.min(4, lanes - 2);
    notes.push({ k: "feed", text: NOTES.feed[lang] });
  }

  // Position rule for ALL cross-chart combinations (합·암합·명합): a pair only
  // counts when the two characters sit in the SAME pillar position (년-년,
  // 월-월, 일-일, 시-시) or in ADJACENT positions (년-월, 월-일, 일-시).
  // Distant pairs (년지-시지 등) are not real combinations.
  // Position order: 0=year, 1=month, 2=day, 3=hour.
  const nearPos = (i: number, j: number): boolean => Math.abs(i - j) <= 1;
  // Factual record of every combination found (fed verbatim to the report AI).
  const POS_ZHI = ["년지", "월지", "일지", "시지"];
  const POS_GAN = ["년간", "월간", "일간", "시간"];
  const combos: string[] = [];
  const comboAt = (i: number, j: number, x: string, y: string, kind: string, zhi = true) => {
    const P = zhi ? POS_ZHI : POS_GAN;
    combos.push(`{A}의 ${P[i]} ${x} ↔ {B}의 ${P[j]} ${y} — ${kind}`);
  };
  if (dayChong) comboAt(2, 2, dayChong.x, dayChong.y, "충(沖)");

  // 7. 암합 — hidden combinations across the two charts' branches.
  const branchesOf = (c: SajuChart): string[] => [
    c.year.zhi,
    c.month.zhi,
    c.day.zhi,
    ...(c.hour ? [c.hour.zhi] : []),
  ];
  const bA = branchesOf(a);
  const bB = branchesOf(b);
  const amhapFound = new Map<string, number>(); // canonical pair → combo count
  let hiddenJeongim = false;
  for (let i = 0; i < bA.length; i++)
    for (let j = 0; j < bB.length; j++) {
      if (!nearPos(i, j)) continue;
      const n = AMHAP_COMBOS[bA[i] + bB[j]];
      if (n) {
        amhapFound.set([bA[i], bB[j]].sort().join(""), n);
        comboAt(i, j, bA[i], bB[j], "암합(暗合)");
        if (AMHAP_JEONGIM.has(bA[i] + bB[j])) hiddenJeongim = true;
      }
    }
  const amhapSum = [...amhapFound.values()].reduce((x, y) => x + y, 0);
  if (amhapSum > 0) {
    score += Math.min(6, amhapSum);
    notes.push({ k: "amhap", text: NOTES.amhap[lang] });
  }

  // 명합 — VISIBLE stem combinations (천간합) across the two charts.
  const stemsOf = (c: SajuChart): string[] => [
    c.year.gan, c.month.gan, c.day.gan, ...(c.hour ? [c.hour.gan] : []),
  ];
  const sA = stemsOf(a);
  const sB = stemsOf(b);
  const STEM_HE_PAIRS = new Set(["甲己", "己甲", "乙庚", "庚乙", "丙辛", "辛丙", "丁壬", "壬丁", "戊癸", "癸戊"]);
  const myeongStem = new Set<string>();
  for (let i = 0; i < sA.length; i++)
    for (let j = 0; j < sB.length; j++)
      if (nearPos(i, j) && STEM_HE_PAIRS.has(sA[i] + sB[j])) {
        myeongStem.add([sA[i], sB[j]].sort().join(""));
        comboAt(i, j, sA[i], sB[j], "천간합(명합)", false);
      }
  if (myeongStem.size > 0) {
    score += Math.min(4, myeongStem.size * 2);
    notes.push({ k: "myeonghap", text: NOTES.myeonghap[lang] });
  }

  // 육합 — visible branch harmony across positions (beyond day-day).
  const branchHe = new Set<string>();
  for (let i = 0; i < bA.length; i++)
    for (let j = 0; j < bB.length; j++)
      if (nearPos(i, j) && (LIU_HE.has(bA[i] + bB[j]) || LIU_HE.has(bB[j] + bA[i]))) {
        branchHe.add([bA[i], bB[j]].sort().join(""));
        comboAt(i, j, bA[i], bB[j], "육합(六合)");
      }
  branchHe.delete([a.day.zhi, b.day.zhi].sort().join("")); // day-day already scored
  if (branchHe.size > 0) {
    score += Math.min(3, branchHe.size * 2);
    notes.push({ k: "branchHeAll", text: NOTES.branchHeAll[lang] });
  }

  // 8. 우합/모서리합 — corner pairs across the two charts' branches.
  let woohapFound = false;
  for (let i = 0; i < bA.length; i++)
    for (let j = 0; j < bB.length; j++)
      if (nearPos(i, j) && (WOOHAP.has(bA[i] + bB[j]) || WOOHAP.has(bB[j] + bA[i]))) {
        if (!woohapFound) comboAt(i, j, bA[i], bB[j], "우합(隅合)");
        woohapFound = true;
      }
  if (woohapFound) {
    score += 3;
    notes.push({ k: "woohap", text: NOTES.woohap[lang] });
  }

  // 8b. 삼합 lanes across the charts (same/adjacent positions, beyond the
  // day-day pairing already scored) — e.g. 내 시지와 상대 일지가 같은 삼합국.
  let sanheCross = false;
  for (let i = 0; i < bA.length; i++)
    for (let j = 0; j < bB.length; j++) {
      if (!nearPos(i, j) || (i === 2 && j === 2)) continue;
      if (bA[i] !== bB[j] && SAN_HE.some((g) => g.includes(bA[i]) && g.includes(bB[j]))) {
        if (!sanheCross) comboAt(i, j, bA[i], bB[j], "삼합(三合) 기운");
        sanheCross = true;
      }
    }
  if (sanheCross) score += 1;

  // 9. 오누이 궁합 — same month branch (월지) reads sibling-like: cozy but
  // low on romantic spark. Docked hard (-30, per classical practice).
  if (a.month.zhi === b.month.zhi) {
    score -= 19;
    notes.push({ k: "onui", text: NOTES.onui[lang] });
  }

  // 10. 배우자성 (spouse stars) — gendered: the element controlling the
  // woman's day master is her 관성(남편성); the element the man's day master
  // controls is his 재성(아내성). When the partner IS or CARRIES that star,
  // romantic pull follows.
  const rawElemCount = (c: SajuChart, el: string): number => {
    const els = [
      c.year.ganElement, c.year.zhiElement,
      c.month.ganElement, c.month.zhiElement,
      c.dayMasterElement, c.day.zhiElement,
      ...(c.hour ? [c.hour.ganElement, c.hour.zhiElement] : []),
    ];
    return els.filter((x) => x === el).length;
  };
  if (romantic && genders) {
    const f = genders.a === "F" ? a : genders.b === "F" ? b : null;
    const m = genders.a === "M" ? a : genders.b === "M" ? b : null;
    if (f && m && f !== m) {
      // Day-master level: 남극녀 — his element controls hers, making him her
      // 관성 and her his 재성 simultaneously (the classic 배필 structure).
      if (m.dayMasterElement === CONTROLLER[f.dayMasterElement]) {
        const jeong = STEM_YANG.has(m.dayMaster) !== STEM_YANG.has(f.dayMaster);
        score += jeong ? 10 : 7;
        notes.push(
          jeong
            ? { k: "spouseStarJeong", text: NOTES.spouseStarJeong[lang] }
            : { k: "spouseStarPyeon", text: NOTES.spouseStarPyeon[lang] }
        );
      }
      // Abundance: her officer element filling his chart / his wealth element
      // filling hers.
      const officerInHim = rawElemCount(m, CONTROLLER[f.dayMasterElement]);
      const wealthInHer = rawElemCount(f, CONTROLS[m.dayMasterElement]);
      if (officerInHim >= 2) {
        score += officerInHim >= 3 ? 5 : 3;
        notes.push({ k: "officerPull", text: NOTES.officerPull[lang] });
      }
      if (wealthInHer >= 2) {
        score += wealthInHer >= 3 ? 5 : 3;
        notes.push({ k: "wealthPull", text: NOTES.wealthPull[lang] });
      }
    }
  }

  // 11. 천을귀인 — the partner's branches carry MY noble star → the partner
  // becomes my benefactor (and treats me with care).
  const nobleAinB = (CHEONEUL[a.dayMaster] ?? []).some((z) => bB.includes(z));
  const nobleBinA = (CHEONEUL[b.dayMaster] ?? []).some((z) => bA.includes(z));
  if (nobleAinB && nobleBinA) {
    score += 6;
    notes.push({ k: "nobleBoth", text: NOTES.nobleBoth[lang] });
  } else if (nobleAinB || nobleBinA) {
    score += 4;
    notes.push({ k: "nobleOne", text: NOTES.nobleOne[lang] });
  }

  // 12. 신살 — 도화(charm)·홍염(sweet allure)·화개(spiritual rapport).
  const sinA = findSinsal(a);
  const sinB = findSinsal(b);
  const dohwaA = sinA.includes("dohwa");
  const dohwaB = sinB.includes("dohwa");
  const hongyeomAny = sinA.includes("hongyeom") || sinB.includes("hongyeom");
  if (romantic && dohwaA && dohwaB) {
    score += 3;
    notes.push({ k: "dohwaBoth", text: NOTES.dohwaBoth[lang] });
  } else if (romantic && (dohwaA || dohwaB)) {
    notes.push({ k: "dohwaOne", text: NOTES.dohwaOne[lang] });
  }
  if (romantic && hongyeomAny) {
    score += 2;
    notes.push({ k: "hongyeom", text: NOTES.hongyeom[lang] });
  }
  if (sinA.includes("hwagae") && sinB.includes("hwagae")) {
    score += 2;
    notes.push({ k: "hwagaeBoth", text: NOTES.hwagaeBoth[lang] });
  }

  // ── 속궁합 (intimate chemistry) subscore ──────────────────────────────
  let intimate = 50;
  const intimateReasons: string[] = [];

  // Day/hour pillar clash across the two charts → physical spark UP.
  const dhA = [a.day.zhi, ...(a.hour ? [a.hour.zhi] : [])];
  const dhB = [b.day.zhi, ...(b.hour ? [b.hour.zhi] : [])];
  const crossChong = dhA.some((x) =>
    dhB.some((y) => LIU_CHONG.has(x + y) || LIU_CHONG.has(y + x))
  );
  if (crossChong) {
    intimate += 15;
    intimateReasons.push(INTIMATE_TEXT.chong[lang]);
  }

  // 암합 abundance → secret chemistry (weighted by hidden-combo count).
  if (amhapSum > 0) {
    intimate += Math.min(12, amhapSum * 2);
    intimateReasons.push(INTIMATE_TEXT.amhap[lang]);
  }

  // 정임합 (丁壬) across the charts — the classic irresistible-attraction pair.
  // Same position-adjacency rule: 丁 and 壬 must sit in the same or an
  // adjacent pillar to actually combine.
  const jeongimNear = (xs: string[], ys: string[]): boolean =>
    xs.some(
      (x, i) => x === "丁" && ys.some((y, j) => y === "壬" && nearPos(i, j))
    );
  const visibleJeongim = jeongimNear(sA, sB) || jeongimNear(sB, sA);
  if (visibleJeongim) {
    intimate += 15;
    intimateReasons.push(INTIMATE_TEXT.jeongim[lang]);
  } else if (hiddenJeongim) {
    // 자오충 등 지장간 속 丁壬 — 드러난 정임보다는 약하게
    intimate += 8;
    intimateReasons.push(INTIMATE_TEXT.jeongim[lang]);
  }

  // 일지/년지 합이 水로 화하는 경우 (巳申합수, 申子辰 수국) → intimacy UP.
  // Same-position pairs only (일지↔일지, 년지↔년지) — distant pairs don't combine.
  const WATER_TRINE = ["申", "子", "辰"];
  const waterPair = (x: string, y: string): boolean =>
    x + y === "巳申" ||
    y + x === "巳申" ||
    (WATER_TRINE.includes(x) && WATER_TRINE.includes(y) && x !== y);
  const waterCombo =
    waterPair(a.day.zhi, b.day.zhi) || waterPair(a.year.zhi, b.year.zhi);
  if (waterCombo) {
    intimate += 12;
    intimateReasons.push(INTIMATE_TEXT.water[lang]);
  }

  // 오누이/비견 dampen physical spark too.
  if (a.month.zhi === b.month.zhi) {
    intimate -= 15;
    intimateReasons.push(INTIMATE_TEXT.onui[lang]);
  }
  if (romantic && rel === "same") {
    intimate -= 8;
    intimateReasons.push(INTIMATE_TEXT.bikyeon[lang]);
  }

  const s = remapScore(clamp(score));

  // Soft-link to the overall score (25%) so intimate can't float far above a
  // poor overall match — while clash-driven "spicy" pairs keep their edge.
  // Uses the shown score so 속궁합 tracks the same warmth as the headline.
  intimate = Math.round(0.25 * s + 0.75 * intimate);
  intimate = Math.max(20, Math.min(99, intimate));

  const intimateBody =
    INTIMATE_TEXT.intro[lang](intimate) +
    " " +
    (intimateReasons.length ? intimateReasons.join(" ") : INTIMATE_TEXT.base[lang]);
  const bandDef = BANDS.find((x) => s >= x.min)!;
  const bandLabel = romantic
    ? bandDef.band[lang]
    : PLATONIC_BANDS.find((x) => s >= x.min)!.band[lang];

  // The whole written analysis sits behind one 89 THB unlock — only the
  // score/band/headline are free teasers. Note bodies are real text (blurred
  // until paid); premium bodies stay placeholder until unlockCompat().
  // Friends / coworkers get a partnership reading — no 속궁합, no marriage.
  const premiumTitles: Array<[string, string]> = romantic
    ? PREMIUM_TITLES[lang]
    : [
        ["bond", BOND_TITLE[lang]],
        ...PREMIUM_TITLES[lang].filter(([k]) => k !== "marriage"),
      ];

  const sections: CompatSection[] = [
    { key: "overview", title: "", body: bandDef.headline[lang], locked: false },
    ...notes.map((n, i) => ({
      key: `note${i + 1}`,
      title: NOTE_CAT[n.k]?.[lang] ?? NOTE_TITLE[lang](i + 1),
      body: n.text,
      locked: true,
    })),
    // 속궁합 detail — romantic relationships only.
    ...(romantic
      ? [{ key: "intimate", title: INTIMATE_TITLE[lang], body: intimateBody, locked: true }]
      : []),
    ...premiumTitles.map(([key, title]) => ({
      key,
      title,
      body: LOCKED_BODY[lang],
      locked: true,
    })),
  ];

  return {
    score: s,
    intimate: romantic ? intimate : undefined,
    bandTh: bandLabel,
    headline: bandDef.headline[lang],
    rel,
    relationship,
    lang,
    sections,
    combos,
  };
}

// Platonic (friends/coworkers/other) partnership reading keyed by relation.
const PREMIUM_BOND: Record<string, LText> = {
  same: {
    th: "ในฐานะเพื่อน/เพื่อนร่วมงาน จังหวะของคุณสองคนตรงกันมาก ทำงานด้วยกันลื่นไหล แต่ถ้าบทบาททับกันจะกลายเป็นแข่งกันเอง แบ่งหน้าที่ให้ชัด",
    en: "As friends or colleagues your rhythms match perfectly — collaboration flows. But overlapping roles turn into rivalry; divide responsibilities clearly.",
    ko: "친구·동료로서 최고의 티키타카 — 리듬이 같아 협업이 수월해요. 다만 역할이 겹치면 경쟁이 되니 분담을 명확히 하세요.",
  },
  resource: {
    th: "โครงสร้างแบบ ‘ผู้หนุน-ผู้เติบโต’ เหมือนพี่เลี้ยงกับศิษย์ ต่างช่วยกันโตขึ้นเรื่อย ๆ",
    en: "A backer-and-grower structure — like mentor and mentee, you keep raising each other up.",
    ko: "한쪽이 밀어주고 한쪽이 크는 구조 — 멘토와 멘티처럼 서로를 성장시키는 관계입니다.",
  },
  output: {
    th: "คู่ไอเดียกระเด้งใส่กัน ทำโปรเจกต์ด้วยกันแล้ว 1+1 กลายเป็น 3",
    en: "Ideas bounce between you — on a shared project, one plus one becomes three.",
    ko: "아이디어가 오가는 시너지 조합 — 함께 프로젝트를 하면 1+1이 3이 됩니다.",
  },
  wealth: {
    th: "พาร์ตเนอร์สายเติมเต็ม ต่างมีสิ่งที่อีกฝ่ายขาด เรื่องเงินระหว่างกันให้เคลียร์ชัดตั้งแต่แรก",
    en: "Practical partners who each supply what the other lacks — just keep money matters between you crystal clear from day one.",
    ko: "서로 없는 것을 채워주는 실속 파트너 — 다만 금전 거래만은 처음부터 깔끔하게 하세요.",
  },
  officer: {
    th: "ความสัมพันธ์ที่มีแรงตึงพอดี ผลักให้ต่างฝ่ายพัฒนา แต่ระวังอย่าให้กลายเป็นบนล่าง คุยกันแบบเท่ากันไว้",
    en: "A relationship with productive tension that pushes you both to grow — keep it level, not hierarchical.",
    ko: "긴장감이 서로를 성장시키는 관계 — 상하관계처럼 굳지 않게 수평으로 소통하세요.",
  },
};

const ROMANTIC = new Set(["lovers", "married", "talking"]);
const BOND_TITLE: Record<Lang, string> = {
  th: "ความร่วมมือและความไว้ใจ",
  en: "Partnership & Trust",
  ko: "파트너십·신뢰운",
};

/** Reveal the full compat analysis after payment (notes + premium bodies). */
export function unlockCompat(
  sections: CompatSection[],
  rel: string,
  lang: Lang = "th"
): CompatSection[] {
  const bodies = PREMIUM_COMPAT[rel] ?? PREMIUM_COMPAT.same;
  const bond = PREMIUM_BOND[rel] ?? PREMIUM_BOND.same;
  return sections.map((s) => {
    if (!s.locked) return s;
    if (s.key === "bond") return { ...s, body: bond[lang], locked: false };
    if (bodies[s.key]) return { ...s, body: bodies[s.key][lang], locked: false };
    return { ...s, locked: false }; // notes — real body, just blurred until paid
  });
}
