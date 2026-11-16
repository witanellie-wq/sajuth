import { NextRequest, NextResponse } from "next/server";
import { providerConf, siteOrigin, decodeIdToken, signSession, setSessionCookie } from "@/lib/session";
import { upsertUser } from "@/lib/users";

export const dynamic = "force-dynamic";

// GET /api/auth/{provider}/callback?code&state → exchange code, create user, set cookie.
export async function GET(req: NextRequest, { params }: { params: { provider: string } }) {
  const origin = siteOrigin(req);
  const fail = (why: string) => NextResponse.redirect(`${origin}/me?login_error=${why}`);
  const conf = providerConf(params.provider);
  if (!conf) return fail("provider");

  let saved: { state?: string; next?: string } = {};
  try {
    saved = JSON.parse(req.cookies.get("ds_oauth")?.value ?? "{}");
  } catch {
    /* ignore */
  }
  const code = req.nextUrl.searchParams.get("code");
  const state = req.nextUrl.searchParams.get("state");
  if (!code || !state || state !== saved.state) return fail("state");

  const tok = await fetch(conf.tokenUrl, {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "authorization_code",
      code,
      redirect_uri: `${origin}/api/auth/${params.provider}/callback`,
      client_id: conf.clientId,
      client_secret: conf.clientSecret,
    }),
  })
    .then((r) => r.json())
    .catch(() => null);
  if (!tok?.id_token) {
    console.error("oauth token failed", params.provider, JSON.stringify(tok ?? {}).slice(0, 300));
    return fail("token");
  }
  const claims = decodeIdToken(String(tok.id_token));
  const sub = String(claims.sub ?? "");
  if (!sub) return fail("sub");
  const name = String(claims.name ?? claims.email ?? "user").slice(0, 60);
  const user = await upsertUser(
    params.provider,
    sub,
    name,
    claims.picture ? String(claims.picture) : undefined,
    claims.email ? String(claims.email) : undefined
  );
  if (!user) return fail("db");

  const res = NextResponse.redirect(`${origin}${saved.next || "/me"}`);
  setSessionCookie(res, signSession({ uid: user.id, name: user.name, provider: params.provider }));
  res.cookies.set("ds_oauth", "", { path: "/", maxAge: 0 });
  return res;
}
