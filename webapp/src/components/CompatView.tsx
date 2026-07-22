"use client";

import { useState } from "react";
import { STEM_STYLE, BRANCH_STYLE } from "./hanStyles";

export interface CompatSection {
  key: string;
  title: string;
  body: string;
  locked: boolean;
}

interface Pillar {
  gan: string;
  zhi: string;
}

export interface FullChart {
  year: Pillar;
  month: Pillar;
  day: Pillar;
  hour: Pillar | null;
  dayMaster: string;
}

export interface Profile {
  name: string;
  gender: string; // "F" | "M" | ""
  year: number;
  month: number;
  day: number;
  hour: number | null;
  minute: number | null;
}

export interface CompatData {
  id?: string | null;
  profiles?: { a: Profile; b: Profile };
  relationship?: string;
  charts: { a: FullChart; b: FullChart };
  result: {
    score: number;
    intimate?: number;
    bandTh: string;
    headline: string;
    rel: string;
    lang?: string;
    sections: CompatSection[];
  };
  disclaimer: string;
}

const COMPAT_EMOJI: Record<string, string> = {
  marriage: "💍",
  conflict: "⚠️",
  longterm: "🌈",
};

const RELATIONSHIP_LABEL: Record<string, string> = {
  lovers: "💑 คนรัก · Lovers",
  married: "💒 คู่สมรส · Married",
  talking: "💌 คนคุย · Talking stage",
  friends: "🤝 เพื่อน · Friends",
  other: "✨ อื่น ๆ · Other",
};

const PILLAR_LABELS: Array<[string, string]> = [
  ["เวลา", "Hour"],
  ["วัน", "Day"],
  ["เดือน", "Month"],
  ["ปี", "Year"],
];

function fmtDate(p?: Profile): string {
  if (!p) return "";
  const d = `${p.year}.${String(p.month).padStart(2, "0")}.${String(p.day).padStart(2, "0")}`;
  const t =
    p.hour === null || p.hour === undefined
      ? ""
      : ` ${String(p.hour).padStart(2, "0")}:${String(p.minute ?? 0).padStart(2, "0")}`;
  return d + t;
}

function genderIcon(g?: string): string {
  return g === "F" ? "👩" : g === "M" ? "👨" : "🙂";
}

