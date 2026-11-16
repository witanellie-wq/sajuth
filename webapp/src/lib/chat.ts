// 상담 채팅 — per result (reading / compat): 1 free question, then paid packs.
// Tables: chat_threads, chat_messages, chat_purchases (supabase/login_chat.sql)
import { db } from "./users";
import { store, compatStore } from "./store";
import { factSheet, crossSpouseFact } from "./myeongri";
import type { SajuChart } from "./saju";

export type TargetKind = "reading" | "compat";
export const FREE_QUESTIONS = 1;
export const PACKS: Record<string, { questions: number; price: number }> = {
  chat3: { questions: 3, price: Number(process.env.CHAT3_PRICE_THB ?? 49) },
  chat10: { questions: 10, price: Number(process.env.CHAT10_PRICE_THB ?? 99) },
};

export interface ChatMsg {
  role: "user" | "assistant";
  content: string;
  created_at?: string;
}

export interface ThreadState {
  remaining: number;
  used: number;
  messages: ChatMsg[];
}

async function threadRow(kind: TargetKind, id: string): Promise<{ bought: number; used: number }> {
  const c = db();
  if (!c) return { bought: 0, used: 0 };
  const { data } = await c.from("chat_threads").select("bought, used").eq("kind", kind).eq("item_id", id).maybeSingle();
  return { bought: data?.bought ?? 0, used: data?.used ?? 0 };
}

export async function getThread(kind: TargetKind, id: string): Promise<ThreadState> {
  const c = db();
  const t = await threadRow(kind, id);
  let messages: ChatMsg[] = [];
  if (c) {
    const { data } = await c
      .from("chat_messages")
      .select("role, content, created_at")
      .eq("kind", kind)
      .eq("item_id", id)
      .order("created_at", { ascending: true })
      .limit(200);
    messages = data ?? [];
  }
  return { remaining: Math.max(0, FREE_QUESTIONS + t.bought - t.used), used: t.used, messages };
}

export async function addMessage(kind: TargetKind, id: string, role: "user" | "assistant", content: string): Promise<void> {
  const c = db();
  if (!c) return;
  await c.from("chat_messages").insert({ kind, item_id: id, role, content });
}

export async function consumeQuestion(kind: TargetKind, id: string): Promise<void> {
  const c = db();
  if (!c) return;
  const t = await threadRow(kind, id);
  await c.from("chat_threads").upsert({ kind, item_id: id, bought: t.bought, used: t.used + 1 }, { onConflict: "kind,item_id" });
}

export async function addCredits(kind: TargetKind, id: string, n: number): Promise<void> {
  const c = db();
  if (!c) return;
  const t = await threadRow(kind, id);
  await c.from("chat_threads").upsert({ kind, item_id: id, bought: t.bought + n, used: t.used }, { onConflict: "kind,item_id" });
}

/** Record a pack purchase (status paid | pending). Returns false if the slip ref was already used. */
export async function recordPurchase(
  kind: TargetKind,
  id: string,
  pack: string,
  ref: string,
  status: "paid" | "pending",
  note = ""
): Promise<boolean> {
  const c = db();
  if (!c) return true;
  const { error } = await c.from("chat_purchases").insert({ kind, item_id: id, pack, ref, status, note });
  if (error) {
    console.error("recordPurchase:", error.message);
    return !/duplicate|unique/i.test(error.message);
  }
  return true;
}

function sectionsText(sections: Array<{ title?: string; body?: string; locked?: boolean }> | undefined): string {
  return (sections ?? [])
    .filter((s) => !s.locked && s.body)
    .map((s) => `■ ${s.title}\n${s.body}`)
    .join("\n\n")
    .slice(0, 9000);
}

function birthOf(c: SajuChart) {
  return { year: c.solarUsed.y, month: c.solarUsed.m, day: c.solarUsed.d };
}

/** Facts + report text the chat answers from. null → target not found. */
export async function chatFacts(kind: TargetKind, id: string): Promise<{ facts: string; label: string } | null> {
  if (kind === "reading") {
    const r = await store.get(id);
    if (!r) return null;
    const name = r.input.name || "사용자";
    const facts =
      `이름: ${name} / 성별: ${r.input.gender ?? "미상"}\n` +
      factSheet(r.chart, { gender: r.input.gender, birth: birthOf(r.chart) }) +
      `\n\n[리포트]\n${sectionsText(r.paid ? r.sections : r.sections.filter((s) => !s.locked))}`;
    return { facts, label: name };
  }
  const rec = await compatStore.get(id);
  if (!rec) return null;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const p = rec.charts as any;
  const a: SajuChart = p?.charts?.a;
  const b: SajuChart = p?.charts?.b;
  if (!a || !b) return null;
  const na = p.profiles?.a?.name || "A";
  const nb = p.profiles?.b?.name || "B";
  const ga = p.profiles?.a?.gender;
  const gb = p.profiles?.b?.gender;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const res = rec.result as any;
  const facts =
    `관계: ${p.relationship ?? "lovers"} / 나이 차이: ${Math.abs(birthOf(a).year - birthOf(b).year)}살(출생연도 기준)\n\n` +
    `[${na}]\n${factSheet(a, { gender: ga, birth: birthOf(a) })}\n\n` +
    `[${nb}]\n${factSheet(b, { gender: gb, birth: birthOf(b) })}\n\n` +
    `[배우자 기운 교차]\n${crossSpouseFact(a, b, ga, gb, na, nb)}\n\n` +
    `[확인된 합·충]\n${(res?.combos ?? []).map((x: string) => x.replaceAll("{A}", na).replaceAll("{B}", nb)).join("\n")}\n\n` +
    `[리포트]\n${sectionsText(rec.paid ? res?.sections : (res?.sections ?? []).filter((s: { locked?: boolean }) => !s.locked))}`;
  return { facts, label: `${na} × ${nb}` };
}
