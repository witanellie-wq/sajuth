import { NextRequest, NextResponse } from "next/server";
import { computeSaju, type SajuInput } from "@/lib/saju";
import { computeCompatibility } from "@/lib/compat";
import { compatStore } from "@/lib/store";
import { DISCLAIMER, pickLang } from "@/lib/i18n";

interface PersonInput extends SajuInput {
  name?: string;
  gender?: string; // "F" | "M" | ""
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
  const chartA = computeSaju(body.a);
  const chartB = computeSaju(body.b);
  const result = computeCompatibility(chartA, chartB, lang);

  const payload = {
    profiles: { a: profileOf(body.a), b: profileOf(body.b) },
    relationship: typeof body.relationship === "string" ? body.relationship : "",
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
