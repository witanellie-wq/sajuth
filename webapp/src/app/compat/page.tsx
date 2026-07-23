"use client";

import { useState } from "react";
import CompatView, { type CompatData } from "@/components/CompatView";
import { saveHistory, loadHistory, type HistoryEntry } from "@/components/history";
import { useEffect } from "react";

type Lang = "th" | "en" | "ko";


interface Person {
  name: string;
  gender: string; // "F" | "M" | ""
  place: string; // "th" | "kr" | "none"
  year: string;
  month: string;
  day: string;
  hour: string;
  minute: string;
  unknownTime: boolean;
}
const empty: Person = {
  name: "",
  gender: "",
  place: "th",
  year: "",
  month: "",
  day: "",
  hour: "",
  minute: "",
  unknownTime: false,
};

const RELATIONSHIPS: Array<{ value: string; th: string; en: string; ko: string }> = [
  { value: "lovers", th: "💑 คนรัก", en: "💑 Lovers", ko: "💑 연인" },
  { value: "married", th: "💒 คู่สมรส", en: "💒 Married", ko: "💒 부부" },
  { value: "talking", th: "💌 คนคุย", en: "💌 Talking stage", ko: "💌 썸" },
  { value: "friends", th: "🤝 เพื่อน", en: "🤝 Friends", ko: "🤝 친구" },
  { value: "coworkers", th: "💼 เพื่อนร่วมงาน", en: "💼 Coworkers", ko: "💼 직장동료" },
  { value: "other", th: "✨ อื่น ๆ", en: "✨ Other", ko: "✨ 기타" },
];

function toInput(p: Person) {
  const o: Record<string, unknown> = {
    year: Number(p.year),
    month: Number(p.month),
    day: Number(p.day),
    name: p.name,
    gender: p.gender,
    place: p.place,
  };
  if (!p.unknownTime && p.hour !== "") {
    o.hour = Number(p.hour);
    if (p.minute !== "") o.minute = Number(p.minute);
  }
  return o;
}

