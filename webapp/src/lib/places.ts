// 출생 국가 → 진태양시 보정 파라미터.
//
// 해석 원칙은 한국 사주(만세력) 기준. 외국 출생자는:
//   1) 그 나라의 당시 법정 시간대(서머타임·과거 시간대 포함)로 입력 시각을
//      절대 시각(UTC)으로 바꾸고,
//   2) 절기(년주·월주)는 절대 시각으로 판정하고,
//   3) 일주·시주는 출생지 경도의 진태양시(평균태양시)로 판정한다.
// 경도는 각 나라 대표 도시(주 인구 밀집지) 기준.

export interface Place {
  code: string;
  name: { th: string; en: string; ko: string };
  longitude: number; // °E
  /** 당시 법정 UTC 오프셋(시간). 서머타임·과거 시간대 반영. */
  offsetAt(y: number, m: number, d: number, h: number): number;
}

const fixed = (o: number) => () => o;

// 날짜 비교용 (y,m,d,h) → 정수
const k = (y: number, m: number, d: number, h = 0) => ((y * 100 + m) * 100 + d) * 100 + h;

/** 한국: 1954-03-21~1961-08-09 UTC+8:30, 1987·1988 서머타임(+1h). */
function koreaOffset(y: number, m: number, d: number, h: number): number {
  const t = k(y, m, d, h);
  let base = 9;
  if (t >= k(1954, 3, 21) && t < k(1961, 8, 10)) base = 8.5;
  // 서머타임: 1987-05-10 02시 ~ 10-11 03시, 1988-05-08 02시 ~ 10-09 03시
  if (t >= k(1987, 5, 10, 2) && t < k(1987, 10, 11, 3)) return base + 1;
  if (t >= k(1988, 5, 8, 2) && t < k(1988, 10, 9, 3)) return base + 1;
  return base;
}

/** 말레이시아·싱가포르: 1982년 이전 UTC+7:30. */
const malaySing = (y: number) => (y < 1982 ? 7.5 : 8);


/**
 * IANA 시간대 기반 과거 UTC 오프셋(서머타임 포함). Node·브라우저 내장 ICU
 * 데이터를 쓰므로 나라별 규칙을 손으로 넣지 않아도 된다.
 * (y,m,d,h)는 그 지역의 벽시계 시각.
 */
function offsetAtInstant(tz: string, ms: number): number {
  const f = new Intl.DateTimeFormat("en-US", {
    timeZone: tz, hourCycle: "h23",
    year: "numeric", month: "numeric", day: "numeric",
    hour: "numeric", minute: "numeric", second: "numeric",
  });
  const p: Record<string, number> = {};
  for (const x of f.formatToParts(new Date(ms))) if (x.type !== "literal") p[x.type] = Number(x.value);
  const asUtc = Date.UTC(p.year, p.month - 1, p.day, p.hour % 24, p.minute, p.second);
  return (asUtc - ms) / 3600_000;
}
export function tzOffset(tz: string) {
  return (y: number, m: number, d: number, h: number): number => {
    const wall = Date.UTC(y, m - 1, d, h, 0, 0);
    let off = offsetAtInstant(tz, wall);
    off = offsetAtInstant(tz, wall - off * 3600_000);
    return off;
  };
}

