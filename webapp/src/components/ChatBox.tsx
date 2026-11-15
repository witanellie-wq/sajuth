"use client";

import { useEffect, useRef, useState } from "react";
import QrSave from "./QrSave";
import SlipUpload from "./SlipUpload";

type L3 = "th" | "en" | "ko";
interface Msg {
  role: "user" | "assistant";
  content: string;
}

const T: Record<L3, Record<string, string>> = {
  th: {
    title: "💬 ถามดวงของคุณ",
    sub: "ถามอะไรก็ได้เกี่ยวกับดวงนี้ — ความรัก งาน เงิน นิสัยของเขา",
    free: "ถามฟรี 1 คำถาม",
    left: "เหลือ {n} คำถาม",
    ph: "เช่น ทำไมเขาไม่ค่อยทักแต่ก็ใจดี?",
    send: "ถาม",
    thinking: "กำลังดูดวงให้…",
    out: "ใช้คำถามครบแล้ว — ซื้อเพิ่มเพื่อถามต่อ",
    pack3: "3 คำถาม · {p} บาท",
    pack10: "10 คำถาม · {p} บาท (คุ้มสุด)",
    scan: "สแกนจ่ายด้วย PromptPay",
    added: "✅ เพิ่มคำถามแล้ว ถามต่อได้เลย",
    pending: "📨 ได้รับสลิปแล้ว กำลังตรวจยอด จะเพิ่มคำถามให้เร็วๆ นี้",
    err: "ตอนนี้ตอบไม่ได้ ลองใหม่อีกครั้งนะ",
    close: "ปิด",
  },
  en: {
    title: "💬 Ask your reading",
    sub: "Ask anything about this chart — love, work, money, their personality",
    free: "1 free question",
    left: "{n} questions left",
    ph: "e.g. Why does he rarely text but still feel caring?",
    send: "Ask",
    thinking: "Reading your chart…",
    out: "No questions left — get more to keep asking",
    pack3: "3 questions · {p} THB",
    pack10: "10 questions · {p} THB (best value)",
    scan: "Pay with PromptPay",
    added: "✅ Questions added — ask away",
    pending: "📨 Slip received — we're confirming it and will add your questions shortly",
    err: "Couldn't answer right now — please try again",
    close: "Close",
  },
  ko: {
    title: "💬 내 사주에게 물어보기",
    sub: "이 사주에 대해 무엇이든 물어보세요 — 연애, 일, 돈, 상대의 성격",
    free: "무료 질문 1개",
    left: "남은 질문 {n}개",
    ph: "예: 연락은 잘 안 하는데 다정한 건 왜 그래요?",
    send: "질문",
    thinking: "사주를 보는 중…",
    out: "질문을 다 썼어요 — 추가권으로 계속 물어보세요",
    pack3: "질문 3개 · {p}바트",
    pack10: "질문 10개 · {p}바트 (가장 이득)",
    scan: "PromptPay로 결제",
    added: "✅ 질문이 추가됐어요. 계속 물어보세요",
    pending: "📨 슬립 접수 완료! 입금 확인 후 질문을 추가해 드려요",
    err: "지금은 답변이 어려워요. 다시 시도해 주세요",
    close: "닫기",
  },
};

