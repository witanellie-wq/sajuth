// Reading persistence — powers shareable /result/:id links (the viral loop
// that carried 사주아이 on Threads).
//
// Uses Supabase when SUPABASE_URL + SUPABASE_SERVICE_KEY are set; otherwise
// falls back to an in-process Map so `npm run dev` works with zero config.
// NOTE: the in-memory fallback does NOT persist across serverless invocations
// or restarts — set up Supabase before relying on share links in production.

import { randomUUID, randomBytes } from "crypto";
import type { SajuChart } from "./saju";
import type { ReportSection } from "./interpret";

export interface Claim {
  payerName: string; // 입금자명 shown on the bank transfer
  contact: string; // email / LINE / IG — where to send the result
  claimedAt: string;
}

export interface StoredReading {
  id: string;
  createdAt: string;
  input: {
    year: number;
    month: number;
    day: number;
    hour: number | null;
    lang?: string;
    name?: string;
    gender?: string;
  };
  chart: SajuChart;
  sections: ReportSection[];
  paid: boolean;
  claim?: Claim | null;
}

interface Store {
  save(r: Omit<StoredReading, "id" | "createdAt">): Promise<StoredReading>;
  get(id: string): Promise<StoredReading | null>;
  markPaid(id: string): Promise<void>;
  saveClaim(id: string, claim: Claim): Promise<void>;
  listPending(): Promise<StoredReading[]>;
  listApproved(): Promise<StoredReading[]>;
}

export interface StoredCompat {
  id: string;
  createdAt: string;
  charts: unknown; // { profiles, relationship, charts:{a,b} }
  result: unknown; // Compatibility
  paid: boolean;
  claim?: Claim | null;
}

const mem = new Map<string, StoredReading>();
const memCompat = new Map<string, StoredCompat>();

// Compat results are share-only snapshots; the in-memory fallback mirrors the
// readings store. Supabase table: compat_readings(id uuid pk, created_at,
// charts jsonb, result jsonb).
export const compatStore = {
  async save(charts: unknown, result: unknown): Promise<StoredCompat> {
    const rec: StoredCompat = {
      id: randomUUID(),
      createdAt: new Date().toISOString(),
      charts,
      result,
      paid: false,
    };
    const sb = getSupabase();
    if (sb) {
      const { error } = await sb.from("compat_readings").insert({
        id: rec.id,
        created_at: rec.createdAt,
        charts: rec.charts,
        result: rec.result,
        paid: rec.paid,
      });
      if (error) throw new Error(`supabase insert: ${error.message}`);
    } else {
      memCompat.set(rec.id, rec);
    }
    return rec;
  },
  async get(id: string): Promise<StoredCompat | null> {
    const sb = getSupabase();
    if (sb) {
      const { data, error } = await sb
        .from("compat_readings")
        .select("*")
        .eq("id", id)
        .single();
      if (error || !data) return null;
      return {
        id: data.id,
        createdAt: data.created_at,
        charts: data.charts,
        result: data.result,
        paid: !!data.paid,
      };
    }
    return memCompat.get(id) ?? null;
  },
  async markPaid(id: string): Promise<void> {
    const sb = getSupabase();
    if (sb) {
      await sb.from("compat_readings").update({ paid: true }).eq("id", id);
    } else {
      const rec = memCompat.get(id);
      if (rec) rec.paid = true;
    }
  },
  /** Replace the stored result (e.g. with the generated long-form report). */
  async updateResult(id: string, result: unknown): Promise<void> {
    const sb = getSupabase();
    if (sb) {
      await sb.from("compat_readings").update({ result }).eq("id", id);
    } else {
      const rec = memCompat.get(id);
      if (rec) rec.result = result;
    }
  },
  // Claim lives inside the charts jsonb (charts.claim) — zero-migration.
  async saveClaim(id: string, claim: Claim): Promise<void> {
    const sb = getSupabase();
    if (sb) {
      const rec = await compatStore.get(id);
      if (!rec) return;
      const charts = { ...(rec.charts as Record<string, unknown>), claim };
      await sb.from("compat_readings").update({ charts }).eq("id", id);
    } else {
      const rec = memCompat.get(id);
      if (rec) rec.claim = claim;
    }
  },
  async listPending(): Promise<StoredCompat[]> {
    const sb = getSupabase();
    if (sb) {
      // JSON-path filters (charts->claim) are flaky through PostgREST — fetch
      // recent unpaid rows and filter for a claim in JS instead.
      const { data, error } = await sb
        .from("compat_readings")
        .select("*")
        .eq("paid", false)
        .order("created_at", { ascending: false })
        .limit(100);
      if (error) {
        console.error("compat listPending:", error.message);
        return [];
      }
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      return (data ?? []).filter((d: any) => d.charts?.claim).map((d: any) => ({
        id: d.id,
        createdAt: d.created_at,
        charts: d.charts,
        result: d.result,
        paid: !!d.paid,
        claim: d.charts?.claim ?? null,
      }));
    }
    return [...memCompat.values()].filter((r) => !r.paid && r.claim);
  },
  /** Approved (paid) claims — the admin's permanent 승인 내역. */
  async listApproved(): Promise<StoredCompat[]> {
    const sb = getSupabase();
    if (sb) {
      const { data, error } = await sb
        .from("compat_readings")
        .select("*")
        .eq("paid", true)
        .order("created_at", { ascending: false })
        .limit(100);
      if (error) {
        console.error("compat listApproved:", error.message);
        return [];
      }
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      return (data ?? []).filter((d: any) => d.charts?.claim).map((d: any) => ({
        id: d.id,
        createdAt: d.created_at,
        charts: d.charts,
        result: d.result,
        paid: true,
        claim: d.charts?.claim ?? null,
      }));
    }
    return [...memCompat.values()].filter((r) => r.paid && r.claim);
  },
};