export default function Compat() {
  const [lang, setLang] = useState<Lang>("th");
  const tr = (th: string, en: string, ko: string) => (lang === "th" ? th : lang === "en" ? en : ko);
  const [relationship, setRelationship] = useState("lovers");
  const [a, setA] = useState<Person>(empty);
  const [b, setB] = useState<Person>(empty);
  const [res, setRes] = useState<CompatData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  useEffect(() => setHistory(loadHistory()), []);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    setRes(null);
    try {
      const r = await fetch("/api/compat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ a: toInput(a), b: toInput(b), relationship, lang }),
      });
      if (!r.ok)
        throw new Error(
          tr("คำนวณไม่สำเร็จ กรุณาตรวจสอบวันเกิดทั้งสองฝ่าย", "Calculation failed — please check both birth dates", "계산 실패 — 두 사람의 생년월일을 확인해주세요")
        );
      const data = await r.json();
      setRes(data);
      if (data.id) {
        saveHistory({
          id: data.id,
          kind: "compat",
          label: `💞 ${a.name || "A"} × ${b.name || "B"}`,
          url: `/compat/result/${data.id}`,
        });
        setHistory(loadHistory());
      }
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
          {(["th", "en", "ko"] as Lang[]).map((v) => (
            <button
              key={v}
              onClick={() => setLang(v)}
              className={"px-3 py-1 " + (lang === v ? "bg-rosewood text-white" : "text-ink/60")}
            >
              {v === "th" ? "ไทย" : v === "en" ? "EN" : "한국어"}
            </button>
          ))}
        </div>
      </div>

      <header className="mb-8 text-center">
        <div className="mb-1 text-3xl">💞</div>
        <a
          href="/"
          className="bg-gradient-to-r from-rose-500 via-rosewood to-amber-500 bg-clip-text text-3xl font-bold text-transparent"
        >
          ดวงซาจู
        </a>
        <p className="mt-2 text-sm text-ink/70">
          {tr("ดูดวงความเข้ากัน (궁합) ของคุณสองคน", "Couple compatibility (궁합) for the two of you", "두 사람의 궁합 보기")}
        </p>
      </header>

      <form
        onSubmit={onSubmit}
        className="overflow-hidden rounded-2xl border-2 border-ink/80 bg-white shadow-[5px_5px_0_0_rgba(58,42,51,0.85)]"
      >
        <div className="flex items-center justify-between border-b-2 border-ink/80 bg-lavender px-4 py-2.5">
          <span className="font-bold text-ink">
            {tr("✨ ใส่ข้อมูลของทั้งคู่", "✨ Both of your birth info", "✨ 두 사람 정보 입력")}
          </span>
          <span>💞</span>
        </div>
        <div className="p-5">
        {/* Relationship */}
        <label className="block text-sm">
          <span className="mb-1 block text-ink/70">
            {tr("ความสัมพันธ์ · Relationship", "Relationship", "관계")}
          </span>
          <select
            value={relationship}
            onChange={(e) => setRelationship(e.target.value)}
            className="w-full rounded-lg border border-peach/60 bg-cream px-3 py-2 outline-none focus:border-rosewood"
          >
            {RELATIONSHIPS.map((r) => (
              <option key={r.value} value={r.value}>
                {lang === "th" ? r.th : lang === "en" ? r.en : r.ko}
              </option>
            ))}
          </select>
        </label>

        <div className="my-4 border-t border-peach/30" />
        <PersonFields label={tr("คุณ · You", "You", "나")} p={a} onChange={setA} lang={lang} />
        <div className="my-5 flex items-center justify-center">
          <span className="text-2xl">💞</span>
        </div>
        <PersonFields
          label={tr("อีกฝ่าย · Partner", "Partner", "상대방")}
          p={b}
          onChange={setB}
          lang={lang}
        />

        <p className="mt-4 text-center text-[11px] text-ink/50">
          {tr("* กรอกวันเกิดแบบสุริยคติ (ค.ศ.) · Solar calendar (양력)", "* Enter SOLAR calendar dates (양력).", "* 양력 생일로 입력하세요.")}
        </p>

        <button
          type="submit"
          disabled={loading}
          className="mt-4 w-full rounded-xl bg-rosewood py-3 font-semibold text-white transition hover:opacity-90 disabled:opacity-50"
        >
          {loading ? tr("กำลังคำนวณ…", "Calculating…", "계산 중…") : tr("ดูความเข้ากัน · Check compatibility", "Check compatibility", "궁합 보기")}
        </button>
        {error && <p className="mt-3 text-center text-sm text-red-600">{error}</p>}
        </div>
      </form>

      {res && <CompatView data={res} />}

      {!res && history.length > 0 && (
        <section className="mt-6">
          <h2 className="mb-2 text-center text-xs font-semibold text-ink/50">
            🕘 {tr("ผลล่าสุดของฉัน", "My recent results", "내 최근 결과")}
          </h2>
          <div className="flex flex-wrap justify-center gap-2">
            {history.map((h) => (
              <a
                key={h.id}
                href={h.url}
                className="rounded-full border border-peach/60 bg-white px-3 py-1.5 text-xs text-ink/70 hover:border-rosewood"
              >
                {h.label}
              </a>
            ))}
          </div>
        </section>
      )}
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

      <div className="grid grid-cols-2 gap-3">
        <label className="block text-sm">
          <span className="mb-1 block text-ink/70">
            {lang === "th" ? "ชื่อเล่น · Name" : lang === "en" ? "Name (optional)" : "이름 (선택)"}
          </span>
          <input
            placeholder={lang === "ko" ? "이름" : "Mind"}
            value={p.name}
            onChange={(e) => onChange({ ...p, name: e.target.value })}
            className="w-full rounded-lg border border-peach/60 bg-cream px-3 py-2 outline-none focus:border-rosewood"
          />
        </label>
        <div className="block text-sm">
          <span className="mb-1 block text-ink/70">{lang === "th" ? "เพศ · Gender" : lang === "en" ? "Gender" : "성별"}</span>
          <div className="flex gap-2">
            {[
              ["F", "👩 " + (lang === "th" ? "หญิง" : lang === "en" ? "F" : "여")],
              ["M", "👨 " + (lang === "th" ? "ชาย" : lang === "en" ? "M" : "남")],
            ].map(([v, txt]) => (
              <button
                key={v}
                type="button"
                onClick={() => onChange({ ...p, gender: p.gender === v ? "" : v })}
                className={
                  "flex-1 rounded-lg border py-2 text-sm transition " +
                  (p.gender === v
                    ? "border-rosewood bg-rosewood text-white"
                    : "border-peach/60 bg-cream text-ink/70")
                }
              >
                {txt}
              </button>
            ))}
          </div>
        </div>
      </div>

      <label className="mt-3 block text-sm">
        <span className="mb-1 block text-ink/70">
          {lang === "th" ? "ที่เกิด · Birthplace" : lang === "en" ? "Birthplace" : "출생지"}
        </span>
        <select
          value={p.place}
          onChange={(e) => onChange({ ...p, place: e.target.value })}
          className="w-full rounded-lg border border-peach/60 bg-cream px-3 py-2 outline-none focus:border-rosewood"
        >
          <option value="th">{lang === "th" ? "🇹🇭 ประเทศไทย" : lang === "en" ? "🇹🇭 Thailand" : "🇹🇭 태국"}</option>
          <option value="kr">{lang === "th" ? "🇰🇷 เกาหลี" : lang === "en" ? "🇰🇷 Korea" : "🇰🇷 한국"}</option>
          <option value="none">{lang === "th" ? "🌍 อื่น ๆ" : lang === "en" ? "🌍 Other" : "🌍 기타"}</option>
        </select>
      </label>
      <div className="mt-3 grid grid-cols-3 gap-3">
        <Field
          label={lang === "th" ? "ปี (ค.ศ.) · Year" : lang === "en" ? "Year" : "연도(서기)"}
          placeholder="1996"
          value={p.year}
          onChange={(v) => onChange({ ...p, year: v })}
        />
        <Field
          label={lang === "th" ? "เดือน · Month" : lang === "en" ? "Month" : "월"}
          placeholder="5"
          value={p.month}
          onChange={(v) => onChange({ ...p, month: v })}
        />
        <Field
          label={lang === "th" ? "วันที่ · Day" : lang === "en" ? "Day" : "일"}
          placeholder="15"
          value={p.day}
          onChange={(v) => onChange({ ...p, day: v })}
        />
      </div>
      <div className="mt-3 grid grid-cols-2 gap-3">
        <Field
          label={lang === "th" ? "ชั่วโมง (0-23) · Hour" : lang === "en" ? "Hour (0-23)" : "시 (0-23)"}
          placeholder="14"
          value={p.hour}
          disabled={p.unknownTime}
          onChange={(v) => onChange({ ...p, hour: v })}
        />
        <Field
          label={lang === "th" ? "นาที (0-59) · Minute" : lang === "en" ? "Minute (0-59)" : "분 (0-59)"}
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
        {lang === "th" ? "ไม่ทราบเวลาเกิด · Unknown time" : lang === "en" ? "Unknown birth time" : "태어난 시간 모름"}
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
