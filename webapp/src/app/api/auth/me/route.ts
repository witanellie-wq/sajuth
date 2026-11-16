import { NextRequest, NextResponse } from "next/server";
import { readSession, enabledProviders, clearSessionCookie } from "@/lib/session";

export const dynamic = "force-dynamic";

// GET → { user | null, providers }   (providers = which login buttons to show)
export async function GET(req: NextRequest) {
  const s = readSession(req);
  return NextResponse.json({
    user: s ? { id: s.uid, name: s.name, provider: s.provider } : null,
    providers: enabledProviders(),
  });
}

// POST → logout
export async function POST() {
  const res = NextResponse.json({ ok: true });
  clearSessionCookie(res);
  return res;
}
