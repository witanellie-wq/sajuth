// Shared post-payment hook: generate + persist the long-form compat report.

import { compatStore, type StoredCompat } from "./store";
import { generateCompatReport } from "./generate";
import type { Compatibility } from "./compat";

/**
 * Generate the Claude long-form report for a paid compat record and store it
 * in place of the template sections. No-op (template fallback) when the API
 * key is missing, generation fails, or a report was already generated.
 */
export async function generateLongCompat(id: string, rec: StoredCompat): Promise<void> {
  try {
    const result = rec.result as Compatibility & { generated?: boolean };
    if (result.generated) return;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const payload = rec.charts as any;
    const chartA = payload?.charts?.a;
    const chartB = payload?.charts?.b;
    if (!chartA?.year || !chartB?.year) return; // old-format record

    const sections = await generateCompatReport(
      chartA,
      chartB,
      payload?.profiles ?? {},
      result
    );
    if (!sections) return;

    await compatStore.updateResult(id, {
      ...result,
      sections: [result.sections.find((s) => s.key === "overview")!, ...sections].filter(
        Boolean
      ),
      generated: true,
    });
  } catch (err) {
    console.error("generateLongCompat failed (non-fatal):", err);
  }
}
