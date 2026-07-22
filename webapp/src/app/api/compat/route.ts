import { NextRequest, NextResponse } from "next/server";
import { computeSaju, type SajuInput } from "@/lib/saju";
import { computeCompatibility } from "@/lib/compat";
import { compatStore } from "@/lib/store";
import { DISCLAIMER, pickLang } from "@/lib/i18n";

interface Body {
  a: SajuInput;
  b: SajuInput;
  lang?: string;
}

function valid(i: SajuInput | undefined): boolean {
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

// POST /api/compat — body: { a, b, lang? } → compatibility result (persisted
// when storage is available; save failure is non-fatal, id comes back null).
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
  const charts = {
    a: { dayMaster: chartA.dayMaster, day: chartA.day },
    b: { dayMaster: chartB.dayMaster, day: chartB.day },
  };

  let id: string | null = null;
  try {
    const saved = await compatStore.save(charts, result);
    id = saved.id;
  } catch (err) {
    console.error("compat save failed (non-fatal):", err);
  }

  return NextResponse.json({ id, result, charts, disclaimer: DISCLAIMER[lang] });
}
