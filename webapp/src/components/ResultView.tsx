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
export interface Reading {
  id: string | null;
  name?: string;
  chart: {
    year: Pillar;
    month: Pillar;
    day: Pillar;
    hour: Pillar | null;
    dayMaster: string;
    elementCounts: Record<string, number>;
  };
  sections: Section[];
  paid?: boolean;
  lang?: string;
  disclaimer: string;
}

import { STEM_STYLE, BRANCH_STYLE, ELEMENT_CHIP } from "./hanStyles";

const ELEMENT_LABEL: Record<string, string> = {
  wood: "ไม้·Wood",
  fire: "ไฟ·Fire",
  earth: "ดิน·Earth",
  metal: "ทอง·Metal",
  water: "น้ำ·Water",
};

const SECTION_EMOJI: Record<string, string> = {
  personality: "✨",
  elements: "🎨",
  strength: "⚡",
  today: "🍀",
  love: "💖",
  career: "💼",
  wealth: "💰",
  luck10: "🔮",
};

function HanBlock({ ch, style, star }: { ch: string; style?: string; star?: boolean }) {
  return (
    <div
      className={
        "relative flex h-12 items-center justify-center rounded-xl text-2xl font-bold shadow-sm " +
        (style ?? "bg-cream text-ink/40")
      }
    >
      {star && <span className="absolute -top-2 -right-1 text-xs">⭐</span>}
      {ch}
    </div>
  );
}

