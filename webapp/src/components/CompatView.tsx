"use client";

import { useState } from "react";
import { STEM_STYLE, BRANCH_STYLE } from "./hanStyles";

const COMPAT_EMOJI: Record<string, string> = {
  marriage: "💍",
  conflict: "⚠️",
  longterm: "🌈",
};

function MiniHan({ gan, zhi }: { gan: string; zhi: string }) {
  return (
    <span className="inline-flex gap-0.5 align-middle">
      <span
        className={
          "inline-flex h-7 w-7 items-center justify-center rounded-lg text-sm font-bold " +
          (STEM_STYLE[gan] ?? "bg-cream")
        }
      >
        {gan}
      </span>
      <span
        className={
          "inline-flex h-7 w-7 items-center justify-center rounded-lg text-sm font-bold " +
          (BRANCH_STYLE[zhi] ?? "bg-cream")
        }
      >
        {zhi}
      </span>
    </span>
  );
}

export interface CompatSection {
  key: string;
  title: string;
  body: string;
  locked: boolean;
}

export interface CompatData {
  id?: string | null;
  result: {
    score: number;
    bandTh: string;
    headline: string;
    rel: string;
    sections: CompatSection[];
  };
  charts: {
    a: { dayMaster: string; day: { gan: string; zhi: string } };
    b: { dayMaster: string; day: { gan: string; zhi: string } };
  };
  disclaimer: string;
}

export default function CompatView({ data }: { data: CompatData }) {
  const { id, charts, disclaimer } = data;
  const [sections, setSections] = useState<CompatSection[]>(data.result.sections);
  const [pay, setPay] = useState<{ qr: string; amount: number } | null>(null);
  const [busy, setBusy] = useState(false);
  const [copied, setCopied] = useState(false);
  const { score, bandTh, headline } = data.result;

  function share() {
    if (!id) return;
    const url = `${window.location.origin}/compat/result/${id}`;
    navigator.clipboard?.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  async function openPayment() {
    if (!id) return;
    setBusy(true);
    try {
      const res = await fetch(`/api/pay?id=${id}&kind=compat`);
      const d = await res.json();
      setPay({ qr: d.qr, amount: d.amount });
    } finally {
      setBusy(false);
    }
  }

  // Phase-0 manual confirm; Phase 1 becomes a PG webhook.
  async function confirmPaid() {
    if (!id) return;
    setBusy(true);
    try {
      const res = await fetch("/api/pay", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, kind: "compat" }),
      });
      const d = await res.json();
      if (d.sections) {
        setSections(d.sections);
        setPay(null);
      }
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="mt-8">
      <div className="rounded-2xl bg-white p-6 text-center shadow-sm ring-1 ring-peach/40">
        <div className="flex items-center justify-center gap-4 text-sm text-ink/60">
          <span className="flex items-center gap-1.5">
            คุณ·You <MiniHan gan={charts.a.day.gan} zhi={charts.a.day.zhi} />
          </span>
          <span className="text-xl">💞</span>
          <span className="flex items-center gap-1.5">
            อีกฝ่าย·Partner <MiniHan gan={charts.b.day.gan} zhi={charts.b.day.zhi} />
          </span>
        </div>
        <div className="my-2 bg-gradient-to-r from-rose-500 via-rosewood to-amber-500 bg-clip-text text-5xl font-bold text-transparent">
          {score}%
        </div>
        <div className="text-lg font-semibold text-ink">{bandTh}</div>
        <p className="mt-1 text-sm text-ink/70">{headline}</p>
        {id && (
          <button
            onClick={share}
            className="mt-4 w-full rounded-lg border border-peach/60 py-2 text-sm text-rosewood"
          >
            {copied ? "คัดลอกลิงก์แล้ว ✓ Copied" : "📤 แชร์ผลคู่นี้ · Share this result"}
          </button>
        )}
      </div>

      <div className="mt-4 space-y-3">
        {sections
          .filter((s) => s.key !== "overview")
          .map((s) => (
            <div key={s.key} className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-peach/40">
              <h3 className="text-sm font-semibold text-rosewood">
                {COMPAT_EMOJI[s.key] ?? "💡"} {s.title}
              </h3>
              <p
                className={
                  "mt-1 text-sm leading-relaxed text-ink/80 " + (s.locked ? "locked-body" : "")
                }
              >
                {s.body}
              </p>
              {s.locked && id && (
                <button
                  onClick={openPayment}
                  disabled={busy}
                  className="mt-3 inline-block rounded-lg bg-rosewood px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
                >
                  🔓 ปลดล็อกผลเชิงลึก · Unlock in-depth reading
                </button>
              )}
            </div>
          ))}
      </div>

      {pay && (
        <div className="fixed inset-0 z-10 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-xs rounded-2xl bg-white p-6 text-center">
            <h3 className="font-semibold text-rosewood">สแกนเพื่อชำระ · Scan to pay</h3>
            <p className="mt-1 text-sm text-ink/70">PromptPay · {pay.amount} THB</p>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={pay.qr} alt="PromptPay QR" className="mx-auto my-3 w-56" />
            <p className="text-xs text-ink/50">
              หลังโอนแล้ว กดปุ่มด้านล่างเพื่อปลดล็อก · After transferring, tap below to unlock
            </p>
            <button
              onClick={confirmPaid}
              disabled={busy}
              className="mt-3 w-full rounded-xl bg-rosewood py-2.5 font-semibold text-white disabled:opacity-50"
            >
              ฉันชำระเงินแล้ว · I've paid
            </button>
            <button onClick={() => setPay(null)} className="mt-2 text-xs text-ink/40">
              ปิด · Close
            </button>
          </div>
        </div>
      )}

      <p className="mt-6 text-center text-xs text-ink/40">{disclaimer}</p>
    </section>
  );
}
