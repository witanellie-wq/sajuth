import { NextRequest, NextResponse } from "next/server";
import { computeSaju, type SajuInput } from "@/lib/saju";
import { computeCompatibility } from "@/lib/compat";
import { DISCLAIMER_TH } from "@/lib/interpret";

interface Body {
  a: SajuInput;
  b: SajuInput;
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
    i.day <= 31
  );
}

// POST /api/compat — body: { a: SajuInput, b: SajuInput } → compatibility result.
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

  const chartA = computeSaju(body.a);
  const chartB = computeSaju(body.b);
  const result = computeCompatibility(chartA, chartB);

  return NextResponse.json({
    result,
    charts: {
      a: { dayMaster: chartA.dayMaster, day: chartA.day },
      b: { dayMaster: chartB.dayMaster, day: chartB.day },
    },
    disclaimer: DISCLAIMER_TH,
  });
}
