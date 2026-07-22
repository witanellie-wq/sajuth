import { NextResponse } from "next/server";

// GET /api/health — storage diagnostics. Open this in a browser to see exactly
// why persistence is failing (missing env, bad key, missing table, ...).
// Safe to expose: reports error messages only, never keys.
export const dynamic = "force-dynamic";

export async function GET() {
  const url = process.env.SUPABASE_URL ?? "";
  const key = process.env.SUPABASE_SERVICE_KEY ?? "";

  const env = {
    SUPABASE_URL: url ? `set (${url.slice(0, 30)}…)` : "NOT SET",
    SUPABASE_SERVICE_KEY: key
      ? `set (${key.slice(0, 10)}…, ${key.length} chars)`
      : "NOT SET",
    ANTHROPIC_API_KEY: process.env.ANTHROPIC_API_KEY ? "set" : "NOT SET",
    PROMPTPAY_TARGET: process.env.PROMPTPAY_TARGET ? "set" : "NOT SET (QR uses dummy)",
    ADMIN_SECRET: process.env.ADMIN_SECRET ? "set" : "NOT SET (admin disabled)",
  };

  const tables: Record<string, string> = {};
  let writeTest = "skipped (no supabase env)";
  if (url && key) {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const { createClient } = require("@supabase/supabase-js");
    const sb = createClient(url, key, { auth: { persistSession: false } });
    for (const t of ["readings", "compat_readings", "amulets"]) {
      try {
        const { error, count } = await sb
          .from(t)
          .select("*", { count: "exact", head: true });
        tables[t] = error ? `ERROR: ${error.message}` : `ok (${count ?? 0} rows)`;
      } catch (err) {
        tables[t] = `ERROR: ${err instanceof Error ? err.message : String(err)}`;
      }
    }

    // Real INSERT probe — reads can succeed while writes fail (RLS, grants…).
    try {
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const { randomUUID } = require("crypto");
      const probeId = randomUUID();
      const { error: insErr } = await sb.from("readings").insert({
        id: probeId,
        created_at: new Date().toISOString(),
        input: { probe: true },
        chart: {},
        sections: [],
        paid: false,
      });
      if (insErr) {
        writeTest = `INSERT ERROR: ${insErr.message}`;
      } else {
        await sb.from("readings").delete().eq("id", probeId);
        writeTest = "ok — inserts work ✅";
      }
    } catch (err) {
      writeTest = `INSERT ERROR: ${err instanceof Error ? err.message : String(err)}`;
    }
  } else {
    tables.note = "supabase env missing → in-memory fallback (share links & payments won't persist)";
  }

  return NextResponse.json({ env, tables, writeTest });
}