// [code, th, en, ko, flag, longitude(°E), IANA tz]
const WORLD: Array<[string, string, string, string, string, number, string]> = [
  ["us-ny", "สหรัฐฯ (นิวยอร์ก/ฝั่งตะวันออก)", "USA (New York / East)", "미국 (뉴욕·동부)", "🇺🇸", -74.0, "America/New_York"],
  ["us-chi", "สหรัฐฯ (ชิคาโก/ภาคกลาง)", "USA (Chicago / Central)", "미국 (시카고·중부)", "🇺🇸", -87.6, "America/Chicago"],
  ["us-den", "สหรัฐฯ (เดนเวอร์/ภูเขา)", "USA (Denver / Mountain)", "미국 (덴버·산악)", "🇺🇸", -105.0, "America/Denver"],
  ["us-la", "สหรัฐฯ (แอลเอ/ฝั่งตะวันตก)", "USA (Los Angeles / West)", "미국 (LA·서부)", "🇺🇸", -118.2, "America/Los_Angeles"],
  ["us-hi", "สหรัฐฯ (ฮาวาย)", "USA (Hawaii)", "미국 (하와이)", "🇺🇸", -157.9, "Pacific/Honolulu"],
  ["ca-tor", "แคนาดา (โทรอนโต)", "Canada (Toronto)", "캐나다 (토론토)", "🇨🇦", -79.4, "America/Toronto"],
  ["ca-van", "แคนาดา (แวนคูเวอร์)", "Canada (Vancouver)", "캐나다 (밴쿠버)", "🇨🇦", -123.1, "America/Vancouver"],
  ["mx", "เม็กซิโก", "Mexico", "멕시코", "🇲🇽", -99.1, "America/Mexico_City"],
  ["br", "บราซิล (เซาเปาโล)", "Brazil (São Paulo)", "브라질 (상파울루)", "🇧🇷", -46.6, "America/Sao_Paulo"],
  ["ar", "อาร์เจนตินา", "Argentina", "아르헨티나", "🇦🇷", -58.4, "America/Argentina/Buenos_Aires"],
  ["cl", "ชิลี", "Chile", "칠레", "🇨🇱", -70.7, "America/Santiago"],
  ["co", "โคลอมเบีย", "Colombia", "콜롬비아", "🇨🇴", -74.1, "America/Bogota"],
  ["pe", "เปรู", "Peru", "페루", "🇵🇪", -77.0, "America/Lima"],
  ["gb", "สหราชอาณาจักร", "United Kingdom", "영국", "🇬🇧", -0.1, "Europe/London"],
  ["ie", "ไอร์แลนด์", "Ireland", "아일랜드", "🇮🇪", -6.3, "Europe/Dublin"],
  ["fr", "ฝรั่งเศส", "France", "프랑스", "🇫🇷", 2.4, "Europe/Paris"],
  ["de", "เยอรมนี", "Germany", "독일", "🇩🇪", 13.4, "Europe/Berlin"],
  ["nl", "เนเธอร์แลนด์", "Netherlands", "네덜란드", "🇳🇱", 4.9, "Europe/Amsterdam"],
  ["be", "เบลเยียม", "Belgium", "벨기에", "🇧🇪", 4.4, "Europe/Brussels"],
  ["ch", "สวิตเซอร์แลนด์", "Switzerland", "스위스", "🇨🇭", 8.5, "Europe/Zurich"],
  ["at", "ออสเตรีย", "Austria", "오스트리아", "🇦🇹", 16.4, "Europe/Vienna"],
  ["it", "อิตาลี", "Italy", "이탈리아", "🇮🇹", 12.5, "Europe/Rome"],
  ["es", "สเปน", "Spain", "스페인", "🇪🇸", -3.7, "Europe/Madrid"],
  ["pt", "โปรตุเกส", "Portugal", "포르투갈", "🇵🇹", -9.1, "Europe/Lisbon"],
  ["se", "สวีเดน", "Sweden", "스웨덴", "🇸🇪", 18.1, "Europe/Stockholm"],
  ["no", "นอร์เวย์", "Norway", "노르웨이", "🇳🇴", 10.8, "Europe/Oslo"],
  ["dk", "เดนมาร์ก", "Denmark", "덴마크", "🇩🇰", 12.6, "Europe/Copenhagen"],
  ["fi", "ฟินแลนด์", "Finland", "핀란드", "🇫🇮", 24.9, "Europe/Helsinki"],
  ["pl", "โปแลนด์", "Poland", "폴란드", "🇵🇱", 21.0, "Europe/Warsaw"],
  ["cz", "เช็ก", "Czechia", "체코", "🇨🇿", 14.4, "Europe/Prague"],
  ["gr", "กรีซ", "Greece", "그리스", "🇬🇷", 23.7, "Europe/Athens"],
  ["ru", "รัสเซีย (มอสโก)", "Russia (Moscow)", "러시아 (모스크바)", "🇷🇺", 37.6, "Europe/Moscow"],
  ["ua", "ยูเครน", "Ukraine", "우크라이나", "🇺🇦", 30.5, "Europe/Kyiv"],
  ["tr", "ตุรกี", "Türkiye", "튀르키예", "🇹🇷", 29.0, "Europe/Istanbul"],
  ["il", "อิสราเอล", "Israel", "이스라엘", "🇮🇱", 34.8, "Asia/Jerusalem"],
  ["ae", "สหรัฐอาหรับเอมิเรตส์", "UAE", "아랍에미리트", "🇦🇪", 55.3, "Asia/Dubai"],
  ["sa", "ซาอุดีอาระเบีย", "Saudi Arabia", "사우디아라비아", "🇸🇦", 46.7, "Asia/Riyadh"],
  ["qa", "กาตาร์", "Qatar", "카타르", "🇶🇦", 51.5, "Asia/Qatar"],
  ["eg", "อียิปต์", "Egypt", "이집트", "🇪🇬", 31.2, "Africa/Cairo"],
  ["za", "แอฟริกาใต้", "South Africa", "남아프리카공화국", "🇿🇦", 28.0, "Africa/Johannesburg"],
  ["ng", "ไนจีเรีย", "Nigeria", "나이지리아", "🇳🇬", 3.4, "Africa/Lagos"],
  ["ke", "เคนยา", "Kenya", "케냐", "🇰🇪", 36.8, "Africa/Nairobi"],
  ["pk", "ปากีสถาน", "Pakistan", "파키스탄", "🇵🇰", 67.0, "Asia/Karachi"],
  ["bd", "บังกลาเทศ", "Bangladesh", "방글라데시", "🇧🇩", 90.4, "Asia/Dhaka"],
  ["lk", "ศรีลังกา", "Sri Lanka", "스리랑카", "🇱🇰", 79.9, "Asia/Colombo"],
  ["np", "เนปาล", "Nepal", "네팔", "🇳🇵", 85.3, "Asia/Kathmandu"],
  ["mn", "มองโกเลีย", "Mongolia", "몽골", "🇲🇳", 106.9, "Asia/Ulaanbaatar"],
  ["bn", "บรูไน", "Brunei", "브루나이", "🇧🇳", 114.9, "Asia/Brunei"],
  ["mo", "มาเก๊า", "Macau", "마카오", "🇲🇴", 113.5, "Asia/Macau"],
  ["kp", "เกาหลีเหนือ", "North Korea", "북한", "🇰🇵", 125.7, "Asia/Pyongyang"],
  ["au-syd", "ออสเตรเลีย (ซิดนีย์/เมลเบิร์น)", "Australia (Sydney / Melbourne)", "호주 (시드니·멜버른)", "🇦🇺", 151.2, "Australia/Sydney"],
  ["au-bne", "ออสเตรเลีย (บริสเบน)", "Australia (Brisbane)", "호주 (브리즈번)", "🇦🇺", 153.0, "Australia/Brisbane"],
  ["au-per", "ออสเตรเลีย (เพิร์ท)", "Australia (Perth)", "호주 (퍼스)", "🇦🇺", 115.9, "Australia/Perth"],
  ["nz", "นิวซีแลนด์", "New Zealand", "뉴질랜드", "🇳🇿", 174.8, "Pacific/Auckland"],
];

