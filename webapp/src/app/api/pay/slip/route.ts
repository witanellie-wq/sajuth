import { NextRequest, NextResponse } from "next/server";
import { store, compatStore, amuletStore } from "@/lib/store";
import { verifySlip, slipEnabled } from "@/lib/slip";
import { readSlip } from "@/lib/slipOcr";

// 이미 쓴 거래번호인지 (QR 없는 슬립용 중복 방지).
async function refUsed(ref: string): Promise<boolean> {
  try {
    const { createClient } = require("@supabase/supabase-js");
    const url = (process.env.SUPABASE_URL ?? "").replace(/\/rest\/v1\/?$/, "").replace(/\/+$/, "");
    const key = process.env.SUPABASE_SERVICE_KEY;
    if (!url || !key) return false;
    const sb = createClient(url, key, { auth: { persistSession: false } });
    const a = await sb.from("readings").select("id").eq("input->claim->>payerName", ref).limit(1);
    const b = await sb.from("compat_readings").select("id").eq("charts->claim->>payerName", ref).limit(1);
    const c = await sb.from("amulets").select("code").eq("payer_name", ref).limit(1);
    return [a, b, c].some((r: { data?: unknown[] }) => (r.data ?? []).length > 0);
  } catch {
    return false;
  }
}

export const dynamic = "force-dynamic";

const PRICE: Record<string, number> = {
  reading: Number(process.env.UNLOCK_PRICE_THB ?? 49),
  compat: Number(process.env.UNLOCK_COMPAT_PRICE_THB ?? 89),
  pack: Number(process.env.AMULET_PACK_PRICE_THB ?? 129),
};

// GET /api/pay/slip → { enabled } (lets the UI show the upload button)
export async function GET() {
  return NextResponse.json({ enabled: slipEnabled() });
}

// POST /api/pay/slip  multipart: file, kind (reading|compat|pack), id?
// Verifies the transfer slip and unlocks instantly on success.
export async function POST(req: NextRequest) {
  let form: FormData;
  try {
    form = await req.formData();
  } catch {
    return NextResponse.json({ ok: false, reason: "bad_request" }, { status: 400 });
  }
  const file = form.get("file");
  const kind = String(form.get("kind") ?? "reading");
  const id = String(form.get("id") ?? "");
  if (!(file instanceof Blob) || !PRICE[kind]) {
    return NextResponse.json({ ok: false, reason: "bad_request" }, { status: 400 });
  }
  if (file.size > 6 * 1024 * 1024) {
    return NextResponse.json({ ok: false, reason: "too_big" }, { status: 400 });
  }
  if (kind !== "pack") {
    const rec = kind === "compat" ? await compatStore.get(id) : await store.get(id);
    if (!rec) return NextResponse.json({ ok: false, reason: "not_found_record" }, { status: 404 });
    if (rec.paid) return NextResponse.json({ ok: true, alreadyPaid: true });
  }

  let ref: string;
  const r = await verifySlip(file, PRICE[kind]);
  if (r.ok) {
    ref = `slip:${r.transRef}`;
  } else if (r.reason === "not_slip") {
    // QR이 없는 슬립 (K BIZ 등) → 글자 인식으로 보조 확인
    const o = await readSlip(file).catch(() => null);
    const target = (process.env.PROMPTPAY_TARGET ?? "").replace(/[^0-9]/g, "");
    const acct = String(o?.receiverAccount ?? "").replace(/[^0-9]/g, "");
    const when = o?.datetime ? Date.parse(o.datetime) : NaN;
    const reason = !o || !o.isBankSlip
      ? "not_slip"
      : !(Number(o.amount) + 0.001 >= PRICE[kind])
      ? "amount"
      : !(acct.length >= 3 && target.endsWith(acct.slice(-4)))
      ? "receiver"
      : !Number.isFinite(when) || Date.now() - when > 48 * 3600_000 || when - Date.now() > 3600_000
      ? "too_old"
      : !o.transactionNo
      ? "not_slip"
      : null;
    if (reason) {
      console.warn("ocr slip rejected:", kind, id, reason, JSON.stringify(o));
      return NextResponse.json({ ok: false, reason });
    }
    ref = `ocr:${String(o!.transactionNo).replace(/\s+/g, "")}`;
    if (await refUsed(ref)) return NextResponse.json({ ok: false, reason: "duplicate" });
  } else {
    console.warn("slip rejected:", kind, id, r.reason, r.detail ?? "");
    return NextResponse.json({ ok: false, reason: r.reason });
  }

  const claim = {
    payerName: ref,
    contact: "",
    claimedAt: new Date().toISOString(),
  };
  if (kind === "pack") {
    const pack = await amuletStore.create(claim.payerName, "");
    await amuletStore.markPaid(pack.code);
    return NextResponse.json({ ok: true, code: pack.code });
  }
  if (kind === "compat") {
    await compatStore.saveClaim(id, claim).catch(() => {});
    await compatStore.markPaid(id);
  } else {
    await store.saveClaim(id, claim).catch(() => {});
    await store.markPaid(id);
  }
  return NextResponse.json({ ok: true });
}
