// Five-element (오행) relationships, shared by the strength (신강/신약) and
// compatibility (궁합) engines.

import type { Element } from "./saju";

export const ELEMENTS: Element[] = ["wood", "fire", "earth", "metal", "water"];

export const ELEMENT_TH: Record<Element, string> = {
  wood: "ไม้ (木)",
  fire: "ไฟ (火)",
  earth: "ดิน (土)",
  metal: "ทอง (金)",
  water: "น้ำ (水)",
};

// 相生 generating cycle: wood → fire → earth → metal → water → wood.
const GEN_NEXT: Record<Element, Element> = {
  wood: "fire", fire: "earth", earth: "metal", metal: "water", water: "wood",
};
// 相剋 controlling cycle: wood → earth → water → fire → metal → wood.
const CTRL_NEXT: Record<Element, Element> = {
  wood: "earth", earth: "water", water: "fire", fire: "metal", metal: "wood",
};

/** The element that `e` generates (자식 = 식상). */
export const generates = (e: Element): Element => GEN_NEXT[e];
/** The element that generates `e` (부모 = 인성). */
export const generatedBy = (e: Element): Element =>
  ELEMENTS.find((x) => GEN_NEXT[x] === e)!;
/** The element that `e` controls (내가 극하는 = 재성). */
export const controls = (e: Element): Element => CTRL_NEXT[e];
/** The element that controls `e` (나를 극하는 = 관성). */
export const controlledBy = (e: Element): Element =>
  ELEMENTS.find((x) => CTRL_NEXT[x] === e)!;

export type Relation = "same" | "resource" | "output" | "wealth" | "officer";

/** How element `other` relates to the day-master element `dm`. */
export function relationTo(dm: Element, other: Element): Relation {
  if (other === dm) return "same"; // 비겁
  if (other === generatedBy(dm)) return "resource"; // 인성 (supports)
  if (other === generates(dm)) return "output"; // 식상 (drains)
  if (other === controls(dm)) return "wealth"; // 재성 (drains)
  return "officer"; // 관성 (drains/controls)
}

// Whether a relation supports (strengthens) the day master.
export const isSupport = (r: Relation): boolean => r === "same" || r === "resource";
