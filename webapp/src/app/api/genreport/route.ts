import { NextRequest, NextResponse } from "next/server";
import { store, compatStore } from "@/lib/store";
import {
  reportChunkCount,
  generateReadingPart,
  generateCompatPart,
} from "@/lib/generate";
import type { Compatibility } from "@/lib/compat";
import { pickLang } from "@/lib/i18n";

// Client-orchestrated long-report generation. One serverless call per PART
// (3 categories, ~30s) so the full 12-13 category report can never hit the
// 60s function cap. The buyer's page fires all parts in parallel, shows
// progress, then saves the assembled report in a single write.
export const maxDuration = 60;

type Kind = "reading" | "compat";

interface GenSection {
  title: string;
  body: string;
}

function sane(sections: unknown): GenSection[] | null {
  if (!Array.isArray(sections) || sections.length < 6 || sections.length > 24) return null;
  const out: GenSection[] = [];
  for (const s of sections) {
    if (!s || typeof s.title !== "string" || typeof s.body !== "string") return null;
    out.push({ title: s.title.slice(0, 200), body: s.body.slice(0, 12000) });
  }
  return out;
}

// GET /api/genreport?id=...&kind=reading|compat → { total, finished }
export async function GET(req: NextRequest) {
  const id = req.nextUrl.searchParams.get("id") ?? "";
  const kind: Kind = req.nextUrl.searchParams.get("kind") === "compat" ? "compat" : "reading";
  if (!id) return NextResponse.json({ error: "missing_id" }, { status: 400 });

  if (kind === "compat") {
    const rec = await compatStore.get(id);
    if (!rec) return NextResponse.json({ error: "not_found" }, { status: 404 });
    const result = rec.result as Compatibility & { generated?: boolean };
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const payload = rec.charts as any;
    return NextResponse.json({
      paid: rec.paid,
      finished: !!result.generated,
      total: reportChunkCount("compat", payload?.relationship ?? result.relationship),
    });
  }
  const rec = await store.get(id);
  if (!rec) return NextResponse.json({ error: "not_found" }, { status: 404 });
  return NextResponse.json({
    paid: rec.paid,
    finished: !!rec.input.generated,
    total: reportChunkCount("reading"),
  });
}

// POST /api/genreport
//   { id, kind, part }              → generate that part, return its sections
//   { id, kind, save: [...] }       → assemble + persist (first write wins)
export async function POST(req: NextRequest) {
  let body: {
    id?: string;
    kind?: string;
    part?: number;
    save?: unknown;
  };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }
  const id = body.id ?? "";
  const kind: Kind = body.kind === "compat" ? "compat" : "reading";
  if (!id) return NextResponse.json({ error: "missing_id" }, { status: 400 });

  if (kind === "compat") {
    const rec = await compatStore.get(id);
    if (!rec) return NextResponse.json({ error: "not_found" }, { status: 404 });
    if (!rec.paid) return NextResponse.json({ error: "not_paid" }, { status: 403 });
    const result = rec.result as Compatibility & { generated?: boolean };
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const payload = rec.charts as any;

    if (body.save !== undefined) {
      if (result.generated) return NextResponse.json({ ok: true, already: true });
      const gen = sane(body.save);
      if (!gen) return NextResponse.json({ error: "bad_sections" }, { status: 400 });
      const overview = result.sections?.find((s) => s.key === "overview");
      const sections = [
        ...(overview ? [overview] : []),
        ...gen.map((s, i) => ({ key: `gen${i + 1}`, title: s.title, body: s.body, locked: false })),
      ];
      await compatStore.updateResult(id, { ...result, sections, generated: true });
      return NextResponse.json({ ok: true });
    }

    if (result.generated) return NextResponse.json({ finished: true });
    if (!payload?.charts?.a?.year || !payload?.charts?.b?.year) {
      return NextResponse.json({ error: "old_format" }, { status: 400 });
    }
    const part = Number(body.part ?? -1);
    const sections = await generateCompatPart(
      payload.charts.a,
      payload.charts.b,
      payload?.profiles ?? {},
      result,
      part
    );
    if (!sections) return NextResponse.json({ error: "generation_failed" }, { status: 502 });
    return NextResponse.json({ part, sections });
  }

  const rec = await store.get(id);
  if (!rec) return NextResponse.json({ error: "not_found" }, { status: 404 });
  if (!rec.paid) return NextResponse.json({ error: "not_paid" }, { status: 403 });

  if (body.save !== undefined) {
    if (rec.input.generated) return NextResponse.json({ ok: true, already: true });
    const gen = sane(body.save);
    if (!gen) return NextResponse.json({ error: "bad_sections" }, { status: 400 });
    const free = rec.sections.filter((s) => !s.locked);
    await store.updateSections(id, [
      ...free,
      ...gen.map((s, i) => ({ key: `gen${i + 1}`, title: s.title, body: s.body, locked: false })),
    ]);
    return NextResponse.json({ ok: true });
  }

  if (rec.input.generated) return NextResponse.json({ finished: true });
  const part = Number(body.part ?? -1);
  const sections = await generateReadingPart(
    rec.chart,
    { name: rec.input.name, gender: rec.input.gender },
    pickLang(rec.input.lang),
    part
  );
  if (!sections) return NextResponse.json({ error: "generation_failed" }, { status: 502 });
  return NextResponse.json({ part, sections });
}