const memStore: Store = {
  async save(r) {
    const rec: StoredReading = {
      ...r,
      id: randomUUID(),
      createdAt: new Date().toISOString(),
    };
    mem.set(rec.id, rec);
    return rec;
  },
  async get(id) {
    return mem.get(id) ?? null;
  },
  async markPaid(id) {
    const rec = mem.get(id);
    if (rec) rec.paid = true;
  },
  async saveClaim(id, claim) {
    const rec = mem.get(id);
    if (rec) rec.claim = claim;
  },
  async listPending() {
    return [...mem.values()].filter((r) => !r.paid && r.claim);
  },
  async listApproved() {
    return [...mem.values()].filter((r) => r.paid && r.claim);
  },
};

let sbClient: unknown | null | undefined;

/**
 * Normalize whatever the owner pasted into SUPABASE_URL to the canonical
 * project origin. Handles trailing slashes/paths and the storage/S3 endpoint
 * variant (https://<ref>.storage.supabase.co/...) — all collapse to
 * https://<ref>.supabase.co, which is what PostgREST needs.
 */
export function normalizeSupabaseUrl(raw: string): string {
  const m = raw.trim().match(/https:\/\/([a-z0-9-]+)\.(?:storage\.)?supabase\.(co|in)/i);
  return m ? `https://${m[1]}.supabase.${m[2]}` : raw.trim().replace(/\/+$/, "");
}

/** Lazily created shared Supabase client, or null when unconfigured. */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function getSupabase(): any {
  if (sbClient !== undefined) return sbClient;
  const url = process.env.SUPABASE_URL ? normalizeSupabaseUrl(process.env.SUPABASE_URL) : "";
  const key = process.env.SUPABASE_SERVICE_KEY;
  if (!url || !key) {
    sbClient = null;
    return null;
  }
  // Lazy require so the dep isn't pulled when unconfigured.
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const { createClient } = require("@supabase/supabase-js");
  sbClient = createClient(url, key, { auth: { persistSession: false } });
  return sbClient;
}

function supabaseStore(): Store | null {
  const sb = getSupabase();
  if (!sb) return null;
  const TABLE = "readings"; // columns: id uuid pk, created_at, input jsonb, chart jsonb, sections jsonb, paid bool

  return {
    async save(r) {
      const rec: StoredReading = {
        ...r,
        id: randomUUID(),
        createdAt: new Date().toISOString(),
      };
      const { error } = await sb.from(TABLE).insert({
        id: rec.id,
        created_at: rec.createdAt,
        input: rec.input,
        chart: rec.chart,
        sections: rec.sections,
        paid: rec.paid,
      });
      if (error) throw new Error(`supabase insert: ${error.message}`);
      return rec;
    },
    async get(id) {
      const { data, error } = await sb.from(TABLE).select("*").eq("id", id).single();
      if (error || !data) return null;
      return {
        id: data.id,
        createdAt: data.created_at,
        input: data.input,
        chart: data.chart,
        sections: data.sections,
        paid: data.paid,
        claim: data.input?.claim ?? null,
      };
    },
    async markPaid(id) {
      await sb.from(TABLE).update({ paid: true }).eq("id", id);
    },
    // Claim lives inside the input jsonb (input.claim) — zero-migration.
    async saveClaim(id, claim) {
      const { data } = await sb.from(TABLE).select("input").eq("id", id).single();
      if (!data) return;
      await sb
        .from(TABLE)
        .update({ input: { ...data.input, claim } })
        .eq("id", id);
    },
    async listPending() {
      const { data, error } = await sb
        .from(TABLE)
        .select("*")
        .eq("paid", false)
        .order("created_at", { ascending: false })
        .limit(100);
      if (error) {
        console.error("readings listPending:", error.message);
        return [];
      }
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      return (data ?? []).filter((d: any) => d.input?.claim).map((d: any) => ({
        id: d.id,
        createdAt: d.created_at,
        input: d.input,
        chart: d.chart,
        sections: d.sections,
        paid: !!d.paid,
        claim: d.input?.claim ?? null,
      }));
    },
    async listApproved() {
      const { data, error } = await sb
        .from(TABLE)
        .select("*")
        .eq("paid", true)
        .order("created_at", { ascending: false })
        .limit(100);
      if (error) {
        console.error("readings listApproved:", error.message);
        return [];
      }
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      return (data ?? []).filter((d: any) => d.input?.claim).map((d: any) => ({
        id: d.id,
        createdAt: d.created_at,
        input: d.input,
        chart: d.chart,
        sections: d.sections,
        paid: true,
        claim: d.input?.claim ?? null,
      }));
    },
  };
}

