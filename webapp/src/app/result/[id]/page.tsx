import { notFound } from "next/navigation";
import { store } from "@/lib/store";
import { redactLocked } from "@/lib/redact";
import { unlock } from "@/lib/interpret";
import { todayFortune, TODAY_PREFIX } from "@/lib/today";
import { DISCLAIMER, pickLang } from "@/lib/i18n";
import ResultView, { type Reading } from "@/components/ResultView";

// Shareable read-only reading page — the viral share target (/result/:id).
// Force per-request rendering so the daily fortune refreshes on every visit.
export const dynamic = "force-dynamic";

export default async function ResultPage({
  params,
}: {
  params: { id: string };
}) {
  const reading = await store.get(params.id);
  if (!reading) notFound();

  const lang = pickLang(reading.input.lang);
  let sections = reading.paid
    ? unlock(reading.sections, reading.chart.dayMaster, lang)
    : redactLocked(reading.sections);

  // Refresh the daily fortune on every visit (shared links stay alive daily).
  const today = todayFortune(reading.chart, new Date(), lang);
  sections = sections.map((s) =>
    s.key === "today"
      ? { ...s, title: `${TODAY_PREFIX[lang]} · ${today.title}`, body: today.body }
      : s
  );

  const initial: Reading = {
    id: reading.id,
    chart: reading.chart,
    sections,
    paid: reading.paid,
    disclaimer: DISCLAIMER[lang],
  };

  const inp = reading.input;
  const editQ = new URLSearchParams({
    edit: "1",
    y: String(inp.year), m: String(inp.month), d: String(inp.day),
    ...(typeof inp.hour === "number" ? { h: String(inp.hour) } : {}),
    ...(typeof inp.minute === "number" ? { mi: String(inp.minute) } : {}),
    ...(typeof inp.sijin === "number" ? { sj: String(inp.sijin) } : {}),
    ...(inp.name ? { n: inp.name } : {}),
    ...(inp.gender ? { g: inp.gender } : {}),
    ...(inp.place ? { p: inp.place } : {}),
    lang,
  });
  const T = {
    th: { sub: "ผลดวงซาจู", edit: "✏️ แก้ไขข้อมูลวันเกิด", own: "ดูดวงของฉันบ้าง →" },
    en: { sub: "Saju reading", edit: "✏️ Edit birth info", own: "Get my own reading →" },
    ko: { sub: "사주 결과", edit: "✏️ 생년월일 정보 수정", own: "내 사주도 보기 →" },
  }[lang];

  return (
    <main className="mx-auto max-w-xl px-5 py-10">
      <header className="mb-4 text-center">
        <a href="/" className="text-3xl font-bold text-rosewood">
          ดวงซาจู
        </a>
        <p className="mt-2 text-sm text-ink/70">
          {T.sub}
        </p>
        <a
          href={`/?${editQ.toString()}`}
          className="mt-3 inline-block rounded-full border border-rosewood/40 bg-white/80 px-4 py-1.5 text-xs font-semibold text-rosewood"
        >
          {T.edit}
        </a>
      </header>
      <ResultView initial={initial} />
      <p className="mt-6 text-center">
        <a href="/" className="text-sm text-rosewood underline">
          {T.own}
        </a>
      </p>
    </main>
  );
}
