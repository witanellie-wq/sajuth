// Shared language plumbing. Report content is generated in ONE language per
// request (lang param); UI chrome shows Thai + English together (bilingual
// labels live in the components).

export type Lang = "th" | "en";

export function pickLang(v: unknown): Lang {
  return v === "en" ? "en" : "th";
}

export const DISCLAIMER: Record<Lang, string> = {
  th: "ผลการทำนายนี้เป็นการอ้างอิงเพื่อความบันเทิงเท่านั้น",
  en: "This reading is for entertainment purposes only.",
};