export default function ChatBox({ kind, id, lang }: { kind: "reading" | "compat"; id: string; lang: L3 }) {
  const t = T[lang] ?? T.th;
  const [msgs, setMsgs] = useState<Msg[]>([]);
  const [remaining, setRemaining] = useState<number | null>(null);
  const [prices, setPrices] = useState<{ chat3: number; chat10: number }>({ chat3: 49, chat10: 99 });
  const [q, setQ] = useState("");
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState("");
  const [pay, setPay] = useState<{ pack: "chat3" | "chat10"; qr: string; amount: number } | null>(null);
  const end = useRef<HTMLDivElement>(null);

  async function load() {
    const d = await fetch(`/api/chat?kind=${kind}&id=${id}`).then((r) => r.json()).catch(() => null);
    if (!d || d.error) return;
    setMsgs(d.messages ?? []);
    setRemaining(d.remaining);
    if (d.packs) setPrices({ chat3: d.packs.chat3.price, chat10: d.packs.chat10.price });
  }
  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [kind, id]);
  useEffect(() => {
    end.current?.scrollIntoView({ block: "nearest" });
  }, [msgs.length]);

  async function ask() {
    const question = q.trim();
    if (!question || busy) return;
    setBusy(true);
    setNote("");
    setMsgs((m) => [...m, { role: "user", content: question }]);
    setQ("");
    try {
      const r = await fetch("/api/chat", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ kind, id, question, lang }),
      });
      const d = await r.json();
      if (d.answer) {
        setMsgs((m) => [...m, { role: "assistant", content: d.answer }]);
        setRemaining(d.remaining);
      } else {
        setMsgs((m) => m.slice(0, -1));
        setQ(question);
        if (d.error === "no_credits") setRemaining(0);
        else setNote(t.err);
      }
    } catch {
      setMsgs((m) => m.slice(0, -1));
      setQ(question);
      setNote(t.err);
    }
    setBusy(false);
  }

  async function buy(pack: "chat3" | "chat10") {
    const d = await fetch(`/api/pay?kind=${pack}`).then((r) => r.json()).catch(() => null);
    if (d?.qr) setPay({ pack, qr: d.qr, amount: d.amount });
  }

  const label = remaining === null ? "" : remaining > 0 ? (msgs.length === 0 ? t.free : t.left.replace("{n}", String(remaining))) : "";

  return (
    <div className="mt-5 rounded-3xl bg-white p-5 shadow-sm ring-1 ring-peach/40">
      <h3 className="font-semibold text-rosewood">{t.title}</h3>
      <p className="mt-0.5 text-xs text-ink/60">{t.sub}</p>

      {msgs.length > 0 && (
        <div className="mt-3 max-h-[28rem] space-y-2 overflow-y-auto">
          {msgs.map((m, i) => (
            <div key={i} className={m.role === "user" ? "text-right" : "text-left"}>
              <div
                className={
                  "inline-block max-w-[90%] whitespace-pre-line rounded-2xl px-3 py-2 text-sm leading-relaxed " +
                  (m.role === "user" ? "bg-rosewood text-white" : "bg-cream text-ink/80")
                }
              >
                {m.content}
              </div>
            </div>
          ))}
          {busy && <p className="text-xs text-ink/50">{t.thinking}</p>}
          <div ref={end} />
        </div>
      )}

      {remaining !== null && remaining > 0 && (
        <div className="mt-3">
          <div className="flex gap-2">
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && !e.nativeEvent.isComposing && ask()}
              placeholder={t.ph}
              maxLength={600}
              className="min-w-0 flex-1 rounded-xl border border-peach/60 bg-cream px-3 py-2 text-sm outline-none focus:border-rosewood"
            />
            <button
              onClick={ask}
              disabled={busy || !q.trim()}
              className="rounded-xl bg-rosewood px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
            >
              {t.send}
            </button>
          </div>
          <p className="mt-1 text-[11px] text-ink/50">{label}</p>
        </div>
      )}

      {remaining === 0 && (
        <div className="mt-3 rounded-2xl bg-peach/30 p-3 text-center">
          <p className="text-xs text-ink/70">{t.out}</p>
          <div className="mt-2 space-y-2">
            <button onClick={() => buy("chat3")} className="w-full rounded-xl border-2 border-rosewood bg-white py-2 text-sm font-semibold text-rosewood">
              {t.pack3.replace("{p}", String(prices.chat3))}
            </button>
            <button onClick={() => buy("chat10")} className="w-full rounded-xl bg-rosewood py-2 text-sm font-semibold text-white">
              {t.pack10.replace("{p}", String(prices.chat10))}
            </button>
          </div>
        </div>
      )}
      {note && <p className="mt-2 text-xs text-amber-600">{note}</p>}

      {pay && (
        <div className="fixed inset-0 z-10 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-xs rounded-3xl bg-white p-6 text-center">
            <h3 className="font-semibold text-rosewood">{t.scan}</h3>
            <p className="mt-1 text-sm text-ink/70">PromptPay · {pay.amount} THB</p>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={pay.qr} alt="PromptPay QR" className="mx-auto my-3 w-56" />
            <QrSave qr={pay.qr} amount={pay.amount} lang={lang} />
            <SlipUpload
              kind={pay.pack}
              id={`${kind}:${id}`}
              lang={lang}
              onPaid={() => {
                setPay(null);
                setNote(t.added);
                load();
              }}
              onPending={() => {
                setPay(null);
                setNote(t.pending);
              }}
            />
            <button onClick={() => setPay(null)} className="mt-2 text-xs text-ink/40">
              {t.close}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
