import { NextRequest, NextResponse } from "next/server";
import { store } from "@/lib/store";
import { unlock, interpret } from "@/lib/interpret";
import { generateReadingReport } from "@/lib/generate";
import { todayFortune, TODAY_PREFIX } from "@/lib/today";
import { DISCLAIMER, pickLang } from "@/lib/i18n";

// Language-switch on a paid record may generate the long report on demand.
export const maxDuration = 60;

// GET /api/reading/:id → a stored reading (for shareable /result/:id links).
// Premium sections are revealed only if the reading is paid.
// ?lang=th|en|ko re-renders the report in that language (content follows the
// viewer's current toggle, not just the language it was created in).
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const reading = await store.get(params.id);
  if (!reading) return NextResponse.json({ error: "not_found" }, { status: 404 });

  const storedLang = pickLang(reading.input.lang);
  const langParam = req.nextUrl.searchParams.get("lang");
  const lang = langParam ? pickLang(langParam) : storedLang;

  // Same language → stored sections (may include a generated long report);
  // different language → rebuild the report from the chart.
  const base =
    lang === storedLang ? reading.sections : interpret(reading.chart, lang);
  let sections = reading.paid
    ? unlock(base, reading.chart.dayMaster, lang)
    : base;

  // Paid + generated long report exists, but viewer switched language →
  // serve the cached translation, or generate + cache it now.
  if (reading.paid && lang !== storedLang && reading.input.generated) {
    const free = interpret(reading.chart, lang).filter((s) => !s.locked);
    const cached = reading.input.genByLang?.[lang];
    if (cached && cached.length > 0) {
      sections = [...free, ...cached];
    } else {
      const gen = await generateReadingReport(
        reading.chart,
        { name: reading.input.name, gender: reading.input.gender },
        lang
      );
      if (gen) {
        sections = [...free, ...gen];
        try {
          await store.cacheGenLang(params.id, lang, gen);
        } catch (err) {
          console.error("genByLang cache save failed (non-fatal):", err);
        }
      }
    }
  }

  // Refresh the daily fortune so a stored reading stays alive day to day.
  const today = todayFortune(reading.chart, new Date(), lang);
  sections = sections.map((s) =>
    s.key === "today"
      ? { ...s, title: `${TODAY_PREFIX[lang]} · ${today.title}`, body: today.body }
      : s
  );

  return NextResponse.json({
    id: reading.id,
    name: reading.input.name ?? "",
    chart: reading.chart,
    sections,
    paid: reading.paid,
    lang,
    disclaimer: DISCLAIMER[lang],
  });
}