function PersonChart({
  chart,
  profile,
  fallbackName,
}: {
  chart: FullChart;
  profile?: Profile;
  fallbackName: string;
}) {
  // Traditional reading order: 시 → 일 → 월 → 년.
  const pillars: Array<{ p: Pillar | null; isDay?: boolean }> = [
    { p: chart.hour },
    { p: chart.day, isDay: true },
    { p: chart.month },
    { p: chart.year },
  ];
  return (
    <div className="rounded-2xl bg-cream/60 p-3">
      <div className="mb-1 text-center text-sm font-semibold text-ink">
        {genderIcon(profile?.gender)} {profile?.name || fallbackName}
      </div>
      <div className="mb-2 text-center text-[10px] text-ink/50">
        {fmtDate(profile)}{" "}
        <span className="rounded bg-peach/40 px-1 text-[9px]">สุริยคติ·양력 Solar</span>
      </div>
      <div className="grid grid-cols-4 gap-1 text-center">
        {pillars.map(({ p, isDay }, i) => (
          <div key={i} className={isDay ? "rounded-lg bg-amber-50 ring-1 ring-amber-300" : ""}>
            <div className="text-[9px] text-ink/45">
              {PILLAR_LABELS[i][0]}
              <span className="block text-[8px] text-ink/30">{PILLAR_LABELS[i][1]}</span>
            </div>
            <div className="flex flex-col gap-0.5 p-0.5">
              <span
                className={
                  "flex h-8 items-center justify-center rounded-md text-lg font-bold " +
                  (p ? STEM_STYLE[p.gan] : "bg-cream text-ink/30")
                }
              >
                {p ? p.gan : "—"}
              </span>
              <span
                className={
                  "flex h-8 items-center justify-center rounded-md text-lg font-bold " +
                  (p ? BRANCH_STYLE[p.zhi] : "bg-cream text-ink/30")
                }
              >
                {p ? p.zhi : "—"}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function CompatView({ data }: { data: CompatData }) {
  const { id, charts, profiles, relationship, disclaimer } = data;
  const [sections] = useState<CompatSection[]>(data.result.sections);
  const [pay, setPay] = useState<{ qr: string; amount: number } | null>(null);
  const [payerName, setPayerName] = useState("");
  const [contact, setContact] = useState("");
  const [claim, setClaim] = useState<{ ref: string; msg?: string } | null>(null);
  const [busy, setBusy] = useState(false);
  const [copied, setCopied] = useState(false);
  const { score, intimate, bandTh, headline } = data.result;

  function share() {
    if (!id) return;
    const url = `${window.location.origin}/compat/result/${id}`;
    navigator.clipboard?.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  async function openPayment() {
    setBusy(true);
    try {
      const res = await fetch(`/api/pay?kind=compat${id ? `&id=${id}` : ""}`);
      const d = await res.json();
      setPay({ qr: d.qr, amount: d.amount });
    } finally {
      setBusy(false);
    }
  }

  // Report the transfer → reference code; unlock only after the owner
  // verifies the credit (admin confirm) — then the share page renders open.
  async function submitClaim() {
    if (!id || !payerName.trim()) return;
    setBusy(true);
    try {
      const res = await fetch("/api/pay", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, kind: "compat", payerName, contact }),
      });
      const d = await res.json();
      if (d.paid) {
        window.location.href = `/compat/result/${id}`;
        return;
      }
      if (d.ref) {
        setPay(null);
        setClaim({ ref: d.ref });
      }
    } finally {
      setBusy(false);
    }
  }

  async function checkStatus() {
    if (!id) return;
    setBusy(true);
    try {
      const res = await fetch(`/api/pay?kind=compat&id=${id}`);
      const d = await res.json();
      if (d.paid) {
        window.location.href = `/compat/result/${id}`;
      } else {
        setClaim((c) =>
          c ? { ...c, msg: "ยังไม่ได้รับการยืนยัน · Not confirmed yet — please wait a moment" } : c
        );
      }
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="mt-8">
      {/* Score + both full charts */}
      <div className="rounded-3xl bg-white p-5 text-center shadow-sm ring-1 ring-peach/40">
        {relationship && RELATIONSHIP_LABEL[relationship] && (
          <div className="mb-2 inline-block rounded-full bg-peach/30 px-3 py-1 text-xs text-ink/70">
            {RELATIONSHIP_LABEL[relationship]}
          </div>
        )}
        <div className="bg-gradient-to-r from-rose-500 via-rosewood to-amber-500 bg-clip-text text-6xl font-bold text-transparent">
          {score}
          <span className="text-3xl">%</span>
        </div>
        <div className="mt-1 text-lg font-semibold text-ink">{bandTh}</div>
        {typeof intimate === "number" && (
          <div className="mt-1 inline-block rounded-full bg-rose-100 px-3 py-1 text-xs font-semibold text-rose-600">
            🔥 เคมีเชิงลึก (속궁합) {intimate}%
          </div>
        )}
        <p className="mt-1 text-sm text-ink/70">{headline}</p>

        <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
          <PersonChart chart={charts.a} profile={profiles?.a} fallbackName="คุณ · You" />
          <PersonChart chart={charts.b} profile={profiles?.b} fallbackName="อีกฝ่าย · Partner" />
        </div>

        {id && (
          <button
            onClick={share}
            className="mt-4 w-full rounded-xl border border-peach/60 py-2 text-sm text-rosewood transition hover:bg-peach/20"
          >
            {copied ? "คัดลอกลิงก์แล้ว ✓ Copied" : "📤 แชร์ผลคู่นี้ · Share this result"}
          </button>
        )}
      </div>

      {/* Full written analysis sits behind ONE 89฿ unlock */}
      {sections.some((s) => s.locked) && (
        <div className="mt-4 rounded-3xl bg-gradient-to-r from-rose-100 via-amber-50 to-yellow-100 p-5 text-center ring-1 ring-amber-200">
          <p className="text-sm font-semibold text-ink">
            💞 อ่านผลวิเคราะห์คู่ฉบับเต็มของคุณสองคน
          </p>
          <p className="mt-0.5 text-xs text-ink/60">
            Read the full written analysis for your pair — every point + marriage · cautions · long-term
          </p>
          {id ? (
            <button
              onClick={openPayment}
              disabled={busy}
              className="mt-3 rounded-xl bg-rosewood px-6 py-2.5 text-sm font-semibold text-white transition hover:opacity-90 disabled:opacity-50"
            >
              🔓 ปลดล็อกผลวิเคราะห์ · Unlock full analysis — 89 ฿
            </button>
          ) : (
            <a
              href="https://instagram.com/duangsaju"
              className="mt-3 inline-block rounded-xl bg-rosewood px-6 py-2.5 text-sm font-semibold text-white"
            >
              💬 สั่งซื้อทาง DM · Order via DM — 89 ฿
            </a>
          )}
        </div>
      )}

      <div className="mt-4 space-y-3">
        {sections
          .filter((s) => s.key !== "overview")
          .map((s) => (
            <div key={s.key} className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-peach/40">
              <h3 className="text-sm font-semibold text-rosewood">
                {COMPAT_EMOJI[s.key] ?? "💡"} {s.title}
              </h3>
              <p
                className={
                  "mt-1 text-sm leading-relaxed text-ink/80 " + (s.locked ? "locked-body" : "")
                }
              >
                {s.body}
              </p>
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
            <div className="mt-1 space-y-2 text-left">
              <label className="block text-xs text-ink/60">
                ชื่อผู้โอน · 입금자명 · Sender name
                <input
                  value={payerName}
                  onChange={(e) => setPayerName(e.target.value)}
                  placeholder="ชื่อบนสลิปโอนเงิน"
                  className="mt-1 w-full rounded-lg border border-peach/60 bg-cream px-3 py-2 text-sm outline-none focus:border-rosewood"
                />
              </label>
              <label className="block text-xs text-ink/60">
                อีเมล · Email (ไม่บังคับ · optional)
                <input
                  value={contact}
                  onChange={(e) => setContact(e.target.value)}
                  placeholder="you@email.com"
                  className="mt-1 w-full rounded-lg border border-peach/60 bg-cream px-3 py-2 text-sm outline-none focus:border-rosewood"
                />
              </label>
            </div>
            <button
              onClick={submitClaim}
              disabled={busy || !payerName.trim()}
              className="mt-3 w-full rounded-xl bg-rosewood py-2.5 font-semibold text-white disabled:opacity-50"
            >
              โอนแล้ว แจ้งชำระเงิน · I've transferred
            </button>
            <button onClick={() => setPay(null)} className="mt-2 text-xs text-ink/40">
              ปิด · Close
            </button>
          </div>
        </div>
      )}

      {claim && (
        <div className="fixed inset-0 z-10 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-xs rounded-3xl bg-white p-6 text-center">
            <h3 className="font-semibold text-rosewood">⏳ รอการยืนยัน · Awaiting confirmation</h3>
            <p className="mt-2 text-xs leading-relaxed text-ink/70">
              ส่งสลิปโอนเงินพร้อมรหัสอ้างอิงด้านล่างทาง DM
              แล้วหน้านี้จะปลดล็อกภายในไม่กี่นาที
              <span className="mt-1 block text-ink/50">
                Send your transfer slip + the reference code via DM — this page unlocks within minutes.
              </span>
            </p>
            <button
              onClick={() => {
                navigator.clipboard?.writeText(claim.ref);
              }}
              className="mt-3 w-full rounded-lg bg-cream px-3 py-2 font-mono text-xs text-ink"
            >
              {claim.ref.slice(0, 8).toUpperCase()}… 📋 คัดลอก · Copy
            </button>
            <a
              href="https://instagram.com/duangsaju"
              className="mt-2 block w-full rounded-xl bg-rosewood py-2.5 text-sm font-semibold text-white"
            >
              💬 ส่งสลิปทาง Instagram DM
            </a>
            <button
              onClick={checkStatus}
              disabled={busy}
              className="mt-2 w-full rounded-xl border border-peach/60 py-2 text-sm text-rosewood disabled:opacity-50"
            >
              🔄 ตรวจสอบสถานะ · Check status
            </button>
            {claim.msg && <p className="mt-2 text-xs text-amber-600">{claim.msg}</p>}
            <button onClick={() => setClaim(null)} className="mt-2 text-xs text-ink/40">
              ปิด · Close
            </button>
          </div>
        </div>
      )}

      <p className="mt-6 text-center text-xs text-ink/40">{disclaimer}</p>
    </section>
  );
}
