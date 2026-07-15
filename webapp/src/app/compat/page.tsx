"use client";

import { useState } from "react";

interface Person {
  year: string;
  month: string;
  day: string;
  hour: string;
  unknownTime: boolean;
}
const empty: Person = { year: "", month: "", day: "", hour: "", unknownTime: false };

interface CompatResult {
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

function toInput(p: Person) {
  const o: Record<string, number> = {
    year: Number(p.year),
    month: Number(p.month),
    day: Number(p.day),
  };
  if (!p.unknownTime && p.hour !== "") o.hour = Number(p.hour);
  return o;
}

export default function Compat() {
  const [a, setA] = useState<Person>(empty);
  const [b, setB] = useState<Person>(empty);
  const [res, setRes] = useState<CompatResult | null>(null);
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
        body: JSON.stringify({ a: toInput(a), b: toInput(b) }),
      });
      if (!r.ok) throw new Error("คำนวณไม่สำเร็จ กรุณาตรวจสอบวันเกิดทั้งสองฝ่าย");
      setRes(await r.json());
    } catch (err) {
      setError(err instanceof Error ? err.message : "เกิดข้อผิดพลาด");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="mx-auto max-w-xl px-5 py-10">
      <header className="mb-8 text-center">
        <a href="/" className="text-3xl font-bold text-rosewood">
          ดวงซาจู
        </a>
        <p className="mt-2 text-sm text-ink/70">ดูดวงความเข้ากัน (궁합) ของคุณสองคน</p>
      </header>

      <form onSubmit={onSubmit} className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-peach/40">
        <PersonFields label="คุณ" p={a} onChange={setA} />
        <div className="my-5 flex items-center justify-center">
          <span className="text-2xl text-rosewood">💞</span>
        </div>
        <PersonFields label="อีกฝ่าย" p={b} onChange={setB} />

        <button
          type="submit"
          disabled={loading}
          className="mt-6 w-full rounded-xl bg-rosewood py-3 font-semibold text-white transition hover:opacity-90 disabled:opacity-50"
        >
          {loading ? "กำลังคำนวณ…" : "ดูความเข้ากัน"}
        </button>
        {error && <p className="mt-3 text-center text-sm text-red-600">{error}</p>}
      </form>

      {res && <CompatView res={res} />}
    </main>
  );
}

function PersonFields({
  label,
  p,
  onChange,
}: {
  label: string;
  p: Person;
  onChange: (p: Person) => void;
}) {
  return (
    <fieldset>
      <legend className="mb-2 text-sm font-semibold text-rosewood">{label}</legend>
      <div className="grid grid-cols-3 gap-3">
        <Field label="ปี (ค.ศ.)" placeholder="1996" value={p.year} onChange={(v) => onChange({ ...p, year: v })} />
        <Field label="เดือน" placeholder="5" value={p.month} onChange={(v) => onChange({ ...p, month: v })} />
        <Field label="วันที่" placeholder="15" value={p.day} onChange={(v) => onChange({ ...p, day: v })} />
      </div>
      <div className="mt-3">
        <Field
          label="เวลา (0-23)"
          placeholder="14"
          value={p.hour}
          disabled={p.unknownTime}
          onChange={(v) => onChange({ ...p, hour: v })}
        />
        <label className="mt-2 flex items-center gap-2 text-xs text-ink/60">
          <input
            type="checkbox"
            checked={p.unknownTime}
            onChange={(e) => onChange({ ...p, unknownTime: e.target.checked })}
          />
          ไม่ทราบเวลาเกิด
        </label>
      </div>
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

function CompatView({ res }: { res: CompatResult }) {
  const { result, charts, disclaimer } = res;
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
