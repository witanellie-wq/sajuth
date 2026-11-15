import { NextRequest, NextResponse } from "next/server";
import { randomBytes } from "crypto";
import { providerConf, siteOrigin } from "@/lib/session";

export const dynamic = "force-dynamic";

// GET /api/auth/{line|google}/start?next=/result/xxx → provider login page.
export async function GET(req: NextRequest, { params }: { params: { provider: string } }) {
  const conf = providerConf(params.provider);
  if (!conf) return NextResponse.json({ error: "provider_disabled" }, { status: 404 });
  const next = req.nextUrl.searchParams.get("next") || "/me";
  const safeNext = next.startsWith("/") && !next.startsWith("//") ? next : "/me";
  const state = randomBytes(16).toString("hex");
  const u = new URL(conf.authUrl);
  u.searchParams.set("response_type", "code");
  u.searchParams.set("client_id", conf.clientId);
  u.searchParams.set("redirect_uri", `${siteOrigin(req)}/api/auth/${params.provider}/callback`);
  u.searchParams.set("scope", conf.scope);
  u.searchParams.set("state", state);
  if (params.provider === "google") u.searchParams.set("prompt", "select_account");
  const res = NextResponse.redirect(u.toString());
  res.cookies.set("ds_oauth", JSON.stringify({ state, next: safeNext }), {
    httpOnly: true, secure: true, sameSite: "lax", path: "/", maxAge: 600,
  });
  return res;
}
