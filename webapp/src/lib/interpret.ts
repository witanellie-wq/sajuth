// Interpretation engine.
//
// Turns a SajuChart into report sections in the requested language (th/en).
// This is the cheap, deterministic template layer (cost 0, instant). In
// production the final prose can be passed through Claude for extra polish
// (see rewrite.ts) — these templates are the seed + the offline fallback.

import type { SajuChart, Element } from "./saju";
import { analyzeStrength } from "./strength";
import { todayFortune, TODAY_PREFIX } from "./today";
import type { Lang } from "./i18n";

export interface ReportSection {
  key: string;
  title: string;
  body: string;
  locked: boolean; // true → shown blurred behind the paywall
}

type LText = Record<Lang, string>;

const ELEMENT_NAME: Record<Lang, Record<Element, string>> = {
  th: {
    wood: "ไม้ (木)", fire: "ไฟ (火)", earth: "ดิน (土)",
    metal: "ทอง (金)", water: "น้ำ (水)",
  },
  en: {
    wood: "Wood (木)", fire: "Fire (火)", earth: "Earth (土)",
    metal: "Metal (金)", water: "Water (水)",
  },
  ko: {
    wood: "목(木)", fire: "화(火)", earth: "토(土)",
    metal: "금(金)", water: "수(水)",
  },
};

