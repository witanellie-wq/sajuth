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
interface Result {
  chart: {
    year: Pillar;
    month: Pillar;
    day: Pillar;
    hour: Pillar | null;
    dayMaster: string;
    elementCounts: Record<string, number>;
  };
  sections: Section[];
  disclaimer: string;
}

const ELEMENT_LABEL: Record<string, string> = {
  wood: "ไม้",
  fire: "ไฟ",
  earth: "ดิน",
  metal: "ทอง",
  water: "น้ำ",
};

export default function Home() {
  const [form, setForm] = useState({
    year: "",
    month: "",
    day: "",
    hour: "",
    unknownTime: false,
  });
  const [result, setResult] = useState<Result | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    setResult(null);
    try {
      const body: Record<string, unknown> = {
        year: Number(form.year),
        month: Number(form.month),
        day: Number(form.day),
      };
      if (!form.unknownTime && form.hour !== "") body.hour = Number(form.hour);
      const res = await fetch("/api/saju", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) throw new Error("คำนวณไม่สำเร็จ กรุณาตรวจสอบวันเกิด");
      setResult(await res.json());
    } catch (err) {
      setError(err instanceof Error ? err.message : "เกิดข้อผิดพลาด");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="mx-auto max-w-xl px-5 py-10">
      <header className="mb-8 text-center">
        <h1 className="text-3xl font-bold text-rosewood">ดวงซาจู</h1>
        <p className="mt-2 text-sm text-ink/70">
          ดูดวงสไตล์เกาหลี (사주) จากวันเดือนปีเกิด — รู้ผลใน 1 นาที
        </p>
      </header>

      <form
        onSubmit={onSubmit}
        className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-peach/40"
      >
        <div className="grid grid-cols-3 gap-3">
          <Field
            label="ปีเกิด (ค.ศ.)"
            placeholder="1996"
            value={form.year}
            onChange={(v) => setForm({ ...form, year: v })}
          />
          <Field
            label="เดือน"
            placeholder="5"
            value={form.month}
            onChange={(v) => setForm({ ...form, month: v })}
          />
          <Field
            label="วันที่"
            placeholder="15"
            value={form.day}
            onChange={(v) => setForm({ ...form, day: v })}
          />
        </div>

        <div className="mt-4">
          <Field
            label="เวลาเกิด (ชั่วโมง 0-23)"
            placeholder="14"
            value={form.hour}
            disabled={form.unknownTime}
            onChange={(v) => setForm({ ...form, hour: v })}
          />
          <label className="mt-2 flex items-center gap-2 text-sm text-ink/70">
            <input
              type="checkbox"
              checked={form.unknownTime}
              onChange={(e) =>
                setForm({ ...form, unknownTime: e.target.checked })
              }
            />
            ไม่ทราบเวลาเกิด
          </label>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="mt-6 w-full rounded-xl bg-rosewood py-3 font-semibold text-white transition hover:opacity-90 disabled:opacity-50"
        >
          {loading ? "กำลังคำนวณ…" : "ดูดวงของฉัน"}
        </button>
        {error && <p className="mt-3 text-center text-sm text-red-600">{error}</p>}
      </form>

      {result && <ResultView result={result} />}
    </main>
  );
}

function Field(props: {
  label: string;
  placeholder: string;
  value: string;
  disabled?: boolean;
  onChange: (v: string) => void;
}) {
  return (
    <label className="block text-sm">
      <span className="mb-1 block text-ink/70">{props.label}</span>
      <input
        inputMode="numeric"
        placeholder={props.placeholder}
        value={props.value}
        disabled={props.disabled}
        onChange={(e) => props.onChange(e.target.value)}
        className="w-full rounded-lg border border-peach/60 bg-cream px-3 py-2 outline-none focus:border-rosewood disabled:opacity-40"
      />
    </label>
  );
}

function ResultView({ result }: { result: Result }) {
  const { chart, sections, disclaimer } = result;
  const pillars: Array<[string, Pillar | null]> = [
    ["ปี", chart.year],
    ["เดือน", chart.month],
    ["วัน", chart.day],
    ["เวลา", chart.hour],
  ];

  return (
    <section className="mt-8">
      {/* Four Pillars grid (사주 원국) */}
      <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-peach/40">
        <h2 className="mb-3 text-center text-sm font-semibold text-rosewood">
          ผังดวงซาจูของคุณ (원국)
        </h2>
        <div className="grid grid-cols-4 gap-2 text-center">
          {pillars.map(([label, p]) => (
            <div key={label} className="rounded-lg bg-cream py-3">
              <div className="text-xs text-ink/50">{label}</div>
              <div className="mt-1 text-2xl font-bold text-ink">
                {p ? p.gan : "—"}
              </div>
              <div className="text-2xl font-bold text-ink/70">
                {p ? p.zhi : "—"}
              </div>
            </div>
          ))}
        </div>

        {/* Five-element counts */}
        <div className="mt-4 flex justify-center gap-3 text-xs">
          {Object.entries(chart.elementCounts).map(([el, n]) => (
            <span key={el} className="rounded-full bg-peach/40 px-2 py-1">
              {ELEMENT_LABEL[el]} {n}
            </span>
          ))}
        </div>
      </div>

      {/* Sections */}
      <div className="mt-4 space-y-3">
        {sections.map((s) => (
          <div
            key={s.key}
            className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-peach/40"
          >
            <h3 className="font-semibold text-rosewood">{s.title}</h3>
            <p
              className={
                "mt-1 text-sm leading-relaxed text-ink/80 " +
                (s.locked ? "locked-body" : "")
              }
            >
              {s.body}
            </p>
            {s.locked && (
              <a
                href="https://instagram.com/duangsaju"
                className="mt-3 inline-block rounded-lg bg-rosewood px-4 py-2 text-sm font-semibold text-white"
              >
                🔓 ปลดล็อกผลแบบเต็ม — ทัก DM
              </a>
            )}
          </div>
        ))}
      </div>

      <p className="mt-6 text-center text-xs text-ink/40">{disclaimer}</p>
    </section>
  );
}
