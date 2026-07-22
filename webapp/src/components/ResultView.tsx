"use client";

import { useState } from "react";

interface Pillar {
  gan: string;
  zhi: string;
}
interface Section {
  key: string;
  title: string;
  body: string;
  locked: boolean;
}
export interface Reading {
  id: string | null;
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
  lang?: string;
  disclaimer: string;
}

import { STEM_STYLE, BRANCH_STYLE, ELEMENT_CHIP } from "./hanStyles";

const ELEMENT_LABEL: Record<string, string> = {
  wood: "ไม้·Wood",
  fire: "ไฟ·Fire",
  earth: "ดิน·Earth",
  metal: "ทอง·Metal",
  water: "น้ำ·Water",
};

const SECTION_EMOJI: Record<string, string> = {
  personality: "✨",
  elements: "🎨",
  strength: "⚡",
  today: "🍀",
  love: "💖",
  career: "💼",
  wealth: "💰",
  luck10: "🔮",
};

function HanBlock({ ch, style, star }: { ch: string; style?: string; star?: boolean }) {
  return (
    <div
      className={
        "relative flex h-12 items-center justify-center rounded-xl text-2xl font-bold shadow-sm " +
        (style ?? "bg-cream text-ink/40")
      }
    >
      {star && <span className="absolute -top-2 -right-1 text-xs">⭐</span>}
      {ch}
    </div>
  );
}

export default function ResultView({ initial }: { initial: Reading }) {
  const [reading, setReading] = useState<Reading>(initial);
  const [pay, setPay] = useState<{ qr: string; amount: number } | null>(null);
  const [busy, setBusy] = useState(false);
  const [copied, setCopied] = useState(false);

  const { chart, sections, disclaimer, id } = reading;

  // Traditional reading order: 시 → 일 → 월 → 년 (hour, day, month, year).
  const pillars: Array<{ label: [string, string]; p: Pillar | null; isDay?: boolean }> = [
    { label: ["เวลา", "Hour"], p: chart.hour },
    { label: ["วัน", "Day"], p: chart.day, isDay: true },
    { label: ["เดือน", "Month"], p: chart.month },
    { label: ["ปี", "Year"], p: chart.year },
  ];

  async function openPayment() {
    setBusy(true);
    try {
      const res = await fetch(`/api/pay?kind=reading${id ? `&id=${id}` : ""}`);
      const data = await res.json();
      setPay({ qr: data.qr, amount: data.amount });
    } finally {
      setBusy(false);
    }
  }

  // Phase-0 manual confirm. Phase 1: replaced by a PG webhook.
  // Falls back to the stateless unlock when the reading has no stored id.
  async function confirmPaid() {
    setBusy(true);
    try {
      const body = id
        ? { id }
        : {
            kind: "reading",
            lang: reading.lang,
            dayMaster: chart.dayMaster,
            sections: reading.sections,
          };
      const res = await fetch("/api/pay", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
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
    if (!id) return;
    const url = `${window.location.origin}/result/${id}`;
    navigator.clipboard?.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <section className="mt-8">
      {/* Four Pillars grid (사주 원국) — 시일월년 order */}
      <div className="rounded-3xl bg-white p-5 shadow-sm ring-1 ring-peach/40">
        <h2 className="mb-3 text-center text-sm font-semibold text-rosewood">
          🧧 ผังดวงซาจูของคุณ · Your Four Pillars (원국)
        </h2>
        <div className="grid grid-cols-4 gap-2 text-center">
          {pillars.map(({ label, p, isDay }) => (
            <div
              key={label[1]}
              className={
                "rounded-2xl p-2 " +
                (isDay ? "bg-amber-50 ring-2 ring-amber-300" : "bg-cream/60")
              }
            >
              <div className="mb-1 text-xs text-ink/50">
                {label[0]}
                <span className="block text-[10px] text-ink/35">{label[1]}</span>
              </div>
              <div className="flex flex-col gap-1.5">
                <HanBlock
                  ch={p ? p.gan : "—"}
                  style={p ? STEM_STYLE[p.gan] : undefined}
                  star={isDay}
                />
                <HanBlock ch={p ? p.zhi : "—"} style={p ? BRANCH_STYLE[p.zhi] : undefined} />
              </div>
            </div>
          ))}
        </div>
        <p className="mt-2 text-center text-[10px] text-ink/40">
          ⭐ = ธาตุประจำตัวคุณ · your Day Master (일간)
        </p>

        {/* Five-element counts */}
        <div className="mt-3 flex flex-wrap justify-center gap-2 text-xs">
          {Object.entries(chart.elementCounts).map(([el, n]) => (
            <span key={el} className={"rounded-full px-2.5 py-1 font-medium " + ELEMENT_CHIP[el]}>
              {ELEMENT_LABEL[el]} {n}
            </span>
          ))}
        </div>

        {id && (
          <button
            onClick={share}
            className="mt-4 w-full rounded-xl border border-peach/60 py-2 text-sm text-rosewood transition hover:bg-peach/20"
          >
            {copied ? "คัดลอกลิงก์แล้ว ✓ Copied" : "📤 แชร์ผลดวงนี้ · Share this reading"}
          </button>
        )}
      </div>

      {/* Sections */}
      <div className="mt-4 space-y-3">
        {sections.map((s) => (
          <div key={s.key} className="rounded-3xl bg-white p-5 shadow-sm ring-1 ring-peach/40">
            <h3 className="font-semibold text-rosewood">
              {SECTION_EMOJI[s.key] ?? "🌸"} {s.title}
            </h3>
            <p
              className={
                "mt-1 text-sm leading-relaxed text-ink/80 " + (s.locked ? "locked-body" : "")
              }
            >
              {s.body}
            </p>
            {s.locked && (
              <button
                onClick={openPayment}
                disabled={busy}
                className="mt-3 inline-block rounded-xl bg-rosewood px-4 py-2 text-sm font-semibold text-white transition hover:opacity-90 disabled:opacity-50"
              >
                🔓 ปลดล็อกผลแบบเต็ม · Unlock full reading
              </button>
            )}
          </div>
        ))}
      </div>

      {pay && (
        <div className="fixed inset-0 z-10 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-xs rounded-3xl bg-white p-6 text-center">
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