export const store: Store = supabaseStore() ?? memStore;
export const usingMemoryStore = supabaseStore() === null;

// ── Amulet packs (부적/ยันต์ credits) ───────────────────────────────────
// 3 amulets per pack; reading costs 1, compat costs 2. Redeemable only after
// the owner confirms the transfer. Supabase table:
//   amulets(code text pk, created_at timestamptz, balance int, paid bool,
//           payer_name text, contact text)

export interface Amulet {
  code: string;
  createdAt: string;
  balance: number;
  paid: boolean;
  payerName: string;
  contact: string;
}

const memAmulets = new Map<string, Amulet>();

function genCode(): string {
  // 8 chars, cryptographically random, no ambiguous 0/O/1/I.
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  const bytes = randomBytes(8);
  let out = "";
  for (let i = 0; i < 8; i++) out += chars[bytes[i] % chars.length];
  return out;
}

export const amuletStore = {
  async create(payerName: string, contact: string): Promise<Amulet> {
    const rec: Amulet = {
      code: genCode(),
      createdAt: new Date().toISOString(),
      balance: 3,
      paid: false,
      payerName,
      contact,
    };
    const sb = getSupabase();
    if (sb) {
      const { error } = await sb.from("amulets").insert({
        code: rec.code,
        created_at: rec.createdAt,
        balance: rec.balance,
        paid: rec.paid,
        payer_name: rec.payerName,
        contact: rec.contact,
      });
      if (error) throw new Error(`supabase insert: ${error.message}`);
    } else {
      memAmulets.set(rec.code, rec);
    }
    return rec;
  },
  async get(code: string): Promise<Amulet | null> {
    const sb = getSupabase();
    if (sb) {
      const { data, error } = await sb.from("amulets").select("*").eq("code", code).single();
      if (error || !data) return null;
      return {
        code: data.code,
        createdAt: data.created_at,
        balance: data.balance,
        paid: !!data.paid,
        payerName: data.payer_name ?? "",
        contact: data.contact ?? "",
      };
    }
    return memAmulets.get(code) ?? null;
  },
  async markPaid(code: string): Promise<void> {
    const sb = getSupabase();
    if (sb) {
      await sb.from("amulets").update({ paid: true }).eq("code", code);
    } else {
      const rec = memAmulets.get(code);
      if (rec) rec.paid = true;
    }
  },
  /** Deduct `cost` amulets. Returns remaining balance, or null if not possible. */
  async redeem(code: string, cost: number): Promise<number | null> {
    const rec = await amuletStore.get(code);
    if (!rec || !rec.paid || rec.balance < cost) return null;
    const next = rec.balance - cost;
    const sb = getSupabase();
    if (sb) {
      // Guard against double-spend with a conditional update.
      const { data } = await sb
        .from("amulets")
        .update({ balance: next })
        .eq("code", code)
        .eq("balance", rec.balance)
        .select("balance");
      if (!data || data.length === 0) return null;
    } else {
      const m = memAmulets.get(code);
      if (!m || m.balance < cost) return null;
      m.balance = next;
    }
    return next;
  },
  async listPending(): Promise<Amulet[]> {
    const sb = getSupabase();
    if (sb) {
      const { data } = await sb
        .from("amulets")
        .select("*")
        .eq("paid", false)
        .order("created_at", { ascending: false })
        .limit(50);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      return (data ?? []).map((d: any) => ({
        code: d.code,
        createdAt: d.created_at,
        balance: d.balance,
        paid: !!d.paid,
        payerName: d.payer_name ?? "",
        contact: d.contact ?? "",
      }));
    }
    return [...memAmulets.values()].filter((a) => !a.paid);
  },
  async listApproved(): Promise<Amulet[]> {
    const sb = getSupabase();
    if (sb) {
      const { data } = await sb
        .from("amulets")
        .select("*")
        .eq("paid", true)
        .order("created_at", { ascending: false })
        .limit(50);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      return (data ?? []).map((d: any) => ({
        code: d.code,
        createdAt: d.created_at,
        balance: d.balance,
        paid: true,
        payerName: d.payer_name ?? "",
        contact: d.contact ?? "",
      }));
    }
    return [...memAmulets.values()].filter((a) => a.paid);
  },
};
