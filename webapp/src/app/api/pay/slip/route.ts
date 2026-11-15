import { NextRequest, NextResponse } from "next/server";
import { store, compatStore, amuletStore } from "@/lib/store";
import { verifySlip, slipEnabled } from "@/lib/slip";

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

  const r = await verifySlip(file, PRICE[kind]);
  if (!r.ok) {
    console.warn("slip rejected:", kind, id, r.reason, r.detail ?? "");
    return NextResponse.json({ ok: false, reason: r.reason });
  }

  const claim = {
    payerName: `slip:${r.transRef}`,
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
