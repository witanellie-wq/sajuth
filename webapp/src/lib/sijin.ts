// 12시진 — 정확한 시각은 모르고 "자시에 태어났다"처럼 시진만 아는 경우용.
// 시진 범위는 진태양시 기준(자시 23~01시). 선택하면 시주는 그 시진으로 확정되고,
// 일주는 한국 관례대로 "그 날짜의 시진"으로 본다(자시 = 그 날의 시작).
export const SIJIN: Array<{ zhi: string; th: string; en: string; ko: string; range: string }> = [
  { zhi: "子", th: "ยามชวด", en: "Rat hour", ko: "자시", range: "23:00–01:00" },
  { zhi: "丑", th: "ยามฉลู", en: "Ox hour", ko: "축시", range: "01:00–03:00" },
  { zhi: "寅", th: "ยามขาล", en: "Tiger hour", ko: "인시", range: "03:00–05:00" },
  { zhi: "卯", th: "ยามเถาะ", en: "Rabbit hour", ko: "묘시", range: "05:00–07:00" },
  { zhi: "辰", th: "ยามมะโรง", en: "Dragon hour", ko: "진시", range: "07:00–09:00" },
  { zhi: "巳", th: "ยามมะเส็ง", en: "Snake hour", ko: "사시", range: "09:00–11:00" },
  { zhi: "午", th: "ยามมะเมีย", en: "Horse hour", ko: "오시", range: "11:00–13:00" },
  { zhi: "未", th: "ยามมะแม", en: "Goat hour", ko: "미시", range: "13:00–15:00" },
  { zhi: "申", th: "ยามวอก", en: "Monkey hour", ko: "신시", range: "15:00–17:00" },
  { zhi: "酉", th: "ยามระกา", en: "Rooster hour", ko: "유시", range: "17:00–19:00" },
  { zhi: "戌", th: "ยามจอ", en: "Dog hour", ko: "술시", range: "19:00–21:00" },
  { zhi: "亥", th: "ยามกุน", en: "Pig hour", ko: "해시", range: "21:00–23:00" },
];

export function validSijin(v: unknown): v is number {
  return typeof v === "number" && Number.isInteger(v) && v >= 0 && v <= 11;
}