// Day Master (일간) → core personality. Keyed by the 10 heavenly stems.
const DAY_MASTER: Record<string, LText> = {
  "甲": {
    th: "คุณคือ ‘ต้นไม้ใหญ่’ — ตรงไปตรงมา มีหลักการ และเป็นที่พึ่งของคนรอบข้าง คุณเติบโตขึ้นเรื่อย ๆ และไม่ชอบยอมแพ้ แต่บางครั้งดื้อรั้นเกินไปจนไม่ยอมโอนอ่อน",
    en: "You are the Great Tree — upright, principled, someone others lean on. You keep growing and hate giving up, though at times you're too stubborn to bend.",
    ko: "당신은 '큰 나무'예요 — 곧고 원칙 있으며 주변의 든든한 버팀목이죠. 꾸준히 성장하고 지는 걸 싫어하지만, 가끔은 고집이 세서 굽히지 못할 때가 있어요.",
  },
  "乙": {
    th: "คุณคือ ‘ไม้เลื้อย’ — ยืดหยุ่น ปรับตัวเก่ง และอ่อนโยน คุณอยู่รอดได้ในทุกสภาพแวดล้อมด้วยความนุ่มนวล แต่ควรระวังการเกรงใจคนอื่นจนลืมความต้องการของตัวเอง",
    en: "You are the Vine — flexible, adaptive, and gentle. You thrive in any environment through softness, but be careful not to please others until you forget your own needs.",
    ko: "당신은 '덩굴'이에요 — 유연하고 적응력 좋고 부드럽죠. 어떤 환경에서도 살아남지만, 남을 배려하다 내 마음을 잊지 않도록 조심해요.",
  },
  "丙": {
    th: "คุณคือ ‘ดวงอาทิตย์’ — สดใส อบอุ่น และเป็นศูนย์กลางที่ดึงดูดผู้คน คุณให้พลังกับคนรอบตัวได้เสมอ แต่พออารมณ์ขึ้นก็ร้อนแรงและเปิดเผยเกินไป",
    en: "You are the Sun — bright, warm, a natural center of attention. You energize everyone around you, but when emotions flare you can burn hot and show too much.",
    ko: "당신은 '태양'이에요 — 밝고 따뜻해서 자연스럽게 사람들의 중심이 되죠. 주변에 에너지를 나눠주지만, 감정이 오르면 뜨겁고 너무 다 드러나요.",
  },
  "丁": {
    th: "คุณคือ ‘เปลวเทียน’ — ละเอียดอ่อน มีเสน่ห์เงียบ ๆ และใส่ใจรายละเอียด คุณอบอุ่นกับคนที่ไว้ใจ แต่คิดมากและอ่อนไหวกับคำพูดของคนอื่น",
    en: "You are the Candle Flame — delicate, quietly charming, detail-minded. You're warm with those you trust, but you overthink and words affect you deeply.",
    ko: "당신은 '촛불'이에요 — 섬세하고 조용한 매력에 디테일을 챙기죠. 믿는 사람에겐 따뜻하지만 생각이 많고 말에 쉽게 상처받아요.",
  },
  "戊": {
    th: "คุณคือ ‘ภูเขา’ — หนักแน่น มั่นคง และน่าเชื่อถือ คุณเป็นหลักให้คนอื่นพิงได้ แต่เปลี่ยนแปลงช้าและเก็บความรู้สึกไว้คนเดียวบ่อย ๆ",
    en: "You are the Mountain — steady, solid, dependable. Others lean on you, but you change slowly and often keep your feelings to yourself.",
    ko: "당신은 '산'이에요 — 묵직하고 든든해 기댈 수 있는 사람이죠. 다만 변화가 느리고 감정을 혼자 삭이는 편이에요.",
  },
  "己": {
    th: "คุณคือ ‘ผืนดินเพาะปลูก’ — โอบอ้อม ดูแลคนเก่ง และประนีประนอม คุณทำให้ทุกอย่างเติบโตได้ แต่ระวังการแบกภาระคนอื่นไว้จนเหนื่อยเอง",
    en: "You are the Fertile Soil — nurturing, caring, diplomatic. You make everything grow, but watch out for carrying everyone's burdens until you exhaust yourself.",
    ko: "당신은 '기름진 밭'이에요 — 포용력 있고 돌봄에 능하며 중재를 잘하죠. 모두를 자라게 하지만 남의 짐까지 지다 지치지 않게 조심해요.",
  },
  "庚": {
    th: "คุณคือ ‘เหล็กกล้า’ — เด็ดขาด ยุติธรรม และลงมือจริง คุณกล้าตัดสินใจในเรื่องที่คนอื่นลังเล แต่บางครั้งตรงจนดูแข็งกระด้าง",
    en: "You are Forged Steel — decisive, fair, action-first. You make the calls others hesitate on, though your directness can come across as blunt.",
    ko: "당신은 '강철'이에요 — 결단력 있고 공정하며 실행이 빠르죠. 남들이 망설일 때 결정을 내리지만, 직설이 차갑게 보일 때가 있어요.",
  },
  "辛": {
    th: "คุณคือ ‘อัญมณี’ — ประณีต มีรสนิยม และภูมิใจในตัวเอง คุณโดดเด่นด้วยคุณภาพ ไม่ใช่เสียงดัง แต่ไวต่อคำวิจารณ์และเก็บมาคิด",
    en: "You are the Jewel — refined, tasteful, quietly proud. You stand out through quality, not volume, but criticism cuts deep and stays with you.",
    ko: "당신은 '보석'이에요 — 세련되고 취향이 확실하며 자부심이 있죠. 소리 없이 퀄리티로 빛나지만 비판에 예민하고 오래 마음에 담아둬요.",
  },
  "壬": {
    th: "คุณคือ ‘มหาสมุทร’ — คิดกว้าง อิสระ และฉลาดปรับตัว คุณมองภาพใหญ่ได้ดีและเข้ากับคนหลากหลาย แต่บางครั้งใจลอยและเบื่อง่าย",
    en: "You are the Ocean — broad-minded, free, cleverly adaptive. You see the big picture and get along with all kinds of people, but you drift and bore easily.",
    ko: "당신은 '바다'예요 — 시야가 넓고 자유로우며 영리하게 적응하죠. 큰 그림을 잘 보지만 쉽게 싫증 내고 마음이 떠다닐 때가 있어요.",
  },
  "癸": {
    th: "คุณคือ ‘สายฝน’ — อ่อนโยน ลึกซึ้ง และมีสัญชาตญาณดี คุณเข้าใจความรู้สึกคนอื่นไว แต่คิดเยอะและเก็บอารมณ์ไว้ข้างใน",
    en: "You are the Gentle Rain — soft, deep, intuitive. You read others' feelings instantly, but you overthink and keep emotions inside.",
    ko: "당신은 '단비'예요 — 부드럽고 깊으며 직감이 좋죠. 남의 마음을 빨리 읽지만 생각이 많고 감정을 안으로 삼켜요.",
  },
};

