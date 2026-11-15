// Lightweight login session — HMAC-signed cookie, no third-party auth SDK.
// Login is only required at payment time (LINE / Google), so a stateless
// signed cookie is enough: { uid, name, exp }.
import { createHmac, timingSafeEqual } from "crypto";
import type { NextRequest, NextResponse } from "next/server";

export const SESSION_COOKIE = "ds_session";
const MAX_AGE = 60 * 60 * 24 * 180; // 180 days

export interface Session {
  uid: string;
  name: string;
  provider: string;
  exp: number;
}

function secret(): string {
  return process.env.SESSION_SECRET || process.env.SUPABASE_SERVICE_KEY || "dev-secret";
}

function b64(s: string | Buffer): string {
  return Buffer.from(s).toString("base64url");
}

export function signSession(s: Omit<Session, "exp">): string {
  const body = b64(JSON.stringify({ ...s, exp: Math.floor(Date.now() / 1000) + MAX_AGE }));
  const mac = b64(createHmac("sha256", secret()).update(body).digest());
  return `${body}.${mac}`;
}

export function readSession(req: NextRequest): Session | null {
  const raw = req.cookies.get(SESSION_COOKIE)?.value;
  if (!raw) return null;
  const [body, mac] = raw.split(".");
  if (!body || !mac) return null;
  const want = createHmac("sha256", secret()).update(body).digest();
  const got = Buffer.from(mac, "base64url");
  if (got.length !== want.length || !timingSafeEqual(got, want)) return null;
  try {
    const s = JSON.parse(Buffer.from(body, "base64url").toString()) as Session;
    if (!s.uid || s.exp < Math.floor(Date.now() / 1000)) return null;
    return s;
  } catch {
    return null;
  }
}

export function setSessionCookie(res: NextResponse, token: string): void {
  res.cookies.set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    path: "/",
    maxAge: MAX_AGE,
  });
}

export function clearSessionCookie(res: NextResponse): void {
  res.cookies.set(SESSION_COOKIE, "", { httpOnly: true, secure: true, sameSite: "lax", path: "/", maxAge: 0 });
}

// ── OAuth providers ────────────────────────────────────────────────────
export type Provider = "google" | "line";

export interface ProviderConf {
  authUrl: string;
  tokenUrl: string;
  clientId: string;
  clientSecret: string;
  scope: string;
}

export function providerConf(p: string): ProviderConf | null {
  if (p === "google") {
    const id = process.env.GOOGLE_CLIENT_ID, sec = process.env.GOOGLE_CLIENT_SECRET;
    if (!id || !sec) return null;
    return {
      authUrl: "https://accounts.google.com/o/oauth2/v2/auth",
      tokenUrl: "https://oauth2.googleapis.com/token",
      clientId: id,
      clientSecret: sec,
      scope: "openid profile email",
    };
  }
  if (p === "line") {
    const id = process.env.LINE_CHANNEL_ID, sec = process.env.LINE_CHANNEL_SECRET;
    if (!id || !sec) return null;
    return {
      authUrl: "https://access.line.me/oauth2/v2.1/authorize",
      tokenUrl: "https://api.line.me/oauth2/v2.1/token",
      clientId: id,
      clientSecret: sec,
      scope: "openid profile",
    };
  }
  return null;
}

export function enabledProviders(): Provider[] {
  return (["line", "google"] as Provider[]).filter((p) => providerConf(p));
}

export function siteOrigin(req: NextRequest): string {
  return process.env.SITE_URL?.replace(/\/+$/, "") || req.nextUrl.origin;
}

/** Decode an id_token's payload (already obtained server-to-server over TLS
 * from the provider's token endpoint, so signature checking is not needed). */
export function decodeIdToken(idToken: string): Record<string, unknown> {
  const part = idToken.split(".")[1] ?? "";
  return JSON.parse(Buffer.from(part, "base64url").toString());
}
