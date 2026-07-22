import { NextRequest, NextResponse } from "next/server";
import QRCode from "qrcode";
import { promptPayPayload } from "@/lib/promptpay";
import { store, compatStore } from "@/lib/store";
import { unlock, type ReportSection } from "@/lib/interpret";
import { unlockCompat, type Compatibility, type CompatSection } from "@/lib/compat";
import { pickLang } from "@/lib/i18n";

const PRICE_READING_THB = Number(process.env.UNLOCK_PRICE_THB ?? 59);
const PRICE_COMPAT_THB = Number(process.env.UNLOCK_COMPAT_PRICE_THB ?? 89);
const PROMPTPAY_TARGET = process.env.PROMPTPAY_TARGET ?? "0000000000";

type Kind = "reading" | "compat";

function priceFor(kind: Kind): number {
  return kind === "compat" ? PRICE_COMPAT_THB : PRICE_READING_THB;
}

// GET /api/pay?kind=reading|compat[&id=...] → PromptPay QR (data URL) + amount.
// id is optional: without persistence the QR still works (stateless Phase-0).
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

// POST /api/pay — Phase-0 MANUAL confirm (Phase 1: replaced by a PG webhook).
// Stateful:  { id, kind? }                       → marks paid, returns unlocked sections.
// Stateless: { kind, lang, dayMaster, sections } (reading)
//            { kind, lang, rel, sections }       (compat)
//   → unlocks the provided sections without persistence (used when storage is
//   unavailable — the buyer keeps the result on-screen).
export async function POST(req: NextRequest) {
  let body: {
    id?: string;
    kind?: Kind;
    lang?: string;
    dayMaster?: string;
    rel?: string;
    sections?: unknown[];
  };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }
  const kind: Kind = body.kind === "compat" ? "compat" : "reading";

  // ── Stateless path ──
  if (!body.id) {
    if (!Array.isArray(body.sections)) {
      return NextResponse.json({ error: "missing_sections" }, { status: 400 });
    }
    const lang = pickLang(body.lang);
    if (kind === "compat") {
      const sections = unlockCompat(
        body.sections as CompatSection[],
        body.rel ?? "same",
        lang
      );
      return NextResponse.json({ id: null, kind, paid: true, sections });
    }
    if (!body.dayMaster) {
      return NextResponse.json({ error: "missing_day_master" }, { status: 400 });
    }
    const sections = unlock(body.sections as ReportSection[], body.dayMaster, lang);
    return NextResponse.json({ id: null, kind, paid: true, sections });
  }

  // ── Stateful path ──
  if (kind === "compat") {
    const rec = await compatStore.get(body.id);
    if (!rec) return NextResponse.json({ error: "not_found" }, { status: 404 });
    await compatStore.markPaid(body.id);
    const result = rec.result as Compatibility;
    const sections = unlockCompat(result.sections, result.rel, pickLang(result.lang));
    return NextResponse.json({ id: body.id, kind, paid: true, sections });
  }

  const reading = await store.get(body.id);
  if (!reading) return NextResponse.json({ error: "not_found" }, { status: 404 });
  await store.markPaid(body.id);
  const lang = pickLang(reading.input.lang);
  const unlocked = unlock(reading.sections, reading.chart.dayMaster, lang);
  return NextResponse.json({ id: body.id, kind, paid: true, sections: unlocked });
}
