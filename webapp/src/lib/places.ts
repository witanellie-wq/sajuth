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
];

export const PLACE_OTHER = {
  code: "none",
  name: { th: "🌍 ประเทศอื่น (ไม่ปรับเวลา)", en: "🌍 Other (no correction)", ko: "🌍 기타 (보정 없음)" },
};

export function findPlace(code?: string): Place | undefined {
  return PLACES.find((p) => p.code === code);
}
