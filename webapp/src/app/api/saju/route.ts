import { NextRequest, NextResponse } from "next/server";
import { computeSaju, type SajuInput } from "@/lib/saju";
import { interpret, DISCLAIMER_TH } from "@/lib/interpret";

// POST /api/saju — body: { year, month, day, hour?, minute?, longitude? }
// Returns the chart + interpreted sections. Free sections come through in full;
// locked sections are returned with a paywall flag for the client to blur.
export async function POST(req: NextRequest) {
  let input: SajuInput;
  try {
    input = (await req.json()) as SajuInput;
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }

  if (
    typeof input.year !== "number" ||
    typeof input.month !== "number" ||
    typeof input.day !== "number" ||
    input.year < 1900 ||
    input.year > 2100 ||
    input.month < 1 ||
    input.month > 12 ||
    input.day < 1 ||
    input.day > 31
  ) {
    return NextResponse.json({ error: "invalid_date" }, { status: 400 });
  }

  const chart = computeSaju(input);
  const sections = interpret(chart);

  return NextResponse.json({
    chart: {
      year: chart.year,
      month: chart.month,
      day: chart.day,
      hour: chart.hour,
      dayMaster: chart.dayMaster,
      dayMasterElement: chart.dayMasterElement,
      elementCounts: chart.elementCounts,
      trueSolarCorrectionMin: chart.trueSolarCorrectionMin,
    },
    sections,
    disclaimer: DISCLAIMER_TH,
  });
}
