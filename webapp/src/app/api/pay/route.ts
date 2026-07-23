import { NextRequest, NextResponse } from "next/server";
import QRCode from "qrcode";
import { promptPayPayload } from "@/lib/promptpay";
import { store, compatStore } from "@/lib/store";

const PRICE_READING_THB = Number(process.env.UNLOCK_PRICE_THB ?? 49);
const PRICE_COMPAT_THB = Number(process.env.UNLOCK_COMPAT_PRICE_THB ?? 89);
const PRICE_PACK_THB = Number(process.env.AMULET_PACK_PRICE_THB ?? 79);
const PROMPTPAY_TARGET = process.env.PROMPTPAY_TARGET ?? "0000000000";

type Kind = "reading" | "compat" | "pack";

function priceFor(kind: Kind): number {
  if (kind === "pack") return PRICE_PACK_THB;
  return kind === "compat" ? PRICE_COMPAT_THB : PRICE_READING_THB;
}

// GET /api/pay?kind=reading|compat&id=... → PromptPay QR (data URL) + amount
// + current paid state. With &status=1 returns { paid } only (no QR) — used
// by the client-side unlock poller.
export async function GET(req: NextRequest) {
  const id = req.nextUrl.searchParams.get("id");
  const kind = (req.nextUrl.searchParams.get("kind") ?? "reading") as Kind;

  let paid = false;
  if (id) {
    const rec = kind === "compat" ? await compatStore.get(id) : await store.get(id);
    if (!rec) return NextResponse.json({ error: "not_found" }, { status: 404 });
    paid = rec.paid;
  }

  if (req.nextUrl.searchParams.get("status")) {
    return NextResponse.json({ id, kind, paid });
  }

  const amount = priceFor(kind);
  const payload = promptPayPayload(PROMPTPAY_TARGET, amount);
  const qr = await QRCode.toDataURL(payload, { margin: 1, width: 320 });
  return NextResponse.json({ id, kind, amount, qr, paid });
}

// POST /api/pay  body: { id, kind?, payerName, contact } — payment CLAIM only.
// Records who transferred (bank sender name) and where to send the result
// (email / LINE / IG). Does NOT unlock: the owner matches the bank credit in
// the admin dashboard (/admin) and confirms; share pages then render open.
export async function POST(req: NextRequest) {
  let body: { id?: string; kind?: Kind; payerName?: string; contact?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }
  if (!body.id) return NextResponse.json({ error: "missing_id" }, { status: 400 });
  // Keep friction minimal: only the bank sender name is required (needed to
  // match the credit); email is optional.
  const payerName = (body.payerName ?? "").trim().slice(0, 60);
  const contact = (body.contact ?? "").trim().slice(0, 120);
  if (!payerName) {
    return NextResponse.json({ error: "missing_payer_name" }, { status: 400 });
  }
  const kind: Kind = body.kind === "compat" ? "compat" : "reading";

  const rec =
    kind === "compat" ? await compatStore.get(body.id) : await store.get(body.id);
  if (!rec) return NextResponse.json({ error: "not_found" }, { status: 404 });

  const claim = { payerName, contact, claimedAt: new Date().toISOString() };
  try {
    if (kind === "compat") await compatStore.saveClaim(body.id, claim);
    else await store.saveClaim(body.id, claim);
  } catch (err) {
    console.error("claim save failed:", err);
  }

  return NextResponse.json({
    id: body.id,
    kind,
    pending: !rec.paid,
    paid: rec.paid,
    ref: body.id, // reference the buyer can quote in DM
  });
}
