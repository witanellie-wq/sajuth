"use client";

import { useState } from "react";
import ResultView, { type Reading } from "@/components/ResultView";

type Lang = "th" | "en";

export default function Home() {
  const [lang, setLang] = useState<Lang>("th");
  const [form, setForm] = useState({
    year: "",
    month: "",
    day: "",
    hour: "",
    minute: "",
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
        lang,
      };
      if (!form.unknownTime && form.hour !== "") {
        body.hour = Number(form.hour);
        if (form.minute !== "") body.minute = Number(form.minute);
      }
      const res = await fetch("/api/saju", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok)
        throw new Error(
          lang === "th"
            ? "คำนวณไม่สำเร็จ กรุณาตรวจสอบวันเกิด · Calculation failed, please check the birth date"
            : "Calculation failed — please check the birth date"
        );
      setResult(await res.json());
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="mx-auto max-w-xl px-5 py-10">
      <div className="mb-4 flex justify-end">
        <div className="flex overflow-hidden rounded-full border border-peach/60 text-xs">
          <button
            onClick={() => setLang("th")}
            className={
              "px-3 py-1 " + (lang === "th" ? "bg-rosewood text-white" : "text-ink/60")
            }
          >
            ไทย
          </button>
          <button
            onClick={() => setLang("en")}
            className={
              "px-3 py-1 " + (lang === "en" ? "bg-rosewood text-white" : "text-ink/60")
            }
          >
            EN
          </button>
        </div>
      </div>

      <header className="mb-8 text-center">
        <h1 className="text-3xl font-bold text-rosewood">ดวงซาจู</h1>
        <p className="mt-2 text-sm text-ink/70">
          {lang === "th"
            ? "ดูดวงสไตล์เกาหลี (사주) จากวันเดือนปีเกิด — รู้ผลใน 1 นาที"
            : "Korean-style saju (사주) reading from your birth date — results in 1 minute"}
        </p>
        <a
          href="/compat"
          className="mt-3 inline-block rounded-full border border-peach/60 px-4 py-1.5 text-sm text-rosewood"
        >
          💞 {lang === "th" ? "ดูความเข้ากันกับคนพิเศษ (궁합)" : "Couple compatibility (궁합)"}
        </a>
      </header>

      <form onSubmit={onSubmit} className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-peach/40">
        <div className="grid grid-cols-3 gap-3">
          <Field
            label={lang === "th" ? "ปีเกิด (ค.ศ.) · Year" : "Birth year"}
            placeholder="1996"
            value={form.year}
            onChange={(v) => setForm({ ...form, year: v })}
          />
          <Field
            label={lang === "th" ? "เดือน · Month" : "Month"}
            placeholder="5"
            value={form.month}
            onChange={(v) => setForm({ ...form, month: v })}
          />
          <Field
            label={lang === "th" ? "วันที่ · Day" : "Day"}
            placeholder="15"
            value={form.day}
            onChange={(v) => setForm({ ...form, day: v })}
          />
        </div>

        <div className="mt-4 grid grid-cols-2 gap-3">
          <Field
            label={lang === "th" ? "ชั่วโมงเกิด (0-23) · Hour" : "Birth hour (0-23)"}
            placeholder="14"
            value={form.hour}
            disabled={form.unknownTime}
            onChange={(v) => setForm({ ...form, hour: v })}
          />
          <Field
            label={lang === "th" ? "นาที (0-59) · Minute" : "Minute (0-59)"}
            placeholder="30"
            value={form.minute}
            disabled={form.unknownTime}
            onChange={(v) => setForm({ ...form, minute: v })}
          />
        </div>
        <label className="mt-2 flex items-center gap-2 text-sm text-ink/70">
          <input
            type="checkbox"
            checked={form.unknownTime}
            onChange={(e) => setForm({ ...form, unknownTime: e.target.checked })}
          />
          {lang === "th" ? "ไม่ทราบเวลาเกิด · Unknown birth time" : "I don't know my birth time"}
        </label>

        <button
          type="submit"
          disabled={loading}
          className="mt-6 w-full rounded-xl bg-rosewood py-3 font-semibold text-white transition hover:opacity-90 disabled:opacity-50"
        >
          {loading
            ? lang === "th"
              ? "กำลังคำนวณ…"
              : "Calculating…"
            : lang === "th"
            ? "ดูดวงของฉัน · Read my saju"
            : "Read my saju"}
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
