import { notFound } from "next/navigation";
import { store } from "@/lib/store";
import { DISCLAIMER_TH, unlock } from "@/lib/interpret";
import { todayFortune } from "@/lib/today";
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

  let sections = reading.paid
    ? unlock(reading.sections, reading.chart.dayMaster)
    : reading.sections;

  // Refresh the daily fortune on every visit (shared links stay alive daily).
  const today = todayFortune(reading.chart);
  sections = sections.map((s) =>
    s.key === "today"
      ? { ...s, title: `ดวงวันนี้ · ${today.title}`, body: today.body }
      : s
  );

  const initial: Reading = {
    id: reading.id,
    chart: reading.chart,
    sections,
    paid: reading.paid,
    disclaimer: DISCLAIMER_TH,
  };

  return (
    <main className="mx-auto max-w-xl px-5 py-10">
      <header className="mb-4 text-center">
        <a href="/" className="text-3xl font-bold text-rosewood">
          ดวงซาจู
        </a>
        <p className="mt-2 text-sm text-ink/70">ผลดวงซาจูที่แชร์มา</p>
      </header>
      <ResultView initial={initial} />
      <p className="mt-6 text-center">
        <a href="/" className="text-sm text-rosewood underline">
          ดูดวงของฉันบ้าง →
        </a>
      </p>
    </main>
  );
}
