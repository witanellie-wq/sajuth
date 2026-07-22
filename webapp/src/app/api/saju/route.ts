import { NextRequest, NextResponse } from "next/server";
import { computeSaju, type SajuInput } from "@/lib/saju";
import { interpret } from "@/lib/interpret";
import { rewriteSections } from "@/lib/rewrite";
import { store } from "@/lib/store";
import { DISCLAIMER, pickLang } from "@/lib/i18n";

// POST /api/saju — body: { year, month, day, hour?, minute?, longitude?, lang?, rewrite? }
// Computes the chart, interprets it in the requested language, persists the
// reading, and returns it with a shareable id. Persistence failure is NON-fatal:
// the reading still returns (id: null) so a storage misconfig never breaks the
// core product — only share links.
export async function POST(req: NextRequest) {
  let input: SajuInput & { rewrite?: boolean; lang?: string; name?: string; gender?: string };
  try {
    input = await req.json();
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }

  if (
    typeof input.year !== "number" ||
    typeof input.month !== "number" ||
    typeof input.day !== "number" ||
    input.year < 1900 ||
    input.year > 2100 ||
    input.month < 1 ||
    input.month > 12 ||
    input.day < 1 ||
    input.day > 31 ||
    (input.hour !== undefined &&
      (typeof input.hour !== "number" || input.hour < 0 || input.hour > 23)) ||
    (input.minute !== undefined &&
      (typeof input.minute !== "number" || input.minute < 0 || input.minute > 59))
  ) {
    return NextResponse.json({ error: "invalid_date" }, { status: 400 });
  }

  const lang = pickLang(input.lang);
  const chart = computeSaju(input);
  let sections = interpret(chart, lang);
  if (input.rewrite) sections = await rewriteSections(chart, sections);

  const name = typeof input.name === "string" ? input.name.slice(0, 40) : "";
  const gender = input.gender === "F" || input.gender === "M" ? input.gender : "";

  let id: string | null = null;
  try {
    const reading = await store.save({
      input: {
        year: input.year,
        month: input.month,
        day: input.day,
        hour: typeof input.hour === "number" ? input.hour : null,
        lang,
        ...(name ? { name } : {}),
        ...(gender ? { gender } : {}),
      },
      chart,
      sections,
      paid: false,
    });
    id = reading.id;
  } catch (err) {
    console.error("reading save failed (non-fatal):", err);
  }

  return NextResponse.json({ id, name, chart, sections, lang, disclaimer: DISCLAIMER[lang] });
}