export const PLACES: Place[] = [
  { code: "th", name: { th: "🇹🇭 ไทย", en: "🇹🇭 Thailand", ko: "🇹🇭 태국" }, longitude: 100.5, offsetAt: fixed(7) },
  { code: "kr", name: { th: "🇰🇷 เกาหลี", en: "🇰🇷 Korea", ko: "🇰🇷 한국" }, longitude: 127.0, offsetAt: koreaOffset },
  { code: "la", name: { th: "🇱🇦 ลาว", en: "🇱🇦 Laos", ko: "🇱🇦 라오스" }, longitude: 102.6, offsetAt: fixed(7) },
  { code: "kh", name: { th: "🇰🇭 กัมพูชา", en: "🇰🇭 Cambodia", ko: "🇰🇭 캄보디아" }, longitude: 104.9, offsetAt: fixed(7) },
  { code: "vn", name: { th: "🇻🇳 เวียดนาม", en: "🇻🇳 Vietnam", ko: "🇻🇳 베트남" }, longitude: 106.7, offsetAt: fixed(7) },
  { code: "mm", name: { th: "🇲🇲 เมียนมา", en: "🇲🇲 Myanmar", ko: "🇲🇲 미얀마" }, longitude: 96.2, offsetAt: fixed(6.5) },
  { code: "my", name: { th: "🇲🇾 มาเลเซีย", en: "🇲🇾 Malaysia", ko: "🇲🇾 말레이시아" }, longitude: 101.7, offsetAt: malaySing },
  { code: "sg", name: { th: "🇸🇬 สิงคโปร์", en: "🇸🇬 Singapore", ko: "🇸🇬 싱가포르" }, longitude: 103.8, offsetAt: malaySing },
  { code: "id", name: { th: "🇮🇩 อินโดนีเซีย", en: "🇮🇩 Indonesia (Jakarta)", ko: "🇮🇩 인도네시아" }, longitude: 106.8, offsetAt: fixed(7) },
  { code: "ph", name: { th: "🇵🇭 ฟิลิปปินส์", en: "🇵🇭 Philippines", ko: "🇵🇭 필리핀" }, longitude: 121.0, offsetAt: fixed(8) },
  { code: "cn", name: { th: "🇨🇳 จีน", en: "🇨🇳 China", ko: "🇨🇳 중국" }, longitude: 116.4, offsetAt: fixed(8) },
  { code: "tw", name: { th: "🇹🇼 ไต้หวัน", en: "🇹🇼 Taiwan", ko: "🇹🇼 대만" }, longitude: 121.5, offsetAt: fixed(8) },
  { code: "hk", name: { th: "🇭🇰 ฮ่องกง", en: "🇭🇰 Hong Kong", ko: "🇭🇰 홍콩" }, longitude: 114.2, offsetAt: fixed(8) },
  { code: "jp", name: { th: "🇯🇵 ญี่ปุ่น", en: "🇯🇵 Japan", ko: "🇯🇵 일본" }, longitude: 139.7, offsetAt: fixed(9) },
  { code: "in", name: { th: "🇮🇳 อินเดีย", en: "🇮🇳 India", ko: "🇮🇳 인도" }, longitude: 77.2, offsetAt: fixed(5.5) },
  ...WORLD.map(([code, th, en, ko, flag, longitude, tz]) => ({
    code,
    name: { th: `${flag} ${th}`, en: `${flag} ${en}`, ko: `${flag} ${ko}` },
    longitude,
    offsetAt: tzOffset(tz),
  })),
];

export const PLACE_OTHER = {
  code: "none",
  name: { th: "🌍 ประเทศอื่น (ไม่ปรับเวลา)", en: "🌍 Other (no correction)", ko: "🌍 기타 (보정 없음)" },
};

export function findPlace(code?: string): Place | undefined {
  return PLACES.find((p) => p.code === code);
}
