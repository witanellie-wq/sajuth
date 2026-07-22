import { NextRequest, NextResponse } from "next/server";
import QRCode from "qrcode";
import { promptPayPayload } from "@/lib/promptpay";
import { store, compatStore } from "@/lib/store";

const PRICE_READING_THB = Number(process.env.UNLOCK_PRICE_THB ?? 49);
const PRICE_COMPAT_THB = Number(process.env.UNLOCK_COMPAT_PRICE_THB ?? 89);
const PROMPTPAY_TARGET = process.env.PROMPTPAY_TARGET ?? "0000000000";

type Kind = "reading" | "compat";

function priceFor(kind: Kind): number {
  return kind === "compat" ? PRICE_COMPAT_THB : PRICE_READING_THB;
}

// GET /api/pay?kind=reading|compat&id=... → PromptPay QR (data URL) + amount
// + current paid state.
export async function GET(req: NextRequest) {
  const id = req.nextUrl.searchParams.get("id");
  const kind = (req.nextUrl.searchParams.get("kind") ?? "reading") as Kind;

  let paid = false;
  if (id) {
    const rec = kind === "compat" ? await compatStore.get(id) : await store.get(id);
    if (!rec) return NextResponse.json({ error: "not_found" }, { status: 404 });
    paid = rec.paid;
  }

  const amount = priceFor(kind);
  const payload = promptPayPayload(PROMPTPAY_TARGET, amount);
  const qr = await QRCode.toDataURL(payload, { margin: 1, width: 320 });
  return NextResponse.json({ id, kind, amount, qr, paid });
}

// POST /api/pay  body: { id, kind? } — payment CLAIM only. This does NOT
// unlock anything: the buyer reports the transfer, gets a reference code, and
// the owner verifies the bank credit then confirms via /api/admin/confirm.
// Unlock happens server-side on the share pages once paid=true.
export async function POST(req: NextRequest) {
  let body: { id?: string; kind?: Kind };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }
  if (!body.id) return NextResponse.json({ error: "missing_id" }, { status: 400 });
  const kind: Kind = body.kind === "compat" ? "compat" : "reading";

  const rec =
    kind === "compat" ? await compatStore.get(body.id) : await store.get(body.id);
  if (!rec) return NextResponse.json({ error: "not_found" }, { status: 404 });

  return NextResponse.json({
    id: body.id,
    kind,
    pending: !rec.paid,
    paid: rec.paid,
    ref: body.id, // reference the buyer sends with their transfer slip
  });
}
