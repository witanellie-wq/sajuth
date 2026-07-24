import { NextRequest, NextResponse } from "next/server";
import { store, compatStore, amuletStore } from "@/lib/store";

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

  // Accept a bare id/code OR a pasted result URL — extract the last segment.
  let id = (req.nextUrl.searchParams.get("id") ?? "").trim();
  if (id.includes("/")) id = id.split("/").filter(Boolean).pop() ?? "";
  id = id.split("?")[0].trim();
  const kindParam = req.nextUrl.searchParams.get("kind");
  const kind =
    kindParam === "compat" ? "compat" : kindParam === "pack" ? "pack" : "reading";
  if (!id) return NextResponse.json({ error: "missing_id" }, { status: 400 });

  if (kind === "pack") {
    const rec = await amuletStore.get(id.toUpperCase());
    if (!rec) return NextResponse.json({ error: "not_found" }, { status: 404 });
    await amuletStore.markPaid(rec.code);
  } else if (kind === "compat") {
    const rec = await compatStore.get(id);
    if (!rec) return NextResponse.json({ error: "not_found" }, { status: 404 });
    await compatStore.markPaid(id);
    // Long-form generation happens on the buyer's page (client-orchestrated,
    // one category per call, with a progress bar) — never here, where a
    // partial batch could be saved as a 6-section report.
  } else {
    const rec = await store.get(id);
    if (!rec) return NextResponse.json({ error: "not_found" }, { status: 404 });
    await store.markPaid(id);
  }

  // From the /admin dashboard → bounce back with a success flag.
  if (req.nextUrl.searchParams.get("redirect")) {
    const back = new URL("/admin", req.nextUrl.origin);
    back.searchParams.set("key", key!);
    back.searchParams.set("ok", "1");
    return NextResponse.redirect(back);
  }

  return NextResponse.json({ ok: true, kind, id, paid: true });
}
