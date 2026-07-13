import { notFound } from "next/navigation";
import { store } from "@/lib/store";
import { DISCLAIMER_TH, unlock } from "@/lib/interpret";
import ResultView, { type Reading } from "@/components/ResultView";

// Shareable read-only reading page — the viral share target (/result/:id).
export default async function ResultPage({
  params,
}: {
  params: { id: string };
}) {
  const reading = await store.get(params.id);
  if (!reading) notFound();

  const sections = reading.paid
    ? unlock(reading.sections, reading.chart.dayMasterElement)
    : reading.sections;

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
