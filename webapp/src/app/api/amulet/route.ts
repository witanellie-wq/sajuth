import { NextRequest, NextResponse } from "next/server";
import { amuletStore, store, compatStore } from "@/lib/store";
import { generateLongCompat } from "@/lib/unlockCompat";

// Long-form report generation on redeem can take a while.
export const maxDuration = 60;

// Amulet (ยันต์/부적) pack: 3 credits for AMULET_PACK_PRICE_THB.
// Reading unlock costs 1 amulet, compat costs 2.

const AMULET_COSTS = { reading: 1, compat: 2 } as const;

// GET /api/amulet?code=XXXX → { paid, balance } (status check).
export async function GET(req: NextRequest) {
  const code = (req.nextUrl.searchParams.get("code") ?? "").toUpperCase().trim();
  if (!code) return NextResponse.json({ error: "missing_code" }, { status: 400 });
  const rec = await amuletStore.get(code);
  if (!rec) return NextResponse.json({ error: "not_found" }, { status: 404 });
  return NextResponse.json({ code: rec.code, paid: rec.paid, balance: rec.balance });
}

// POST /api/amulet — two actions:
//   { action: "buy", payerName, contact? }        → creates a pending pack,
//     returns its code (inert until the owner confirms the transfer).
//   { action: "redeem", code, id, kind }          → spends 1 (reading) or 2
//     (compat) amulets and marks the target paid → share page unlocks.
export async function POST(req: NextRequest) {
  let body: {
    action?: string;
    payerName?: string;
    contact?: string;
    code?: string;
    id?: string;
    kind?: string;
  };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }

  if (body.action === "buy") {
    const payerName = (body.payerName ?? "").trim().slice(0, 60);
    const contact = (body.contact ?? "").trim().slice(0, 120);
    if (!payerName) {
      return NextResponse.json({ error: "missing_payer_name" }, { status: 400 });
    }
    try {
      const rec = await amuletStore.create(payerName, contact);
      return NextResponse.json({ code: rec.code, balance: rec.balance, paid: false });
    } catch (err) {
      console.error("amulet create failed:", err);
      return NextResponse.json({ error: "storage_unavailable" }, { status: 503 });
    }
  }

  if (body.action === "redeem") {
    const code = (body.code ?? "").toUpperCase().trim();
    const kind = body.kind === "compat" ? "compat" : "reading";
    if (!code || !body.id) {
      return NextResponse.json({ error: "missing_params" }, { status: 400 });
    }
    const target =
      kind === "compat" ? await compatStore.get(body.id) : await store.get(body.id);
    if (!target) return NextResponse.json({ error: "not_found" }, { status: 404 });
    if (target.paid) {
      return NextResponse.json({ ok: true, alreadyPaid: true });
    }

    const remaining = await amuletStore.redeem(code, AMULET_COSTS[kind]);
    if (remaining === null) {
      return NextResponse.json({ error: "amulet_invalid_or_insufficient" }, { status: 400 });
    }
    if (kind === "compat") {
      await compatStore.markPaid(body.id);
      await generateLongCompat(body.id, target as never);
    } else {
      await store.markPaid(body.id);
    }

    return NextResponse.json({ ok: true, balance: remaining });
  }

  return NextResponse.json({ error: "unknown_action" }, { status: 400 });
}
