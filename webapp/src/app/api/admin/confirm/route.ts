import { NextRequest, NextResponse } from "next/server";
import { store, compatStore } from "@/lib/store";

// GET /api/admin/confirm?kind=reading|compat&id=<uuid>&key=<ADMIN_SECRET>
//
// Owner-only: after checking the bank app for the incoming PromptPay credit
// (buyer DMs their slip + reference code), open this URL to mark the record
// paid. The buyer's share page unlocks on next load.
// Disabled entirely unless ADMIN_SECRET is set.
export async function GET(req: NextRequest) {
  const secret = process.env.ADMIN_SECRET;
  const key = req.nextUrl.searchParams.get("key");
  if (!secret || key !== secret) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }

  const id = req.nextUrl.searchParams.get("id");
  const kind = req.nextUrl.searchParams.get("kind") === "compat" ? "compat" : "reading";
  if (!id) return NextResponse.json({ error: "missing_id" }, { status: 400 });

  if (kind === "compat") {
    const rec = await compatStore.get(id);
    if (!rec) return NextResponse.json({ error: "not_found" }, { status: 404 });
    await compatStore.markPaid(id);
  } else {
    const rec = await store.get(id);
    if (!rec) return NextResponse.json({ error: "not_found" }, { status: 404 });
    await store.markPaid(id);
  }

  return NextResponse.json({ ok: true, kind, id, paid: true });
}
