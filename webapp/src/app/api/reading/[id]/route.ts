import { NextRequest, NextResponse } from "next/server";
import { store } from "@/lib/store";
import { DISCLAIMER_TH, unlock } from "@/lib/interpret";

// GET /api/reading/:id → a stored reading (for shareable /result/:id links).
// Premium sections are revealed only if the reading is paid.
export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const reading = await store.get(params.id);
  if (!reading) return NextResponse.json({ error: "not_found" }, { status: 404 });

  const sections = reading.paid
    ? unlock(reading.sections, reading.chart.dayMaster)
    : reading.sections;

  return NextResponse.json({
    id: reading.id,
    chart: reading.chart,
    sections,
    paid: reading.paid,
    disclaimer: DISCLAIMER_TH,
  });
}
