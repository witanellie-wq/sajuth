// Shared post-payment hook: generate + persist the long-form saju report.

import { store, type StoredReading } from "./store";
import { generateReadingReport } from "./generate";
import { pickLang } from "./i18n";

/**
 * Generate the Claude long-form report for a paid reading and append it after
 * the free sections. No-op (template fallback) when the API key is missing,
 * generation fails, or a report was already generated.
 */
export async function generateLongReading(id: string, rec: StoredReading): Promise<void> {
  try {
    if (rec.input.generated) return;

    const lang = pickLang(rec.input.lang);
    const gen = await generateReadingReport(
      rec.chart,
      { name: rec.input.name, gender: rec.input.gender },
      lang
    );
    if (!gen) return;

    // Keep the free sections (personality/elements/strength/today) and replace
    // the locked premium templates with the generated long report.
    const free = rec.sections.filter((s) => !s.locked);
    await store.updateSections(id, [...free, ...gen]);
  } catch (err) {
    console.error("generateLongReading failed (non-fatal):", err);
  }
}
