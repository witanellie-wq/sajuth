import { NextRequest, NextResponse } from "next/server";
import { computeSaju, type SajuInput } from "@/lib/saju";
import { interpret, DISCLAIMER_TH } from "@/lib/interpret";
import { rewriteSections } from "@/lib/rewrite";
import { store } from "@/lib/store";

// POST /api/saju — body: { year, month, day, hour?, minute?, longitude?, rewrite? }
// Computes the chart, interprets it, optionally rewrites free sections with
// Claude, persists the reading, and returns it with a shareable id.
export async function POST(req: NextRequest) {
  let input: SajuInput & { rewrite?: boolean };
  try {
    input = await req.json();
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
  let sections = interpret(chart);
  if (input.rewrite) sections = await rewriteSections(chart, sections);

  const reading = await store.save({
    input: {
      year: input.year,
      month: input.month,
      day: input.day,
      hour: typeof input.hour === "number" ? input.hour : null,
    },
    chart,
    sections,
    paid: false,
  });

  return NextResponse.json({
    id: reading.id,
    chart,
    sections,
    disclaimer: DISCLAIMER_TH,
  });
}
