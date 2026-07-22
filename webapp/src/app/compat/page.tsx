"use client";

import { useState } from "react";
import CompatView, { type CompatData } from "@/components/CompatView";

type Lang = "th" | "en";

interface Person {
  year: string;
  month: string;
  day: string;
  hour: string;
  minute: string;
  unknownTime: boolean;
}
const empty: Person = { year: "", month: "", day: "", hour: "", minute: "", unknownTime: false };

function toInput(p: Person) {
  const o: Record<string, number> = {
    year: Number(p.year),
    month: Number(p.month),
    day: Number(p.day),
  };
  if (!p.unknownTime && p.hour !== "") {
    o.hour = Number(p.hour);
    if (p.minute !== "") o.minute = Number(p.minute);
  }
  return o;
}

export default function Compat() {
  const [lang, setLang] = useState<Lang>("th");
  const [a, setA] = useState<Person>(empty);
  const [b, setB] = useState<Person>(empty);
  const [res, setRes] = useState<CompatData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    setRes(null);
    try {
      const r = await fetch("/api/compat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ a: toInput(a), b: toInput(b), lang }),
      });
      if (!r.ok)
        throw new Error(
          lang === "th"
            ? "คำนวณไม่สำเร็จ กรุณาตรวจสอบวันเกิดทั้งสองฝ่าย"
            : "Calculation failed — please check both birth dates"
        );
      setRes(await r.json());
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
            className={"px-3 py-1 " + (lang === "th" ? "bg-rosewood text-white" : "text-ink/60")}
          >
            ไทย
          </button>
          <button
            onClick={() => setLang("en")}
            className={"px-3 py-1 " + (lang === "en" ? "bg-rosewood text-white" : "text-ink/60")}
          >
            EN
          </button>
        </div>
      </div>

      <header className="mb-8 text-center">
        <a href="/" className="text-3xl font-bold text-rosewood">
          ดวงซาจู
        </a>
        <p className="mt-2 text-sm text-ink/70">
          {lang === "th"
            ? "ดูดวงความเข้ากัน (궁합) ของคุณสองคน"
            : "Couple compatibility (궁합) for the two of you"}
        </p>
      </header>

      <form onSubmit={onSubmit} className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-peach/40">
        <PersonFields label={lang === "th" ? "คุณ · You" : "You"} p={a} onChange={setA} lang={lang} />
        <div className="my-5 flex items-center justify-center">
          <span className="text-2xl text-rosewood">💞</span>
        </div>
        <PersonFields
          label={lang === "th" ? "อีกฝ่าย · Partner" : "Partner"}
          p={b}
          onChange={setB}
          lang={lang}
        />

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
            ? "ดูความเข้ากัน · Check compatibility"
            : "Check compatibility"}
        </button>
        {error && <p className="mt-3 text-center text-sm text-red-600">{error}</p>}
      </form>

      {res && <CompatView data={res} />}
    </main>
  );
}

function PersonFields({
  label,
  p,
  onChange,
  lang,
}: {
  label: string;
  p: Person;
  onChange: (p: Person) => void;
  lang: Lang;
}) {
  return (
    <fieldset>
      <legend className="mb-2 text-sm font-semibold text-rosewood">{label}</legend>
      <div className="grid grid-cols-3 gap-3">
        <Field
          label={lang === "th" ? "ปี (ค.ศ.) · Year" : "Year"}
          placeholder="1996"
          value={p.year}
          onChange={(v) => onChange({ ...p, year: v })}
        />
        <Field
          label={lang === "th" ? "เดือน · Month" : "Month"}
          placeholder="5"
          value={p.month}
          onChange={(v) => onChange({ ...p, month: v })}
        />
        <Field
          label={lang === "th" ? "วันที่ · Day" : "Day"}
          placeholder="15"
          value={p.day}
          onChange={(v) => onChange({ ...p, day: v })}
        />
      </div>
      <div className="mt-3 grid grid-cols-2 gap-3">
        <Field
          label={lang === "th" ? "ชั่วโมง (0-23) · Hour" : "Hour (0-23)"}
          placeholder="14"
          value={p.hour}
          disabled={p.unknownTime}
          onChange={(v) => onChange({ ...p, hour: v })}
        />
        <Field
          label={lang === "th" ? "นาที (0-59) · Minute" : "Minute (0-59)"}
          placeholder="30"
          value={p.minute}
          disabled={p.unknownTime}
          onChange={(v) => onChange({ ...p, minute: v })}
        />
      </div>
      <label className="mt-2 flex items-center gap-2 text-xs text-ink/60">
        <input
          type="checkbox"
          checked={p.unknownTime}
          onChange={(e) => onChange({ ...p, unknownTime: e.target.checked })}
        />
        {lang === "th" ? "ไม่ทราบเวลาเกิด · Unknown time" : "Unknown birth time"}
      </label>
    </fieldset>
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
