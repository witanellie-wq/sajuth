// Reading persistence — powers shareable /result/:id links (the viral loop
// that carried 사주아이 on Threads).
//
// Uses Supabase when SUPABASE_URL + SUPABASE_SERVICE_KEY are set; otherwise
// falls back to an in-process Map so `npm run dev` works with zero config.
// NOTE: the in-memory fallback does NOT persist across serverless invocations
// or restarts — set up Supabase before relying on share links in production.

import { randomUUID } from "crypto";
import type { SajuChart } from "./saju";
import type { ReportSection } from "./interpret";

export interface StoredReading {
  id: string;
  createdAt: string;
  input: { year: number; month: number; day: number; hour: number | null };
  chart: SajuChart;
  sections: ReportSection[];
  paid: boolean;
}

interface Store {
  save(r: Omit<StoredReading, "id" | "createdAt">): Promise<StoredReading>;
  get(id: string): Promise<StoredReading | null>;
  markPaid(id: string): Promise<void>;
}

export interface StoredCompat {
  id: string;
  createdAt: string;
  charts: unknown; // { a, b } summary pillars
  result: unknown; // Compatibility
  paid: boolean;
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
};

let sbClient: unknown | null | undefined;

/** Lazily created shared Supabase client, or null when unconfigured. */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function getSupabase(): any {
  if (sbClient !== undefined) return sbClient;
  const url = process.env.SUPABASE_URL;
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
      };
    },
    async markPaid(id) {
      await sb.from(TABLE).update({ paid: true }).eq("id", id);
    },
  };
}

export const store: Store = supabaseStore() ?? memStore;
export const usingMemoryStore = supabaseStore() === null;
