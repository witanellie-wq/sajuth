// Report content language — follows the UI language selection (th/en/ko).

export type Lang = "th" | "en" | "ko";

export function pickLang(v: unknown): Lang {
  return v === "en" ? "en" : v === "ko" ? "ko" : "th";
}

export const DISCLAIMER: Record<Lang, string> = {
  th: "ผลการทำนายนี้เป็นการอ้างอิงเพื่อความบันเทิงเท่านั้น",
  en: "This reading is for entertainment purposes only.",
  ko: "본 결과는 재미로 참고하는 용도입니다.",
};