export default function ResultView({ initial }: { initial: Reading }) {
  const [reading] = useState<Reading>(initial);
  const [pay, setPay] = useState<{ qr: string; amount: number } | null>(null);
  const [payerName, setPayerName] = useState("");
  const [contact, setContact] = useState("");
  const [claim, setClaim] = useState<{ ref: string; msg?: string; isPack?: boolean } | null>(null);
  const [payKind, setPayKind] = useState<"reading" | "pack">("reading");
  const [amuletInput, setAmuletInput] = useState("");
  const [amuletMsg, setAmuletMsg] = useState("");
  const [busy, setBusy] = useState(false);
  const [copied, setCopied] = useState(false);

  const { chart, sections, disclaimer, id } = reading;

  // Traditional reading order: 시 → 일 → 월 → 년 (hour, day, month, year).
  const pillars: Array<{ label: [string, string]; p: Pillar | null; isDay?: boolean }> = [
    { label: ["เวลา", "Hour"], p: chart.hour },
    { label: ["วัน", "Day"], p: chart.day, isDay: true },
    { label: ["เดือน", "Month"], p: chart.month },
    { label: ["ปี", "Year"], p: chart.year },
  ];

  async function openPayment(kind: "reading" | "pack" = "reading") {
    setBusy(true);
    setPayKind(kind);
    try {
      const q = kind === "pack" ? "kind=pack" : `kind=reading${id ? `&id=${id}` : ""}`;
      const res = await fetch(`/api/pay?${q}`);
      const data = await res.json();
      setPay({ qr: data.qr, amount: data.amount });
    } finally {
      setBusy(false);
    }
  }

  // Report the transfer → get a reference code. Actual unlock happens only
  // after the owner verifies the bank credit (admin confirm) — the share page
  // then renders unlocked.
  async function submitClaim() {
    if (!payerName.trim()) return;
    setBusy(true);
    try {
      if (payKind === "pack") {
        const res = await fetch("/api/amulet", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: "buy", payerName, contact }),
        });
        const data = await res.json();
        if (data.code) {
          setPay(null);
          setClaim({ ref: data.code, isPack: true });
        }
        return;
      }
      if (!id) return;
      const res = await fetch("/api/pay", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, kind: "reading", payerName, contact }),
      });
      const data = await res.json();
      if (data.paid) {
        window.location.href = `/result/${id}`;
        return;
      }
      if (data.ref) {
        setPay(null);
        setClaim({ ref: data.ref });
      }
    } finally {
      setBusy(false);
    }
  }

  async function checkStatus() {
    setBusy(true);
    try {
      if (claim?.isPack) {
        const res = await fetch(`/api/amulet?code=${claim.ref}`);
        const data = await res.json();
        if (data.paid && id) {
          await redeemAmulet(claim.ref);
        } else if (data.paid) {
          setClaim((c) => (c ? { ...c, msg: "✅ ยันต์พร้อมใช้แล้ว! · Amulets ready" } : c));
        } else {
          setClaim((c) =>
            c ? { ...c, msg: "ยังไม่ได้รับการยืนยัน · Not confirmed yet" } : c
          );
        }
        return;
      }
      if (!id) return;
      const res = await fetch(`/api/pay?kind=reading&id=${id}`);
      const data = await res.json();
      if (data.paid) {
        window.location.href = `/result/${id}`;
      } else {
        setClaim((c) =>
          c ? { ...c, msg: "ยังไม่ได้รับการยืนยัน · Not confirmed yet — please wait a moment" } : c
        );
      }
    } finally {
      setBusy(false);
    }
  }

  async function redeemAmulet(code: string) {
    if (!id || !code.trim()) return;
    setBusy(true);
    setAmuletMsg("");
    try {
      const res = await fetch("/api/amulet", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "redeem", code: code.trim(), id, kind: "reading" }),
      });
      const data = await res.json();
      if (data.ok) {
        window.location.href = `/result/${id}`;
      } else {
        setAmuletMsg("รหัสไม่ถูกต้องหรือยันต์ไม่พอ · Invalid code or not enough amulets");
      }
    } finally {
      setBusy(false);
    }
  }

  function share() {
    if (!id) return;
    const url = `${window.location.origin}/result/${id}`;
    navigator.clipboard?.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <section className="mt-8">
      {/* Four Pillars grid (사주 원국) — 시일월년 order */}
      <div className="rounded-3xl bg-white p-5 shadow-sm ring-1 ring-peach/40">
        <h2 className="mb-3 text-center text-sm font-semibold text-rosewood">
          🧧 {reading.name ? `ผังดวงซาจูของ ${reading.name}` : "ผังดวงซาจูของคุณ"} · Four
          Pillars (원국)
        </h2>
        <div className="grid grid-cols-4 gap-2 text-center">
          {pillars.map(({ label, p, isDay }) => (
            <div
              key={label[1]}
              className={
                "rounded-2xl p-2 " +
                (isDay ? "bg-amber-50 ring-2 ring-amber-300" : "bg-cream/60")
              }
            >
              <div className="mb-1 text-xs text-ink/50">
                {label[0]}
                <span className="block text-[10px] text-ink/35">{label[1]}</span>
              </div>
              <div className="flex flex-col gap-1.5">
                <HanBlock
                  ch={p ? p.gan : "—"}
                  style={p ? STEM_STYLE[p.gan] : undefined}
                  star={isDay}
                />
                <HanBlock ch={p ? p.zhi : "—"} style={p ? BRANCH_STYLE[p.zhi] : undefined} />
              </div>
            </div>
          ))}
        </div>
        <p className="mt-2 text-center text-[10px] text-ink/40">
          ⭐ = ธาตุประจำตัวคุณ · your Day Master (일간)
        </p>

        {/* Five-element counts */}
        <div className="mt-3 flex flex-wrap justify-center gap-2 text-xs">
          {Object.entries(chart.elementCounts).map(([el, n]) => (
            <span key={el} className={"rounded-full px-2.5 py-1 font-medium " + ELEMENT_CHIP[el]}>
              {ELEMENT_LABEL[el]} {n}
            </span>
          ))}
        </div>

        {id && (
          <button
            onClick={share}
            className="mt-4 w-full rounded-xl border border-peach/60 py-2 text-sm text-rosewood transition hover:bg-peach/20"
          >
            {copied ? "คัดลอกลิงก์แล้ว ✓ Copied" : "📤 แชร์ผลดวงนี้ · Share this reading"}
          </button>
        )}
      </div>

      {/* Sections — one 49฿ unlock opens every locked category at once */}
      <div className="mt-4 space-y-3">
        {sections.map((s, i) => {
          const firstLocked = s.locked && !sections.slice(0, i).some((x) => x.locked);
          return (
            <div key={s.key}>
              {firstLocked && (
                <div className="mb-3 rounded-3xl bg-gradient-to-r from-rose-100 via-amber-50 to-yellow-100 p-5 text-center ring-1 ring-amber-200">
                  <p className="text-sm font-semibold text-ink">
                    💖💼💰🔮 ปลดล็อกครบทุกหมวดในครั้งเดียว
                  </p>
                  <p className="mt-0.5 text-xs text-ink/60">
                    Unlock all 4 sections at once — love · career · wealth · 10-year luck
                  </p>
                  {id ? (
                    <>
                      <button
                        onClick={() => openPayment("reading")}
                        disabled={busy}
                        className="mt-3 rounded-xl bg-rosewood px-6 py-2.5 text-sm font-semibold text-white transition hover:opacity-90 disabled:opacity-50"
                      >
                        🔓 ปลดล็อกทั้งหมด · Unlock everything — 49 ฿
                      </button>
                      <div className="mt-3 border-t border-amber-200 pt-3">
                        <button
                          onClick={() => openPayment("pack")}
                          disabled={busy}
                          className="rounded-xl border-2 border-rosewood bg-white px-5 py-2 text-sm font-semibold text-rosewood disabled:opacity-50"
                        >
                          🧿 คุ้มกว่า! ยันต์ 3 ชิ้น — 79 ฿
                        </button>
                        <p className="mt-1 text-[10px] text-ink/50">
                          ซาจู 1 ยันต์ · ดวงคู่ 2 ยันต์ (사주1 · 궁합2)
                        </p>
                        <div className="mx-auto mt-2 flex max-w-xs gap-2">
                          <input
                            value={amuletInput}
                            onChange={(e) => setAmuletInput(e.target.value.toUpperCase())}
                            placeholder="มียันต์แล้ว? ใส่รหัส"
                            className="min-w-0 flex-1 rounded-lg border border-peach/60 bg-white px-3 py-1.5 text-center font-mono text-xs outline-none focus:border-rosewood"
                          />
                          <button
                            onClick={() => redeemAmulet(amuletInput)}
                            disabled={busy || !amuletInput.trim()}
                            className="rounded-lg bg-rosewood px-3 py-1.5 text-xs font-semibold text-white disabled:opacity-50"
                          >
                            ใช้ยันต์
                          </button>
                        </div>
                        {amuletMsg && <p className="mt-1 text-[10px] text-red-500">{amuletMsg}</p>}
                      </div>
                    </>
                  ) : (
                    <a
                      href="https://instagram.com/duangsaju"
                      className="mt-3 inline-block rounded-xl bg-rosewood px-6 py-2.5 text-sm font-semibold text-white"
                    >
                      💬 สั่งซื้อทาง DM · Order via DM — 49 ฿
                    </a>
                  )}
                </div>
              )}
              <div className="rounded-3xl bg-white p-5 shadow-sm ring-1 ring-peach/40">
                <h3 className="font-semibold text-rosewood">
                  {SECTION_EMOJI[s.key] ?? "🌸"} {s.title}
                </h3>
                <p
                  className={
                    "mt-1 text-sm leading-relaxed text-ink/80 " + (s.locked ? "locked-body" : "")
                  }
                >
                  {s.body}
                </p>
              </div>
            </div>
          );
        })}
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
            <h3 className="font-semibold text-rosewood">
              {claim.isPack ? "🧿 รหัสยันต์ของคุณ · Your amulet code" : "⏳ รอการยืนยัน · Awaiting confirmation"}
            </h3>
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
              className="mt-3 w-full rounded-lg bg-cream px-3 py-2 font-mono text-sm font-bold tracking-widest text-ink"
            >
              {claim.isPack ? claim.ref : claim.ref.slice(0, 8).toUpperCase() + "…"} 📋
            </button>
            {claim.isPack && (
              <p className="mt-1 text-[10px] text-ink/50">
                เก็บรหัสนี้ไว้! ใช้ได้หลังยืนยันการโอน (ยันต์ 3 ชิ้น)
              </p>
            )}
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
