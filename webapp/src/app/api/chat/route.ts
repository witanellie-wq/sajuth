import { NextRequest, NextResponse } from "next/server";
import { getThread, chatFacts, addMessage, consumeQuestion, PACKS, type TargetKind } from "@/lib/chat";
import { askChat } from "@/lib/generate";
import { pickLang } from "@/lib/i18n";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

function target(kind: string | null, id: string | null): { kind: TargetKind; id: string } | null {
  if ((kind !== "reading" && kind !== "compat") || !id || !/^[0-9a-f-]{36}$/i.test(id)) return null;
  return { kind, id };
}

// GET /api/chat?kind=reading|compat&id=… → { remaining, messages, packs }
export async function GET(req: NextRequest) {
  const t = target(req.nextUrl.searchParams.get("kind"), req.nextUrl.searchParams.get("id"));
  if (!t) return NextResponse.json({ error: "bad_target" }, { status: 400 });
  const th = await getThread(t.kind, t.id);
  return NextResponse.json({ ...th, packs: PACKS });
}

// POST { kind, id, question, lang } → asks one question (uses one credit)
export async function POST(req: NextRequest) {
  let b: { kind?: string; id?: string; question?: string; lang?: string };
  try {
    b = await req.json();
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }
  const t = target(b.kind ?? null, b.id ?? null);
  const q = String(b.question ?? "").trim();
  if (!t || !q) return NextResponse.json({ error: "bad_request" }, { status: 400 });
  if (q.length > 600) return NextResponse.json({ error: "too_long" }, { status: 400 });

  const th = await getThread(t.kind, t.id);
  if (th.remaining <= 0) return NextResponse.json({ error: "no_credits", remaining: 0 }, { status: 402 });

  const f = await chatFacts(t.kind, t.id);
  if (!f) return NextResponse.json({ error: "not_found" }, { status: 404 });

  const answer = await askChat(f.facts, th.messages, q, pickLang(b.lang));
  if (!answer) return NextResponse.json({ error: "gen_failed" }, { status: 503 });

  await addMessage(t.kind, t.id, "user", q);
  await addMessage(t.kind, t.id, "assistant", answer);
  await consumeQuestion(t.kind, t.id);
  return NextResponse.json({ answer, remaining: th.remaining - 1 });
}
