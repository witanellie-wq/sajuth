import { NextRequest, NextResponse } from "next/server";
import { readSession } from "@/lib/session";
import { linkItem, listItems, type ItemKind } from "@/lib/users";

export const dynamic = "force-dynamic";

// GET → my saved results
export async function GET(req: NextRequest) {
  const s = readSession(req);
  if (!s) return NextResponse.json({ user: null, items: [] });
  return NextResponse.json({ user: { name: s.name }, items: await listItems(s.uid) });
}

// POST { kind, id, label } → remember this result for the logged-in user (no-op when logged out)
export async function POST(req: NextRequest) {
  const s = readSession(req);
  if (!s) return NextResponse.json({ ok: false, reason: "logged_out" });
  let b: { kind?: string; id?: string; label?: string };
  try {
    b = await req.json();
  } catch {
    return NextResponse.json({ ok: false }, { status: 400 });
  }
  const kind = b.kind === "compat" ? "compat" : b.kind === "reading" ? "reading" : null;
  if (!kind || !b.id || !/^[0-9a-f-]{36}$/i.test(b.id)) return NextResponse.json({ ok: false }, { status: 400 });
  await linkItem(s.uid, kind as ItemKind, b.id, String(b.label ?? ""));
  return NextResponse.json({ ok: true });
}
