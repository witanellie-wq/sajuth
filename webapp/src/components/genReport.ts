// Client-side long-report orchestration: fire one serverless call per part
// (each well under the 60s cap), then save the assembled report in a single
// guarded write. Returns "ok" when the report was generated+saved now,
// "already" when the record already has it, "failed" otherwise. The caller
// then re-fetches the record and swaps the sections in place — NO page
// reload (reload-based flows can loop on stale caches).

interface GenSection {
  title: string;
  body: string;
}

export type GenOutcome = "ok" | "already" | "failed";

export async function runReportGeneration(
  id: string,
  kind: "reading" | "compat",
  onProgress: (done: number, total: number) => void
): Promise<GenOutcome> {
  const st = await fetch(`/api/genreport?id=${id}&kind=${kind}`).then((r) => r.json());
  if (st.finished) return "already";
  if (!st.allowed || !st.total) return "failed";
  const total: number = st.total;
  onProgress(0, total);

  let done = 0;
  const parts: Array<GenSection[] | null> = new Array(total).fill(null);
  let alreadyFinished = false;

  const genOne = async (p: number): Promise<void> => {
    try {
      const r = await fetch("/api/genreport", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, kind, part: p }),
      });
      const d = await r.json();
      if (d.finished) {
        alreadyFinished = true;
        return;
      }
      if (Array.isArray(d.sections)) {
        parts[p] = d.sections;
        done++;
        onProgress(done, total);
      }
    } catch {
      /* retried below */
    }
  };

  // Low-tier API keys have tight per-minute token limits — firing all parts
  // at once gets most of them rate-limited. Run a small worker pool (3
  // concurrent) and retry missing parts across rounds with backoff.
  const MAX_ROUNDS = 5;
  for (let round = 0; round < MAX_ROUNDS; round++) {
    const missing = [...Array(total).keys()].filter((p) => !parts[p]);
    if (!missing.length || alreadyFinished) break;
    if (round > 0) await new Promise((r) => setTimeout(r, 5000 * round));
    let idx = 0;
    await Promise.all(
      Array(Math.min(3, missing.length))
        .fill(0)
        .map(async () => {
          while (idx < missing.length && !alreadyFinished) {
            const p = missing[idx++];
            await genOne(p);
          }
        })
    );
  }
  if (alreadyFinished) return "already";
  if (parts.some((p) => !p)) return "failed";

  const all = (parts as GenSection[][]).flat();
  const saved = await fetch("/api/genreport", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ id, kind, save: all }),
  }).then((r) => r.json());
  if (saved.ok === true) return "ok";
  if (saved.already === true) return "already";
  return "failed";
}

/**
 * Translate the stored report into another language, one section per call
 * (same pooling/retry as generation). The translated report is cached
 * server-side, so subsequent toggles are instant.
 */
export async function runReportTranslation(
  id: string,
  kind: "reading" | "compat",
  tlang: string,
  onProgress: (done: number, total: number) => void
): Promise<GenOutcome> {
  const st = await fetch(`/api/genreport?id=${id}&kind=${kind}&tlang=${tlang}`).then((r) =>
    r.json()
  );
  if (st.finished) return "already";
  if (!st.allowed || !st.total) return "failed";
  const total: number = st.total;
  onProgress(0, total);

  let done = 0;
  const parts: Array<GenSection | null> = new Array(total).fill(null);

  const trOne = async (p: number): Promise<void> => {
    try {
      const r = await fetch("/api/genreport", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, kind, tlang, part: p }),
      });
      const d = await r.json();
      if (d.section) {
        parts[p] = d.section;
        done++;
        onProgress(done, total);
      }
    } catch {
      /* retried below */
    }
  };

  const MAX_ROUNDS = 5;
  for (let round = 0; round < MAX_ROUNDS; round++) {
    const missing = [...Array(total).keys()].filter((p) => !parts[p]);
    if (!missing.length) break;
    if (round > 0) await new Promise((r) => setTimeout(r, 5000 * round));
    let idx = 0;
    await Promise.all(
      Array(Math.min(3, missing.length))
        .fill(0)
        .map(async () => {
          while (idx < missing.length) {
            const p = missing[idx++];
            await trOne(p);
          }
        })
    );
  }
  if (parts.some((p) => !p)) return "failed";

  const saved = await fetch("/api/genreport", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ id, kind, tlang, save: parts }),
  }).then((r) => r.json());
  if (saved.ok === true) return "ok";
  if (saved.already === true) return "already";
  return "failed";
}
