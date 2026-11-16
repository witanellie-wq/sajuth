// Users + "내 기록" (items a logged-in user has created or paid for).
// Tables: see supabase/login_chat.sql
import { normalizeSupabaseUrl } from "./store";

let sb: unknown;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function db(): any {
  if (sb !== undefined) return sb;
  const url = process.env.SUPABASE_URL ? normalizeSupabaseUrl(process.env.SUPABASE_URL) : "";
  const key = process.env.SUPABASE_SERVICE_KEY;
  if (!url || !key) return (sb = null);
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const { createClient } = require("@supabase/supabase-js");
  sb = createClient(url, key, {
    auth: { persistSession: false },
    global: { fetch: (i: RequestInfo | URL, init?: RequestInit) => fetch(i, { ...init, cache: "no-store" }) },
  });
  return sb;
}

export interface AppUser {
  id: string;
  provider: string;
  name: string;
  picture?: string | null;
}

export async function upsertUser(provider: string, sub: string, name: string, picture?: string, email?: string): Promise<AppUser | null> {
  const c = db();
  if (!c) return null;
  const { data, error } = await c
    .from("app_users")
    .upsert(
      { provider, provider_sub: sub, name, picture: picture ?? null, email: email ?? null, last_login_at: new Date().toISOString() },
      { onConflict: "provider,provider_sub" }
    )
    .select("id, provider, name, picture")
    .single();
  if (error) {
    console.error("upsertUser:", error.message);
    return null;
  }
  return data as AppUser;
}

export type ItemKind = "reading" | "compat";

export async function linkItem(uid: string, kind: ItemKind, itemId: string, label: string): Promise<void> {
  const c = db();
  if (!c) return;
  const { error } = await c
    .from("user_items")
    .upsert({ user_id: uid, kind, item_id: itemId, label: label.slice(0, 120) }, { onConflict: "user_id,kind,item_id" });
  if (error) console.error("linkItem:", error.message);
}

export async function listItems(uid: string): Promise<Array<{ kind: ItemKind; item_id: string; label: string; created_at: string }>> {
  const c = db();
  if (!c) return [];
  const { data, error } = await c
    .from("user_items")
    .select("kind, item_id, label, created_at")
    .eq("user_id", uid)
    .order("created_at", { ascending: false })
    .limit(100);
  if (error) {
    console.error("listItems:", error.message);
    return [];
  }
  return data ?? [];
}