const TITLES: Record<Lang, Record<string, string>> = {
  th: {
    personality: "นิสัยพื้นฐานของคุณ",
    elements: "สมดุลธาตุทั้งห้า (โอแฮง)",
    love: "ความรักและเนื้อคู่",
    career: "การงานและเส้นทางอาชีพที่ใช่",
    wealth: "โชคลาภและการเงิน",
    luck10: "ดวงชะตา 10 ปีข้างหน้า (แดวอน)",
    lockedBody: "ปลดล็อกเพื่ออ่านผลวิเคราะห์แบบละเอียดของหมวดนี้",
  },
  en: {
    personality: "Your Core Personality",
    elements: "Five-Element Balance (Ohaeng)",
    love: "Love & Soulmate",
    career: "Career Path That Fits You",
    wealth: "Wealth & Money Luck",
    luck10: "The Next 10 Years (Daeun)",
    lockedBody: "Unlock to read the full analysis of this section",
  },
  ko: {
    personality: "타고난 성격",
    elements: "오행 밸런스 (오행)",
    love: "연애·인연운",
    career: "나에게 맞는 직업운",
    wealth: "재물운",
    luck10: "앞으로 10년 대운 (대운)",
    lockedBody: "잠금을 해제하면 이 항목의 상세 풀이를 볼 수 있어요",
  },
};

function dominantElement(counts: Record<Element, number>): Element {
  return (Object.keys(counts) as Element[]).reduce((a, b) =>
    counts[b] > counts[a] ? b : a
  );
}

function missingElements(counts: Record<Element, number>): Element[] {
  return (Object.keys(counts) as Element[]).filter((e) => counts[e] === 0);
}

export function interpret(chart: SajuChart, lang: Lang = "th"): ReportSection[] {
  const t = TITLES[lang];
  const elName = ELEMENT_NAME[lang];
  const sections: ReportSection[] = [];

  // 1. Core personality — FREE (the hook)
  sections.push({
    key: "personality",
    title: t.personality,
    body:
      DAY_MASTER[chart.dayMaster]?.[lang] ??
      (lang === "th"
        ? "ธาตุประจำวันเกิดของคุณสะท้อนบุคลิกเฉพาะตัวที่โดดเด่น"
        : lang === "ko"
        ? "일간 오행이 당신만의 뚜렷한 개성을 보여줍니다."
        : "Your birth-day element reflects a distinctive personality."),
    locked: false,
  });

  // 2. Five-element balance — FREE
  const dom = dominantElement(chart.elementCounts);
  const missing = missingElements(chart.elementCounts);
  const missingList = missing.map((e) => elName[e]).join(", ");
  const balanceBody =
    lang === "th"
      ? `ธาตุที่โดดเด่นในดวงของคุณคือ ${elName[dom]} ` +
        `ซึ่งเป็นพลังงานหลักที่ขับเคลื่อนชีวิตคุณ` +
        (missing.length
          ? ` ส่วนธาตุที่ขาดคือ ${missingList} — เป็นจุดที่ควรเสริมเพื่อสมดุลชีวิต`
          : ` ธาตุทั้งห้าของคุณค่อนข้างสมดุล ถือว่าเป็นดวงที่กลมกล่อม`)
      : lang === "ko"
      ? `사주에서 가장 강한 오행은 ${elName[dom]}으로, 삶을 이끄는 중심 에너지예요.` +
        (missing.length
          ? ` 부족한 오행은 ${missingList} — 이 기운을 보완하면 균형이 잡힙니다.`
          : ` 다섯 오행이 고르게 갖춰진, 균형 좋은 사주예요.`)
      : `The dominant element in your chart is ${elName[dom]} — the main energy ` +
        `driving your life.` +
        (missing.length
          ? ` Missing: ${missingList} — worth strengthening to bring your life into balance.`
          : ` Your five elements are well balanced — a smooth, rounded chart.`);
  sections.push({ key: "elements", title: t.elements, body: balanceBody, locked: false });

  // 3. Day Master strength (신강/신약) + 용신 — FREE, the depth layer
  const strength = analyzeStrength(chart, lang);
  sections.push({
    key: "strength",
    title:
      lang === "th"
        ? `พลังธาตุประจำตัว — ${strength.bandLabel}`
        : lang === "ko"
        ? `신강·신약 — ${strength.bandLabel}`
        : `Day-Master Energy — ${strength.bandLabel}`,
    body: strength.body,
    locked: false,
  });

  // 4. Today's fortune — FREE, changes daily (revisit hook)
  const today = todayFortune(chart, new Date(), lang);
  sections.push({
    key: "today",
    title: `${TODAY_PREFIX[lang]} · ${today.title}`,
    body: today.body,
    locked: false,
  });

  // 5-8. Locked premium sections. Real bodies live in PREMIUM_BY_DAY_MASTER
  // and are revealed by unlock(); here they stay hidden behind the blur.
  for (const key of ["love", "career", "wealth", "luck10"]) {
    sections.push({ key, title: t[key], body: t.lockedBody, locked: true });
  }

  return sections;
}

