"use client";

import { useState } from "react";
import ResultView, { type Reading } from "@/components/ResultView";

export default function Home() {
  const [form, setForm] = useState({
    year: "",
    month: "",
    day: "",
    hour: "",
    unknownTime: false,
  });
  const [result, setResult] = useState<Reading | null>(null);
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

      <form onSubmit={onSubmit} className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-peach/40">
        <div className="grid grid-cols-3 gap-3">
          <Field label="ปีเกิด (ค.ศ.)" placeholder="1996" value={form.year} onChange={(v) => setForm({ ...form, year: v })} />
          <Field label="เดือน" placeholder="5" value={form.month} onChange={(v) => setForm({ ...form, month: v })} />
          <Field label="วันที่" placeholder="15" value={form.day} onChange={(v) => setForm({ ...form, day: v })} />
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
              onChange={(e) => setForm({ ...form, unknownTime: e.target.checked })}
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

      {result && <ResultView initial={result} />}
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
