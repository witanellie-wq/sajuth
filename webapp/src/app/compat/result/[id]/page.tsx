import { notFound } from "next/navigation";
import { compatStore } from "@/lib/store";
import { unlockCompat, type Compatibility } from "@/lib/compat";
import { DISCLAIMER, pickLang } from "@/lib/i18n";
import CompatView, { type CompatData } from "@/components/CompatView";

// Shareable read-only 궁합 result (/compat/result/:id).
export const dynamic = "force-dynamic";

export default async function CompatResultPage({
  params,
}: {
  params: { id: string };
}) {
  const rec = await compatStore.get(params.id);
  if (!rec) notFound();

  const result = rec.result as Compatibility;
  const lang = pickLang(result.lang);
  const sections = rec.paid
    ? unlockCompat(result.sections, result.rel, lang)
    : result.sections;

  // New records store { profiles, relationship, charts: {a,b} }; old ones
  // stored bare { a, b } summaries — fall back gracefully.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const payload = rec.charts as any;
  const data: CompatData = {
    id: rec.id,
    paid: rec.paid,
    profiles: payload?.profiles,
    relationship: payload?.relationship,
    charts: (payload?.charts ?? payload) as CompatData["charts"],
    result: { ...result, sections },
    disclaimer: DISCLAIMER[lang],
  };

  return (
    <main className="mx-auto max-w-xl px-5 py-10">
      <header className="mb-4 text-center">
        <a href="/" className="text-3xl font-bold text-rosewood">
          ดวงซาจู
        </a>
        <p className="mt-2 text-sm text-ink/70">ผลดวงความเข้ากันที่แชร์มา</p>
      </header>
      <CompatView data={data} />
      <p className="mt-6 text-center">
        <a href="/compat" className="text-sm text-rosewood underline">
          ลองดูคู่ของฉันบ้าง →
        </a>
      </p>
    </main>
  );
}