// Premium bodies keyed by Day Master (일간, 10 stems) so two people who share
// an element but differ in yin/yang still get distinct readings.
const PREMIUM_BY_DAY_MASTER: Record<string, Record<string, LText>> = {
  "甲": {
    love: {
      th: "คุณรักแบบจริงจังและปกป้อง มองหาคนที่เติบโตไปด้วยกัน ระวังการยึดหลักการจนไม่ยอมง้อ",
      en: "You love loyally and protectively, seeking a partner to grow with. Don't let your principles keep you from making up first.",
      ko: "보호해주는 진지한 사랑, 함께 성장할 사람을 찾아요. 원칙만 고집하다 화해 타이밍을 놓치지 않기.",
    },
    career: {
      th: "เหมาะกับงานที่ได้บุกเบิกและนำทีม เช่น ผู้ก่อตั้ง การศึกษา หรือสายที่ได้สร้างจากศูนย์",
      en: "Suited to pioneering and leading — founding something, education, or building from zero.",
      ko: "개척하고 이끄는 일 — 창업, 교육, 맨땅에서 만들어내는 분야가 어울려요.",
    },
    wealth: {
      th: "การเงินโตแบบต้นไม้ ค่อยเป็นค่อยไปแต่มั่นคง ลงทุนระยะยาวเข้าทางคุณ",
      en: "Your money grows like a tree — slow but solid. Long-term investing is your lane.",
      ko: "나무처럼 천천히, 그러나 단단히 자라는 재물. 장기 투자가 정답이에요.",
    },
    luck10: {
      th: "10 ปีข้างหน้าเป็นช่วงวางรากและขยายอาณาเขต สิ่งที่ปลูกวันนี้จะเป็นป่าในวันหน้า",
      en: "The next decade is for putting down roots and expanding — what you plant now becomes a forest.",
      ko: "뿌리내리고 영토를 넓히는 10년. 지금 심은 것이 숲이 됩니다.",
    },
  },
  "乙": {
    love: {
      th: "คุณรักแบบยืดหยุ่นและประคับประคอง ผูกพันลึก ระวังยอมอีกฝ่ายจนลืมใจตัวเอง",
      en: "You love flexibly and supportively, bonding deep. Careful not to yield until you lose your own heart.",
      ko: "유연하게 맞춰주는 헌신형 사랑. 다 맞춰주다 내 마음을 잃지 않기.",
    },
    career: {
      th: "เก่งงานที่ต้องปรับตัวและประสานคน เช่น ดีไซน์ พีอาร์ งานบริการ หรือคอนเทนต์",
      en: "You shine in adaptive, people-weaving work — design, PR, service, or content.",
      ko: "사람을 잇는 일 — 디자인, PR, 서비스, 콘텐츠에서 빛나요.",
    },
    wealth: {
      th: "หาเงินได้หลายช่องทางเล็ก ๆ รวมกันแล้วมั่นคง เหมาะกระจายความเสี่ยง",
      en: "Many small income streams add up to stability — diversification suits you.",
      ko: "작은 수입원 여러 개가 모여 안정. 분산이 어울려요.",
    },
    luck10: {
      th: "10 ปีข้างหน้าค่อย ๆ ไต่ขึ้นอย่างนุ่มนวล เครือข่ายคนคือทรัพย์สินที่ใหญ่ที่สุด",
      en: "A soft, steady climb over the next decade — your network is your biggest asset.",
      ko: "부드럽게 우상향하는 10년. 인맥이 최대 자산입니다.",
    },
  },
  "丙": {
    love: {
      th: "คุณรักอย่างร้อนแรงและเปิดเผย ดึงดูดคนง่าย แต่ควรระวังใจร้อนช่วงมีปากเสียง",
      en: "You love passionately and openly, attracting people with ease — just watch the temper in arguments.",
      ko: "뜨겁고 솔직한 사랑, 사람을 잘 끌어요. 다툴 때 욱하는 것만 조심.",
    },
    career: {
      th: "โดดเด่นในงานที่ได้เป็นสปอตไลต์ เช่น การตลาด บันเทิง งานขาย หรือครีเอทีฟ",
      en: "You shine in the spotlight — marketing, entertainment, sales, or creative fields.",
      ko: "스포트라이트 받는 일 — 마케팅, 엔터테인먼트, 세일즈, 크리에이티브.",
    },
    wealth: {
      th: "รายได้เข้าไวแต่ใช้ไว ตั้งระบบออมอัตโนมัติไว้กันเงินรั่ว",
      en: "Money comes fast and goes fast — set up automatic savings to stop the leaks.",
      ko: "빨리 벌고 빨리 쓰는 타입. 자동 저축으로 새는 돈을 막으세요.",
    },
    luck10: {
      th: "10 ปีข้างหน้ามีจังหวะชื่อเสียงมาแรง ใช้โอกาสตอนพีคให้เต็มที่",
      en: "A fame window opens in the coming decade — use your peak to the fullest.",
      ko: "이름이 알려지는 시기가 옵니다. 전성기를 아낌없이 쓰세요.",
    },
  },
  "丁": {
    love: {
      th: "คุณรักแบบอบอุ่นลึกซึ้งกับคนที่ไว้ใจ แต่คิดมากและอ่อนไหว ต้องการความมั่นใจจากคู่",
      en: "You love warmly and deeply once trust is built, but you overthink — you need steady reassurance from a partner.",
      ko: "믿는 사람에게 깊고 따뜻한 사랑. 확신을 자주 표현해줄 상대가 필요해요.",
    },
    career: {
      th: "เก่งงานละเอียดที่ต้องใช้ฝีมือเฉพาะ เช่น งานคราฟต์ เขียน วิจัย หรือดูแลเฉพาะทาง",
      en: "You excel at fine, skilled work — craft, writing, research, or specialist care.",
      ko: "섬세한 전문 기술 — 공예, 글, 연구, 전문 케어.",
    },
    wealth: {
      th: "เงินมาจากความเชี่ยวชาญเฉพาะตัว สะสมช้าแต่ยั่งยืน",
      en: "Wealth comes from your unique expertise — it builds slowly but lasts.",
      ko: "전문성에서 나오는 재물. 느리지만 오래갑니다.",
    },
    luck10: {
      th: "10 ปีข้างหน้าเป็นช่วงที่ฝีมือเปล่งประกายและมีคนเห็นคุณค่าอย่างแท้จริง",
      en: "In the coming decade your craft finally shines and gets truly recognized.",
      ko: "실력이 빛을 발하고 진가를 인정받는 10년.",
    },
  },
  "戊": {
    love: {
      th: "คุณเป็นคู่ที่มั่นคงและเป็นหลักให้พิงได้ ระวังเก็บความรู้สึกไว้จนอีกฝ่ายเดาใจไม่ออก",
      en: "You're a steady anchor of a partner — just don't bottle feelings until they can't read you.",
      ko: "든든한 기둥 같은 배우자감. 속마음을 감추다 상대가 답답해하지 않게.",
    },
    career: {
      th: "เหมาะกับงานที่ต้องอาศัยความน่าเชื่อถือ เช่น อสังหาฯ บริหาร ก่อสร้าง หรือราชการ",
      en: "Trust-based fields fit you — real estate, management, construction, or public service.",
      ko: "신뢰가 무기 — 부동산, 관리, 건설, 공직.",
    },
    wealth: {
      th: "สะสมทรัพย์ก้อนใหญ่ได้ดี ที่ดิน/อสังหาฯ คือจุดแข็ง",
      en: "You accumulate big assets well — land and property are your strong suit.",
      ko: "큰 자산을 쌓는 힘. 땅과 부동산이 강점.",
    },
    luck10: {
      th: "10 ปีข้างหน้าเป็นช่วงสร้างฐานที่มั่นคง เหมาะลงหลักปักฐานเรื่องบ้าน/ที่ดิน",
      en: "A decade of building solid foundations — a good time to settle on a home or land.",
      ko: "기반을 다지는 10년. 내 집·땅 마련에 좋은 시기.",
    },
  },
  "己": {
    love: {
      th: "คุณดูแลคู่แบบโอบอ้อมและอ่อนโยน คู่จะรู้สึกอุ่นใจ ระวังแบกอารมณ์อีกฝ่ายจนเหนื่อยเอง",
      en: "You care for a partner gently and generously — they'll feel safe. Just don't carry their emotions until you burn out.",
      ko: "포근하게 돌보는 사랑, 상대는 늘 안정감을 느껴요. 상대 감정까지 떠안아 지치지 않기.",
    },
    career: {
      th: "เก่งงานที่ได้ดูแลและทำให้คนอื่นเติบโต เช่น เอชอาร์ การศึกษา สุขภาพ หรือที่ปรึกษา",
      en: "You shine at helping people grow — HR, education, health, or consulting.",
      ko: "사람을 키우는 일 — HR, 교육, 건강, 컨설팅.",
    },
    wealth: {
      th: "เก็บเงินเก่งแบบไม่โฉ่งฉ่าง ค่อย ๆ สะสมได้มั่นคงกว่าที่คิด",
      en: "A quiet, steady saver — you build more security than people realize.",
      ko: "티 안 나게 착실히 모으는 타입. 생각보다 단단하게 쌓입니다.",
    },
    luck10: {
      th: "10 ปีข้างหน้าเป็นช่วงเก็บเกี่ยวจากสิ่งที่บ่มเพาะไว้ ผลผลิตทยอยออกดอก",
      en: "The coming decade is harvest season — what you've nurtured starts to bloom.",
      ko: "가꿔온 것들을 수확하는 10년. 결실이 차례로 피어요.",
    },
  },
  "庚": {
    love: {
      th: "คุณรักแบบตรงและมีขอบเขตชัด ซื่อสัตย์สูง ต้องการคนที่เคารพพื้นที่ส่วนตัว",
      en: "You love directly with clear boundaries and high loyalty — you need someone who respects your space.",
      ko: "직진에 경계가 분명한 의리 있는 사랑. 내 공간을 존중해줄 사람이 필요해요.",
    },
    career: {
      th: "เก่งงานที่ต้องตัดสินใจเด็ดขาด เช่น กฎหมาย การแพทย์ วิศวะ ทหาร/ตำรวจ หรือการเงิน",
      en: "Decisive fields fit you — law, medicine, engineering, uniformed service, or finance.",
      ko: "결단의 영역 — 법, 의료, 엔지니어링, 제복 조직, 금융.",
    },
    wealth: {
      th: "บริหารเงินมีวินัย เหมาะการลงทุนที่มีกฎเกณฑ์ชัด ไม่หวือหวา",
      en: "You manage money with discipline — rule-based, unflashy investing works best.",
      ko: "규칙 있는 투자, 절제된 관리가 승리 공식.",
    },
    luck10: {
      th: "10 ปีข้างหน้าเป็นช่วงพิสูจน์ฝีมือและได้เลื่อนขั้นจากผลงานที่จับต้องได้",
      en: "A proving decade — advancement comes from results people can touch.",
      ko: "실력을 증명하는 10년. 눈에 보이는 성과로 올라섭니다.",
    },
  },
  "辛": {
    love: {
      th: "คุณรักแบบประณีตและภูมิใจในตัวเอง เสน่ห์เงียบ ๆ แต่ไวต่อคำพูดของคู่",
      en: "You love with refinement and quiet pride — subtly charming, but a partner's words affect you deeply.",
      ko: "세련되고 자존감 있는 사랑, 은은한 매력. 상대의 말 한마디에 오래 아파하지 않기.",
    },
    career: {
      th: "โดดเด่นในงานที่เน้นคุณภาพและรสนิยม เช่น แบรนด์ ความงาม จิวเวลรี่ หรืองานดีเทล",
      en: "Quality-and-taste fields suit you — branding, beauty, jewelry, or detail work.",
      ko: "품질과 감각의 영역 — 브랜딩, 뷰티, 주얼리, 디테일 작업.",
    },
    wealth: {
      th: "เงินมาจากของดีมีระดับ เน้นคุณภาพมากกว่าปริมาณ",
      en: "Money follows premium quality for you — quality over quantity, always.",
      ko: "양보다 질. 프리미엄에서 돈이 따라옵니다.",
    },
    luck10: {
      th: "10 ปีข้างหน้าชื่อเสียงด้านความเชี่ยวชาญเฉพาะจะพาโอกาสดี ๆ เข้ามา",
      en: "In the coming decade, your specialist reputation draws in the right opportunities.",
      ko: "전문 분야의 명성이 좋은 기회를 끌어오는 10년.",
    },
  },
  "壬": {
    love: {
      th: "คุณรักแบบอิสระและเข้าใจคนกว้าง แต่เบื่อง่าย ต้องการคู่ที่ตามความคิดคุณทัน",
      en: "You love freely and understand many kinds of people, but you bore easily — you need a partner who keeps up with your mind.",
      ko: "자유롭고 폭넓게 이해하는 사랑. 쉽게 지루해져서 지적으로 통하는 상대가 필요해요.",
    },
    career: {
      th: "เก่งงานที่ใช้ไหวพริบและการเดินทาง เช่น ค้าขาย ท่องเที่ยว โลจิสติกส์ หรือสื่อสาร",
      en: "Wit-and-movement work fits you — trade, travel, logistics, or communication.",
      ko: "기지와 이동의 일 — 무역, 여행, 물류, 커뮤니케이션.",
    },
    wealth: {
      th: "โอกาสเงินมาหลายทาง แต่ควรโฟกัส อย่ากระจายจนจับอะไรไม่ได้เต็มมือ",
      en: "Money chances come from many directions — focus; don't scatter until nothing lands solidly.",
      ko: "기회가 사방에서 와요. 흩어지지 말고 집중하기.",
    },
    luck10: {
      th: "10 ปีข้างหน้าเต็มไปด้วยการเดินทางและโอกาสข้ามพรมแดน ยืดหยุ่นไว้จะได้เปรียบ",
      en: "A decade full of travel and cross-border chances — flexibility is your edge.",
      ko: "이동과 해외 기회가 가득한 10년. 유연함이 무기입니다.",
    },
  },
  "癸": {
    love: {
      th: "คุณรักลึกซึ้งและเข้าใจใจคนไว แต่คิดเยอะ ควรสื่อสารสิ่งที่รู้สึกออกมาตรง ๆ",
      en: "You love deeply and read hearts fast, but you overthink — say what you feel out loud.",
      ko: "깊고 직감적인 사랑, 마음을 빨리 읽어요. 느낀 것은 말로 표현하기.",
    },
    career: {
      th: "เก่งงานที่ใช้สัญชาตญาณและการวิเคราะห์ เช่น วิจัย จิตวิทยา การเงิน หรือสายลึกลับ",
      en: "Intuition-and-analysis work fits you — research, psychology, finance, or the esoteric.",
      ko: "직관과 분석 — 연구, 심리, 금융, 신비 분야.",
    },
    wealth: {
      th: "เงินไหลมาเงียบ ๆ จากหลายจุด เก็บทีละน้อยแต่สม่ำเสมอจะได้ผล",
      en: "Money trickles in quietly from many spots — small, steady saving wins.",
      ko: "여러 곳에서 조용히 흘러드는 재물. 조금씩 꾸준히 모으세요.",
    },
    luck10: {
      th: "10 ปีข้างหน้าเป็นช่วงบ่มลึกและตกผลึก สิ่งที่สั่งสมจะกลายเป็นความได้เปรียบ",
      en: "A deepening decade — everything you've accumulated crystallizes into an advantage.",
      ko: "깊어지고 여무는 10년. 쌓아온 것이 무기가 됩니다.",
    },
  },
};

/** Reveal premium bodies after payment. Keyed by Day Master (일간). */
export function unlock(
  sections: ReportSection[],
  dayMaster: string,
  lang: Lang = "th"
): ReportSection[] {
  const bodies = PREMIUM_BY_DAY_MASTER[dayMaster] ?? {};
  return sections.map((s) =>
    s.locked && bodies[s.key]
      ? { ...s, body: bodies[s.key][lang], locked: false }
      : s
  );
}

// Back-compat export (Thai) — prefer DISCLAIMER from i18n.ts.
export const DISCLAIMER_TH =
  "ผลการทำนายนี้เป็นการอ้างอิงเพื่อความบันเทิงเท่านั้น";
