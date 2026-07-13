"use client";

import { useState } from "react";

export interface Pillar {
  gan: string;
  zhi: string;
}
export interface Section {
  key: string;
  title: string;
  body: string;
  locked: boolean;
}
export interface Reading {
  id: string;
  chart: {
    year: Pillar;
    month: Pillar;
    day: Pillar;
    hour: Pillar | null;
    dayMaster: string;
    elementCounts: Record<string, number>;
  };
  sections: Section[];
  paid?: boolean;
  disclaimer: string;
}

const ELEMENT_LABEL: Record<string, string> = {
  wood: "ไม้",
  fire: "ไฟ",
  earth: "ดิน",
  metal: "ทอง",
  water: "น้ำ",
};

export default function ResultView({ initial }: { initial: Reading }) {
  const [reading, setReading] = useState<Reading>(initial);
  const [pay, setPay] = useState<{ qr: string; amount: number } | null>(null);
  const [busy, setBusy] = useState(false);
  const [copied, setCopied] = useState(false);

  const { chart, sections, disclaimer } = reading;
  const pillars: Array<[string, Pillar | null]> = [
    ["ปี", chart.year],
    ["เดือน", chart.month],
    ["วัน", chart.day],
    ["เวลา", chart.hour],
  ];

  async function openPayment() {
    setBusy(true);
    try {
      const res = await fetch(`/api/pay?id=${reading.id}`);
      const data = await res.json();
      setPay({ qr: data.qr, amount: data.amount });
    } finally {
      setBusy(false);
    }
  }

  // Phase-0 manual confirm. Phase 1: replaced by a PG webhook.
  async function confirmPaid() {
    setBusy(true);
    try {
      const res = await fetch("/api/pay", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: reading.id }),
      });
      const data = await res.json();
      if (data.sections) {
        setReading({ ...reading, sections: data.sections, paid: true });
        setPay(null);
      }
    } finally {
      setBusy(false);
    }
  }

  function share() {
    const url = `${window.location.origin}/result/${reading.id}`;
    navigator.clipboard?.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <section className="mt-8">
      <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-peach/40">
        <h2 className="mb-3 text-center text-sm font-semibold text-rosewood">
          ผังดวงซาจูของคุณ (원국)
        </h2>
        <div className="grid grid-cols-4 gap-2 text-center">
          {pillars.map(([label, p]) => (
            <div key={label} className="rounded-lg bg-cream py-3">
              <div className="text-xs text-ink/50">{label}</div>
              <div className="mt-1 text-2xl font-bold text-ink">{p ? p.gan : "—"}</div>
              <div className="text-2xl font-bold text-ink/70">{p ? p.zhi : "—"}</div>
            </div>
          ))}
        </div>
        <div className="mt-4 flex justify-center gap-2 text-xs">
          {Object.entries(chart.elementCounts).map(([el, n]) => (
            <span key={el} className="rounded-full bg-peach/40 px-2 py-1">
              {ELEMENT_LABEL[el]} {n}
            </span>
          ))}
        </div>
        <button
          onClick={share}
          className="mt-4 w-full rounded-lg border border-peach/60 py-2 text-sm text-rosewood"
        >
          {copied ? "คัดลอกลิงก์แล้ว ✓" : "📤 แชร์ผลดวงนี้"}
        </button>
      </div>

      <div className="mt-4 space-y-3">
        {sections.map((s) => (
          <div key={s.key} className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-peach/40">
            <h3 className="font-semibold text-rosewood">{s.title}</h3>
            <p className={"mt-1 text-sm leading-relaxed text-ink/80 " + (s.locked ? "locked-body" : "")}>
              {s.body}
            </p>
            {s.locked && (
              <button
                onClick={openPayment}
                disabled={busy}
                className="mt-3 inline-block rounded-lg bg-rosewood px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
              >
                🔓 ปลดล็อกผลแบบเต็ม
              </button>
            )}
          </div>
        ))}
      </div>

      {pay && (
        <div className="fixed inset-0 z-10 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-xs rounded-2xl bg-white p-6 text-center">
            <h3 className="font-semibold text-rosewood">สแกนเพื่อชำระ</h3>
            <p className="mt-1 text-sm text-ink/70">PromptPay · {pay.amount} บาท</p>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={pay.qr} alt="PromptPay QR" className="mx-auto my-3 w-56" />
            <p className="text-xs text-ink/50">
              หลังโอนแล้ว กดปุ่มด้านล่างเพื่อปลดล็อก
            </p>
            <button
              onClick={confirmPaid}
              disabled={busy}
              className="mt-3 w-full rounded-xl bg-rosewood py-2.5 font-semibold text-white disabled:opacity-50"
            >
              ฉันชำระเงินแล้ว
            </button>
            <button onClick={() => setPay(null)} className="mt-2 text-xs text-ink/40">
              ปิด
            </button>
          </div>
        </div>
      )}

      <p className="mt-6 text-center text-xs text-ink/40">{disclaimer}</p>
    </section>
  );
}
