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
  if (!st.paid || !st.total) return "failed";
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

  await Promise.all([...Array(total).keys()].map(genOne));
  if (alreadyFinished) return "already";

  // One retry round for parts that failed.
  const failed = [...Array(total).keys()].filter((p) => !parts[p]);
  if (failed.length) await Promise.all(failed.map(genOne));
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
