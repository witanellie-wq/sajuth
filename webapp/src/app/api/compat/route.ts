import { NextRequest, NextResponse } from "next/server";
import { computeSaju, placeCoords, type SajuInput } from "@/lib/saju";
import { computeCompatibility, unlockCompat, type Compatibility } from "@/lib/compat";
import { compatStore } from "@/lib/store";
import { DISCLAIMER, pickLang } from "@/lib/i18n";

// GET /api/compat?id=...&lang=th|en|ko → a stored compat result re-rendered in
// the requested language. Same language → stored result (may include the
// generated long report); different language → recompute from stored charts.
export async function GET(req: NextRequest) {
  const id = req.nextUrl.searchParams.get("id");
  if (!id) return NextResponse.json({ error: "missing_id" }, { status: 400 });
  const rec = await compatStore.get(id);
  if (!rec) return NextResponse.json({ error: "not_found" }, { status: 404 });

  const stored = rec.result as Compatibility;
  const storedLang = pickLang(stored.lang);
  const langParam = req.nextUrl.searchParams.get("lang");
  const lang = langParam ? pickLang(langParam) : storedLang;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const payload = rec.charts as any;
  const relationship: string = payload?.relationship ?? "lovers";

  let result = stored;
  if (lang !== storedLang && payload?.charts?.a?.year && payload?.charts?.b?.year) {
    result = computeCompatibility(payload.charts.a, payload.charts.b, lang, relationship);
  }
  const sections = rec.paid
    ? unlockCompat(result.sections, result.rel, lang)
    : result.sections;

  return NextResponse.json({
    id: rec.id,
    profiles: payload?.profiles,
    relationship,
    charts: payload?.charts ?? payload,
    result: { ...result, sections },
    disclaimer: DISCLAIMER[lang],
  });
}

interface PersonInput extends SajuInput {
  name?: string;
  gender?: string; // "F" | "M" | ""
  place?: string; // "th" | "kr" | "none"
}

interface Body {
  a: PersonInput;
  b: PersonInput;
  relationship?: string; // lovers | married | talking | friends | other
  lang?: string;
}

function valid(i: PersonInput | undefined): boolean {
  return (
    !!i &&
    typeof i.year === "number" &&
    typeof i.month === "number" &&
    typeof i.day === "number" &&
    i.year >= 1900 &&
    i.year <= 2100 &&
    i.month >= 1 &&
    i.month <= 12 &&
    i.day >= 1 &&
    i.day <= 31 &&
    (i.hour === undefined || (typeof i.hour === "number" && i.hour >= 0 && i.hour <= 23)) &&
    (i.minute === undefined ||
      (typeof i.minute === "number" && i.minute >= 0 && i.minute <= 59))
  );
}

function profileOf(i: PersonInput) {
  return {
    name: typeof i.name === "string" ? i.name.slice(0, 40) : "",
    gender: i.gender === "F" || i.gender === "M" ? i.gender : "",
    year: i.year,
    month: i.month,
    day: i.day,
    hour: typeof i.hour === "number" ? i.hour : null,
    minute: typeof i.minute === "number" ? i.minute : null,
  };
}

// POST /api/compat — body: { a, b, relationship?, lang? } → full charts +
// compatibility result. Save failure is non-fatal (id: null).
export async function POST(req: NextRequest) {
  let body: Body;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }
  if (!valid(body.a) || !valid(body.b)) {
    return NextResponse.json({ error: "invalid_date" }, { status: 400 });
  }

  const lang = pickLang(body.lang);
  const relationship =
    typeof body.relationship === "string" && body.relationship ? body.relationship : "lovers";
  const chartA = computeSaju({ ...body.a, ...placeCoords(body.a.place) });
  const chartB = computeSaju({ ...body.b, ...placeCoords(body.b.place) });
  const result = computeCompatibility(chartA, chartB, lang, relationship);

  const payload = {
    profiles: { a: profileOf(body.a), b: profileOf(body.b) },
    relationship,
    charts: { a: chartA, b: chartB },
  };

  let id: string | null = null;
  try {
    const saved = await compatStore.save(payload, result);
    id = saved.id;
  } catch (err) {
    console.error("compat save failed (non-fatal):", err);
  }

  return NextResponse.json({
    id,
    ...payload,
    result,
    disclaimer: DISCLAIMER[lang],
  });
}
