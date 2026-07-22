import { NextRequest, NextResponse } from "next/server";
import { store } from "@/lib/store";
import { unlock } from "@/lib/interpret";
import { todayFortune, TODAY_PREFIX } from "@/lib/today";
import { DISCLAIMER, pickLang } from "@/lib/i18n";

// GET /api/reading/:id → a stored reading (for shareable /result/:id links).
// Premium sections are revealed only if the reading is paid.
export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const reading = await store.get(params.id);
  if (!reading) return NextResponse.json({ error: "not_found" }, { status: 404 });

  const lang = pickLang(reading.input.lang);
  let sections = reading.paid
    ? unlock(reading.sections, reading.chart.dayMaster, lang)
    : reading.sections;

  // Refresh the daily fortune so a stored reading stays alive day to day.
  const today = todayFortune(reading.chart, new Date(), lang);
  sections = sections.map((s) =>
    s.key === "today"
      ? { ...s, title: `${TODAY_PREFIX[lang]} · ${today.title}`, body: today.body }
      : s
  );

  return NextResponse.json({
    id: reading.id,
    chart: reading.chart,
    sections,
    paid: reading.paid,
    lang,
    disclaimer: DISCLAIMER[lang],
  });
}
