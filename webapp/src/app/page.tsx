"use client";

import { useState } from "react";
import ResultView, { type Reading } from "@/components/ResultView";

// UI language only — report content is always generated in Thai.
type UiLang = "th" | "en" | "ko";

const L: Record<UiLang, Record<string, string>> = {
  th: {
    tagline: "ดูดวงสไตล์เกาหลี (사주) จากวันเดือนปีเกิด — รู้ผลใน 1 นาที",
    compat: "💞 ดูความเข้ากันกับคนพิเศษ (궁합)",
    year: "ปีเกิด (ค.ศ.) · Year",
    month: "เดือน · Month",
    day: "วันที่ · Day",
    hour: "ชั่วโมงเกิด (0-23)",
    minute: "นาที (0-59)",
    unknown: "ไม่ทราบเวลาเกิด",
    solar: "* กรอกวันเกิดแบบสุริยคติ (ค.ศ.) · Solar calendar (양력)",
    submit: "ดูดวงของฉัน",
    loading: "กำลังคำนวณ…",
    error: "คำนวณไม่สำเร็จ กรุณาตรวจสอบวันเกิด",
  },
  en: {
    tagline: "Korean-style saju (사주) reading from your birth date — results in 1 minute",
    compat: "💞 Couple compatibility (궁합)",
    year: "Birth year",
    month: "Month",
    day: "Day",
    hour: "Birth hour (0-23)",
    minute: "Minute (0-59)",
    unknown: "I don't know my birth time",
    solar: "* Enter your SOLAR calendar birth date (양력). Reading text is in Thai.",
    submit: "Read my saju",
    loading: "Calculating…",
    error: "Calculation failed — please check the birth date",
  },
  ko: {
    tagline: "생년월일로 보는 한국식 사주 — 1분 안에 결과",
    compat: "💞 궁합 보러가기",
    year: "출생연도 (서기)",
    month: "월",
    day: "일",
    hour: "태어난 시 (0-23)",
    minute: "분 (0-59)",
    unknown: "태어난 시간 모름",
    solar: "* 양력 생일로 입력하세요. 해석 결과는 태국어로 제공됩니다.",
    submit: "내 사주 보기",
    loading: "계산 중…",
    error: "계산 실패 — 생년월일을 확인해주세요",
  },
};

export default function Home() {
  const [lang, setLang] = useState<UiLang>("th");
  const t = L[lang];
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
        lang: "th", // report content is always Thai
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
      if (!res.ok) throw new Error(t.error);
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
          {(["th", "en", "ko"] as UiLang[]).map((v) => (
            <button
              key={v}
              onClick={() => setLang(v)}
              className={
                "px-3 py-1 " + (lang === v ? "bg-rosewood text-white" : "text-ink/60")
              }
            >
              {v === "th" ? "ไทย" : v === "en" ? "EN" : "한국어"}
            </button>
          ))}
        </div>
      </div>

      <header className="mb-8 text-center">
        <div className="mb-1 text-3xl">🔮</div>
        <h1 className="bg-gradient-to-r from-rose-500 via-rosewood to-amber-500 bg-clip-text text-3xl font-bold text-transparent">
          ดวงซาจู
        </h1>
        <p className="mt-2 text-sm text-ink/70">{t.tagline}</p>
        <a
          href="/compat"
          className="mt-3 inline-block rounded-full border border-peach/60 px-4 py-1.5 text-sm text-rosewood"
        >
          {t.compat}
        </a>
      </header>

      <form onSubmit={onSubmit} className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-peach/40">
        <div className="grid grid-cols-3 gap-3">
          <Field label={t.year} placeholder="1996" value={form.year} onChange={(v) => setForm({ ...form, year: v })} />
          <Field label={t.month} placeholder="5" value={form.month} onChange={(v) => setForm({ ...form, month: v })} />
          <Field label={t.day} placeholder="15" value={form.day} onChange={(v) => setForm({ ...form, day: v })} />
        </div>

        <div className="mt-4 grid grid-cols-2 gap-3">
          <Field
            label={t.hour}
            placeholder="14"
            value={form.hour}
            disabled={form.unknownTime}
            onChange={(v) => setForm({ ...form, hour: v })}
          />
          <Field
            label={t.minute}
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
          {t.unknown}
        </label>

        <p className="mt-3 text-center text-[11px] text-ink/50">{t.solar}</p>

        <button
          type="submit"
          disabled={loading}
          className="mt-4 w-full rounded-xl bg-rosewood py-3 font-semibold text-white transition hover:opacity-90 disabled:opacity-50"
        >
          {loading ? t.loading : t.submit}
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
