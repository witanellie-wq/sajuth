import { NextRequest, NextResponse } from "next/server";
import QRCode from "qrcode";
import { promptPayPayload } from "@/lib/promptpay";
import { store } from "@/lib/store";
import { unlock } from "@/lib/interpret";

const PRICE_THB = Number(process.env.UNLOCK_PRICE_THB ?? 59);
const PROMPTPAY_TARGET = process.env.PROMPTPAY_TARGET ?? "0000000000";

// GET /api/pay?id=... → PromptPay QR (data URL) + amount for a reading.
export async function GET(req: NextRequest) {
  const id = req.nextUrl.searchParams.get("id");
  if (!id) return NextResponse.json({ error: "missing_id" }, { status: 400 });
  const reading = await store.get(id);
  if (!reading) return NextResponse.json({ error: "not_found" }, { status: 404 });

  const payload = promptPayPayload(PROMPTPAY_TARGET, PRICE_THB);
  const qr = await QRCode.toDataURL(payload, { margin: 1, width: 320 });
  return NextResponse.json({ id, amount: PRICE_THB, qr, paid: reading.paid });
}

// POST /api/pay  body: { id }  → Phase-0 MANUAL confirm: marks paid + unlocks.
// In Phase 1 this becomes a webhook from Omise/GB Prime Pay instead of trust.
export async function POST(req: NextRequest) {
  let body: { id?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }
  if (!body.id) return NextResponse.json({ error: "missing_id" }, { status: 400 });

  const reading = await store.get(body.id);
  if (!reading) return NextResponse.json({ error: "not_found" }, { status: 404 });

  await store.markPaid(body.id);
  const unlocked = unlock(reading.sections, reading.chart.dayMasterElement);
  return NextResponse.json({ id: body.id, paid: true, sections: unlocked });
}
