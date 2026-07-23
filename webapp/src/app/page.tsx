"use client";

import { useState } from "react";
import ResultView, { type Reading } from "@/components/ResultView";

// UI language — report content follows this selection too.
type UiLang = "th" | "en" | "ko";

const L: Record<UiLang, Record<string, string>> = {
  th: {
    formTitle: "✨ ใส่ข้อมูลวันเกิด",
    place: "ที่เกิด · Birthplace",
    placeTh: "🇹🇭 ประเทศไทย",
    placeKr: "🇰🇷 เกาหลี",
    placeNone: "🌍 อื่น ๆ",
    name: "ชื่อเล่น · Name",
    gender: "เพศ · Gender",
    female: "หญิง",
    male: "ชาย",
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
    formTitle: "✨ Your birth info",
    place: "Birthplace",
    placeTh: "🇹🇭 Thailand",
    placeKr: "🇰🇷 Korea",
    placeNone: "🌍 Other",
    name: "Name (optional)",
    gender: "Gender",
    female: "F",
    male: "M",
    tagline: "Korean-style saju (사주) reading from your birth date — results in 1 minute",
    compat: "💞 Couple compatibility (궁합)",
    year: "Birth year",
    month: "Month",
    day: "Day",
    hour: "Birth hour (0-23)",
    minute: "Minute (0-59)",
    unknown: "I don't know my birth time",
    solar: "* Enter your SOLAR calendar birth date (양력).",
    submit: "Read my saju",
    loading: "Calculating…",
    error: "Calculation failed — please check the birth date",
  },
  ko: {
    formTitle: "✨ 생년월일 정보 입력",
    place: "출생지",
    placeTh: "🇹🇭 태국",
    placeKr: "🇰🇷 한국",
    placeNone: "🌍 기타",
    name: "이름 (선택)",
    gender: "성별",
    female: "여성",
    male: "남성",
    tagline: "생년월일로 보는 한국식 사주 — 1분 안에 결과",
    compat: "💞 궁합 보러가기",
    year: "출생연도 (서기)",
    month: "월",
    day: "일",
    hour: "태어난 시 (0-23)",
    minute: "분 (0-59)",
    unknown: "태어난 시간 모름",
    solar: "* 양력 생일로 입력하세요.",
    submit: "내 사주 보기",
    loading: "계산 중…",
    error: "계산 실패 — 생년월일을 확인해주세요",
  },
};

export default function Home() {
  const [lang, setLang] = useState<UiLang>("th");
  const t = L[lang];
  const [form, setForm] = useState({
    name: "",
    gender: "",
    place: "th",
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
        lang, // report content follows the selected language
        name: form.name,
        gender: form.gender,
        place: form.place,
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

      <form
        onSubmit={onSubmit}
        className="overflow-hidden rounded-2xl border-2 border-ink/80 bg-white shadow-[5px_5px_0_0_rgba(58,42,51,0.85)]"
      >
        <div className="flex items-center justify-between border-b-2 border-ink/80 bg-lavender px-4 py-2.5">
          <span className="font-bold text-ink">{t.formTitle}</span>
          <span>🔮</span>
        </div>
        <div className="p-5">
        <div className="grid grid-cols-2 gap-3">
          <Field label={t.name} placeholder="มายด์" value={form.name} onChange={(v) => setForm({ ...form, name: v })} text />
          <div className="block text-sm">
            <span className="mb-1 block text-ink/70">{t.gender}</span>
            <div className="flex gap-2">
              {[
                ["F", "👩 " + t.female],
                ["M", "👨 " + t.male],
              ].map(([v, txt]) => (
                <button
                  key={v}
                  type="button"
                  onClick={() => setForm({ ...form, gender: form.gender === v ? "" : v })}
                  className={
                    "flex-1 rounded-lg border-2 py-2 text-sm font-semibold transition " +
                    (form.gender === v
                      ? "border-ink/80 bg-peach text-ink"
                      : "border-ink/20 bg-white text-ink/50")
                  }
                >
                  {txt}
                </button>
              ))}
            </div>
          </div>
        </div>
        <label className="mt-4 block text-sm">
          <span className="mb-1 block text-ink/70">{t.place}</span>
          <select
            value={form.place}
            onChange={(e) => setForm({ ...form, place: e.target.value })}
            className="w-full rounded-lg border border-peach/60 bg-cream px-3 py-2 outline-none focus:border-rosewood"
          >
            <option value="th">{t.placeTh}</option>
            <option value="kr">{t.placeKr}</option>
            <option value="none">{t.placeNone}</option>
          </select>
        </label>
        <div className="mt-4 grid grid-cols-3 gap-3">
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
        </div>
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
  text?: boolean;
  onChange: (v: string) => void;
}) {
  return (
    <label className="block text-sm">
      <span className="mb-1 block text-ink/70">{props.label}</span>
      <input
        inputMode={props.text ? "text" : "numeric"}
        placeholder={props.placeholder}
        value={props.value}
        disabled={props.disabled}
        onChange={(e) => props.onChange(e.target.value)}
        className="w-full rounded-lg border border-peach/60 bg-cream px-3 py-2 outline-none focus:border-rosewood disabled:opacity-40"
      />
    </label>
  );
}
