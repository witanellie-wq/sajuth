// Shared 만세력-style element colors. Yang = saturated, yin = light.
// 무토(戊) deep yellow, 기토(己) light yellow, and so on for all 10 stems.

export const STEM_STYLE: Record<string, string> = {
  "甲": "bg-emerald-500 text-white",
  "乙": "bg-emerald-300 text-emerald-900",
  "丙": "bg-red-500 text-white",
  "丁": "bg-rose-300 text-rose-900",
  "戊": "bg-yellow-400 text-yellow-900",
  "己": "bg-yellow-200 text-yellow-800",
  "庚": "bg-slate-400 text-white",
  "辛": "bg-slate-200 text-slate-700",
  "壬": "bg-blue-500 text-white",
  "癸": "bg-sky-300 text-sky-900",
};

export const BRANCH_STYLE: Record<string, string> = {
  "子": "bg-blue-500 text-white",
  "丑": "bg-yellow-200 text-yellow-800",
  "寅": "bg-emerald-500 text-white",
  "卯": "bg-emerald-300 text-emerald-900",
  "辰": "bg-yellow-400 text-yellow-900",
  "巳": "bg-rose-300 text-rose-900",
  "午": "bg-red-500 text-white",
  "未": "bg-yellow-200 text-yellow-800",
  "申": "bg-slate-400 text-white",
  "酉": "bg-slate-200 text-slate-700",
  "戌": "bg-yellow-400 text-yellow-900",
  "亥": "bg-sky-300 text-sky-900",
};

export const ELEMENT_CHIP: Record<string, string> = {
  wood: "bg-emerald-100 text-emerald-700",
  fire: "bg-red-100 text-red-600",
  earth: "bg-yellow-100 text-yellow-700",
  metal: "bg-slate-200 text-slate-600",
  water: "bg-blue-100 text-blue-700",
};

// 지장간 (hidden stems inside each branch), 여기→중기→정기 order.
// Shown under every branch tile so 암합 readings can be traced by eye.
export const HIDDEN_STEMS: Record<string, string> = {
  "子": "壬癸",
  "丑": "癸辛己",
  "寅": "戊丙甲",
  "卯": "甲乙",
  "辰": "乙癸戊",
  "巳": "戊庚丙",
  "午": "丙己丁",
  "未": "丁乙己",
  "申": "戊壬庚",
  "酉": "庚辛",
  "戌": "辛丁戊",
  "亥": "戊甲壬",
};
