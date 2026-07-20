import { NextRequest, NextResponse } from "next/server";
import { store } from "@/lib/store";
import { DISCLAIMER_TH, unlock } from "@/lib/interpret";
import { todayFortune } from "@/lib/today";

// GET /api/reading/:id → a stored reading (for shareable /result/:id links).
// Premium sections are revealed only if the reading is paid.
export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const reading = await store.get(params.id);
  if (!reading) return NextResponse.json({ error: "not_found" }, { status: 404 });

  let sections = reading.paid
    ? unlock(reading.sections, reading.chart.dayMaster)
    : reading.sections;

  // Refresh the daily fortune so a stored reading stays alive day to day.
  const today = todayFortune(reading.chart);
  sections = sections.map((s) =>
    s.key === "today"
      ? { ...s, title: `ดวงวันนี้ · ${today.title}`, body: today.body }
      : s
  );

  return NextResponse.json({
    id: reading.id,
    chart: reading.chart,
    sections,
    paid: reading.paid,
    disclaimer: DISCLAIMER_TH,
  });
}
