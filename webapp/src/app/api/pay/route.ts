import { NextRequest, NextResponse } from "next/server";
import QRCode from "qrcode";
import { promptPayPayload } from "@/lib/promptpay";
import { store, compatStore } from "@/lib/store";
import { unlock } from "@/lib/interpret";
import { unlockCompat, type Compatibility } from "@/lib/compat";

const PRICE_READING_THB = Number(process.env.UNLOCK_PRICE_THB ?? 59);
const PRICE_COMPAT_THB = Number(process.env.UNLOCK_COMPAT_PRICE_THB ?? 89);
const PROMPTPAY_TARGET = process.env.PROMPTPAY_TARGET ?? "0000000000";

type Kind = "reading" | "compat";

function priceFor(kind: Kind): number {
  return kind === "compat" ? PRICE_COMPAT_THB : PRICE_READING_THB;
}

// GET /api/pay?id=...&kind=reading|compat → PromptPay QR (data URL) + amount.
export async function GET(req: NextRequest) {
  const id = req.nextUrl.searchParams.get("id");
  const kind = (req.nextUrl.searchParams.get("kind") ?? "reading") as Kind;
  if (!id) return NextResponse.json({ error: "missing_id" }, { status: 400 });

  const rec = kind === "compat" ? await compatStore.get(id) : await store.get(id);
  if (!rec) return NextResponse.json({ error: "not_found" }, { status: 404 });

  const amount = priceFor(kind);
  const payload = promptPayPayload(PROMPTPAY_TARGET, amount);
  const qr = await QRCode.toDataURL(payload, { margin: 1, width: 320 });
  return NextResponse.json({ id, kind, amount, qr, paid: rec.paid });
}

// POST /api/pay  body: { id, kind? }  → Phase-0 MANUAL confirm: marks paid +
// returns unlocked sections. Phase 1: replace with an Omise/GB Prime webhook.
export async function POST(req: NextRequest) {
  let body: { id?: string; kind?: Kind };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }
  if (!body.id) return NextResponse.json({ error: "missing_id" }, { status: 400 });
  const kind: Kind = body.kind === "compat" ? "compat" : "reading";

  if (kind === "compat") {
    const rec = await compatStore.get(body.id);
    if (!rec) return NextResponse.json({ error: "not_found" }, { status: 404 });
    await compatStore.markPaid(body.id);
    const result = rec.result as Compatibility;
    const sections = unlockCompat(result.sections, result.rel);
    return NextResponse.json({ id: body.id, kind, paid: true, sections });
  }

  const reading = await store.get(body.id);
  if (!reading) return NextResponse.json({ error: "not_found" }, { status: 404 });
  await store.markPaid(body.id);
  const unlocked = unlock(reading.sections, reading.chart.dayMaster);
  return NextResponse.json({ id: body.id, kind, paid: true, sections: unlocked });
}
