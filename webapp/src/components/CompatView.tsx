"use client";

import { useState } from "react";

export interface CompatData {
  id?: string;
  result: {
    score: number;
    bandTh: string;
    headline: string;
    sections: Array<{ title: string; body: string }>;
  };
  charts: {
    a: { dayMaster: string; day: { gan: string; zhi: string } };
    b: { dayMaster: string; day: { gan: string; zhi: string } };
  };
  disclaimer: string;
}

export default function CompatView({ data }: { data: CompatData }) {
  const { id, result, charts, disclaimer } = data;
  const [copied, setCopied] = useState(false);

  function share() {
    if (!id) return;
    const url = `${window.location.origin}/compat/result/${id}`;
    navigator.clipboard?.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <section className="mt-8">
      <div className="rounded-2xl bg-white p-6 text-center shadow-sm ring-1 ring-peach/40">
        <div className="flex items-center justify-center gap-4 text-sm text-ink/60">
          <span>คุณ · {charts.a.day.gan}{charts.a.day.zhi}</span>
          <span className="text-rosewood">×</span>
          <span>อีกฝ่าย · {charts.b.day.gan}{charts.b.day.zhi}</span>
        </div>
        <div className="my-2 text-5xl font-bold text-rosewood">{result.score}%</div>
        <div className="text-lg font-semibold text-ink">{result.bandTh}</div>
        <p className="mt-1 text-sm text-ink/70">{result.headline}</p>
        {id && (
          <button
            onClick={share}
            className="mt-4 w-full rounded-lg border border-peach/60 py-2 text-sm text-rosewood"
          >
            {copied ? "คัดลอกลิงก์แล้ว ✓" : "📤 แชร์ผลคู่นี้"}
          </button>
        )}
      </div>

      <div className="mt-4 space-y-3">
        {result.sections.slice(1).map((s, i) => (
          <div key={i} className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-peach/40">
            <p className="text-sm leading-relaxed text-ink/80">{s.body}</p>
          </div>
        ))}
      </div>

      <p className="mt-6 text-center text-xs text-ink/40">{disclaimer}</p>
    </section>
  );
}
