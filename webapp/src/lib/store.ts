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

const mem = new Map<string, StoredReading>();

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

function supabaseStore(): Store | null {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_KEY;
  if (!url || !key) return null;

  // Lazy require so the dep isn't pulled when unconfigured.
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const { createClient } = require("@supabase/supabase-js");
  const sb = createClient(url, key, { auth: { persistSession: false } });
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
