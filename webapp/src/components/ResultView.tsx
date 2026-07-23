"use client";

import { useEffect, useState } from "react";

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

import { STEM_STYLE, BRANCH_STYLE, ELEMENT_CHIP, HIDDEN_STEMS } from "./hanStyles";

const IG_URL = process.env.NEXT_PUBLIC_IG_URL ?? "https://www.instagram.com/duangsaju";

const ELEMENT_LABEL: Record<string, string> = {
  wood: "ไม้·Wood",
  fire: "ไฟ·Fire",
  earth: "ดิน·Earth",
  metal: "ทอง·Metal",
  water: "น้ำ·Water",
};

// Big visual for the chart's dominant element (가장 강한 오행).
const ELEMENT_EMOJI: Record<string, string> = {
  wood: "🌳", fire: "🔥", earth: "⛰️", metal: "💎", water: "🌊",
};
const ELEMENT_BAR: Record<string, string> = {
  wood: "bg-emerald-400", fire: "bg-red-400", earth: "bg-yellow-400",
  metal: "bg-slate-400", water: "bg-blue-400",
};
const DOMINANT_LABEL: Record<L3, string> = {
  th: "ธาตุที่แรงที่สุดในดวง",
  en: "Strongest element",
  ko: "가장 강한 오행",
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

type L3 = "th" | "en" | "ko";

const TXT: Record<L3, Record<string, string>> = {
  th: {
    unlockTitle: "💖💼💰🔮 ปลดล็อกครบทุกหมวดในครั้งเดียว",
    unlockSub: "ความรัก · การงาน · การเงิน · ดวง 10 ปี",
    unlockBtn: "🔓 ปลดล็อกทั้งหมด — 49 ฿",
    dmBtn: "💬 สั่งซื้อทาง DM — 49 ฿",
    packBtn: "🧿 คุ้มกว่า! ยันต์ 3 ชิ้น — 129 ฿",
    packHint: "ซาจู 1 ยันต์ · ดวงคู่ 2 ยันต์",
    codePh: "มียันต์แล้ว? ใส่รหัส",
    useBtn: "ใช้ยันต์",
    share: "📤 แชร์ผลดวงนี้",
    copied: "คัดลอกลิงก์แล้ว ✓",
    scanTitle: "สแกนเพื่อชำระ (PromptPay)",
    afterNote: "หลังโอนแล้ว กรอกข้อมูลด้านล่างแล้วกดปุ่ม",
    payer: "ชื่อผู้โอน (ชื่อบนสลิป)",
    email: "อีเมล (ไม่บังคับ)",
    transferred: "โอนแล้ว แจ้งชำระเงิน",
    close: "ปิด",
    claimTitle: "⏳ รอการยืนยัน",
    packCodeTitle: "🧿 รหัสยันต์ของคุณ",
    claimBody: "ส่งสลิปโอนเงินพร้อมรหัสอ้างอิงทาง DM แล้วหน้านี้จะปลดล็อกภายในไม่กี่นาที",
    dmSend: "💬 ส่งสลิปทาง Instagram DM",
    check: "🔄 ตรวจสอบสถานะ",
    notYet: "ยังไม่ได้รับการยืนยัน กรุณารอสักครู่",
    packKeep: "เก็บรหัสนี้ไว้! ใช้ได้หลังยืนยันการโอน (ยันต์ 3 ชิ้น)",
    claimWarn: "⚠️ ก่อนปิดหน้านี้ กรุณาแตะเพื่อคัดลอกรหัสอ้างอิงด้านล่าง แล้วส่งทาง DM — รหัสนี้ใช้ตามหาผลของคุณได้",
    refCopied: "คัดลอกรหัสแล้ว ✓",
    amuletErr: "รหัสไม่ถูกต้องหรือยันต์ไม่พอ",
    amuletReady: "✅ ยันต์พร้อมใช้แล้ว!",
  },
  en: {
    unlockTitle: "💖💼💰🔮 Unlock all 4 sections at once",
    unlockSub: "love · career · wealth · 10-year luck",
    unlockBtn: "🔓 Unlock everything — 49 ฿",
    dmBtn: "💬 Order via DM — 49 ฿",
    packBtn: "🧿 Best value! 3 amulets — 129 ฿",
    packHint: "saju = 1 amulet · couple reading = 2",
    codePh: "Have a code? Enter it",
    useBtn: "Redeem",
    share: "📤 Share this reading",
    copied: "Link copied ✓",
    scanTitle: "Scan to pay (PromptPay)",
    afterNote: "After transferring, fill in below and tap the button",
    payer: "Sender name (on the slip)",
    email: "Email (optional)",
    transferred: "I've transferred",
    close: "Close",
    claimTitle: "⏳ Awaiting confirmation",
    packCodeTitle: "🧿 Your amulet code",
    claimBody: "Send your transfer slip + reference code via DM — this page unlocks within minutes.",
    dmSend: "💬 Send slip via Instagram DM",
    check: "🔄 Check status",
    notYet: "Not confirmed yet — please wait a moment",
    packKeep: "Save this code! Active after transfer confirmation (3 amulets)",
    claimWarn: "⚠️ Before closing this page, tap to copy the reference code below and send it via DM — it's how we find your reading again.",
    refCopied: "Code copied ✓",
    amuletErr: "Invalid code or not enough amulets",
    amuletReady: "✅ Amulets ready!",
  },
  ko: {
    unlockTitle: "💖💼💰🔮 한 번에 모든 항목 잠금 해제",
    unlockSub: "연애 · 직업 · 재물 · 10년 대운",
    unlockBtn: "🔓 전체 잠금 해제 — 49밧",
    dmBtn: "💬 DM으로 주문 — 49밧",
    packBtn: "🧿 알뜰팩! 부적 3개 — 129밧",
    packHint: "사주 1개 · 궁합 2개 차감",
    codePh: "부적코드 입력",
    useBtn: "사용",
    share: "📤 결과 공유하기",
    copied: "링크 복사됨 ✓",
    scanTitle: "PromptPay QR 스캔 결제",
    afterNote: "이체 후 아래 정보를 입력하고 버튼을 눌러주세요",
    payer: "입금자명 (슬립에 찍힌 이름)",
    email: "이메일 (선택)",
    transferred: "이체 완료, 확인 요청",
    close: "닫기",
    claimTitle: "⏳ 입금 확인 대기 중",
    packCodeTitle: "🧿 내 부적코드",
    claimBody: "이체 슬립과 참조코드를 DM으로 보내주시면 몇 분 안에 이 페이지가 열려요.",
    dmSend: "💬 인스타 DM으로 슬립 보내기",
    check: "🔄 상태 확인",
    notYet: "아직 확인 전이에요 — 잠시만 기다려주세요",
    packKeep: "이 코드를 꼭 저장하세요! 입금 확인 후 사용 가능 (부적 3개)",
    claimWarn: "⚠️ 이 창을 닫으실 거라면 아래 참조코드를 눌러 복사한 뒤 꼭 DM으로 보내주세요 — 이 코드로 결과를 다시 찾아드려요.",
    refCopied: "코드 복사됨 ✓",
    amuletErr: "코드가 잘못됐거나 부적이 부족해요",
    amuletReady: "✅ 부적 사용 가능!",
  },
};

export default function ResultView({ initial }: { initial: Reading }) {
  const [reading, setReading] = useState<Reading>(initial);
  const [pay, setPay] = useState<{ qr: string; amount: number } | null>(null);
  const [payerName, setPayerName] = useState("");
  const [contact, setContact] = useState("");
  const [claim, setClaim] = useState<{ ref: string; msg?: string; isPack?: boolean } | null>(null);
  const [payKind, setPayKind] = useState<"reading" | "pack">("reading");
  const [amuletInput, setAmuletInput] = useState("");
  const [amuletMsg, setAmuletMsg] = useState("");
  const [busy, setBusy] = useState(false);
  const [refCopied, setRefCopied] = useState(false);
  const [copied, setCopied] = useState(false);

  const { chart, sections, disclaimer, id } = reading;
  const uiLang: L3 = reading.lang === "en" ? "en" : reading.lang === "ko" ? "ko" : "th";
  const tt = TXT[uiLang];

  // Language switch: re-render the whole report in the selected language.
  // First switch on a paid record generates the long report → can take ~40s.
  const [langBusy, setLangBusy] = useState(false);
  async function switchLang(v: L3) {
    if (!id || v === uiLang || langBusy) return;
    setLangBusy(true);
    try {
      const res = await fetch(`/api/reading/${id}?lang=${v}`);
      if (res.ok) setReading(await res.json());
    } catch {
      /* keep current language on failure */
    } finally {
      setLangBusy(false);
    }
  }

  // Auto-unlock: while sections are locked, poll the payment status so the
  // page opens by itself the moment the owner approves the transfer.
  const hasLocked = sections.some((s) => s.locked);
  useEffect(() => {
    if (!id || !hasLocked) return;
    const timer = setInterval(async () => {
      if (document.visibilityState === "hidden") return;
      try {
        const res = await fetch(`/api/pay?kind=reading&id=${id}&status=1`);
        const d = await res.json();
        if (d.paid) window.location.href = `/result/${id}`;
      } catch {
        /* transient network error — keep polling */
      }
    }, 7000);
    return () => clearInterval(timer);
  }, [id, hasLocked]);

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
          setClaim((c) => (c ? { ...c, msg: tt.amuletReady } : c));
        } else {
          setClaim((c) =>
            c ? { ...c, msg: tt.notYet } : c
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
          c ? { ...c, msg: tt.notYet } : c
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
        setAmuletMsg(tt.amuletErr);
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
      {id && (
        <div className="mb-3 flex justify-center">
          <div className={"flex overflow-hidden rounded-full border-2 border-rosewood/40 bg-white text-sm font-semibold shadow-sm" + (langBusy ? " animate-pulse opacity-50" : "")}>
            {(["th", "en", "ko"] as L3[]).map((v) => (
              <button
                key={v}
                onClick={() => switchLang(v)}
                className={
                  "px-3 py-1 " + (uiLang === v ? "bg-rosewood text-white" : "text-ink/60")
                }
              >
                {v === "th" ? "ไทย" : v === "en" ? "EN" : "한국어"}
              </button>
            ))}
          </div>
        </div>
      )}
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
                {/* 지장간 — hidden stems, so 암합 can be read off the chart */}
                <div className="text-[9px] leading-tight text-ink/45">
                  {p ? HIDDEN_STEMS[p.zhi]?.split("").join("·") : " "}
                </div>
              </div>
            </div>
          ))}
        </div>
        <p className="mt-2 text-center text-[10px] text-ink/40">
          ⭐ = ธาตุประจำตัวคุณ · your Day Master (일간) · ตัวอักษรเล็ก = 지장간 (hidden stems)
        </p>

        {/* Dominant element visual + five-element balance bars */}
        {(() => {
          const entries = Object.entries(chart.elementCounts);
          const max = Math.max(...entries.map(([, n]) => n), 1);
          const dominant = entries.reduce((a, b) => (b[1] > a[1] ? b : a))[0];
          return (
            <div className="mt-3">
              <div className="mx-auto flex w-fit items-center gap-3 rounded-2xl border-2 border-ink/15 bg-cream px-4 py-2">
                <span className="text-4xl">{ELEMENT_EMOJI[dominant]}</span>
                <div className="text-left">
                  <div className="text-[10px] text-ink/50">{DOMINANT_LABEL[uiLang]}</div>
                  <div className="text-sm font-bold text-ink">
                    {ELEMENT_LABEL[dominant]} × {chart.elementCounts[dominant]}
                  </div>
                </div>
              </div>
              <div className="mt-3 space-y-1">
                {entries.map(([el, n]) => (
                  <div key={el} className="flex items-center gap-2 text-[10px]">
                    <span className="w-20 shrink-0 text-right text-ink/60">
                      {ELEMENT_EMOJI[el]} {ELEMENT_LABEL[el]}
                    </span>
                    <div className="h-2.5 flex-1 overflow-hidden rounded-full bg-ink/5">
                      <div
                        className={"h-full rounded-full " + ELEMENT_BAR[el]}
                        style={{ width: `${(n / max) * 100}%` }}
                      />
                    </div>
                    <span className="w-4 font-semibold text-ink/70">{n}</span>
                  </div>
                ))}
              </div>
            </div>
          );
        })()}

        {id && (
          <button
            onClick={share}
            className="mt-4 w-full rounded-xl border border-peach/60 py-2 text-sm text-rosewood transition hover:bg-peach/20"
          >
            {copied ? tt.copied : tt.share}
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
                  <p className="text-sm font-semibold text-ink">{tt.unlockTitle}</p>
                  <p className="mt-0.5 text-xs text-ink/60">{tt.unlockSub}</p>
                  {id ? (
                    <>
                      <button
                        onClick={() => openPayment("reading")}
                        disabled={busy}
                        className="mt-3 rounded-xl bg-rosewood px-6 py-2.5 text-sm font-semibold text-white transition hover:opacity-90 disabled:opacity-50"
                      >
                        {tt.unlockBtn}
                      </button>
                      <div className="mt-3 border-t border-amber-200 pt-3">
                        <button
                          onClick={() => openPayment("pack")}
                          disabled={busy}
                          className="rounded-xl border-2 border-rosewood bg-white px-5 py-2 text-sm font-semibold text-rosewood disabled:opacity-50"
                        >
                          {tt.packBtn}
                        </button>
                        <p className="mt-1 text-[10px] text-ink/50">{tt.packHint}</p>
                        <div className="mx-auto mt-2 flex max-w-xs gap-2">
                          <input
                            value={amuletInput}
                            onChange={(e) => setAmuletInput(e.target.value.toUpperCase())}
                            placeholder={tt.codePh}
                            className="min-w-0 flex-1 rounded-lg border border-peach/60 bg-white px-3 py-1.5 text-center font-mono text-xs outline-none focus:border-rosewood"
                          />
                          <button
                            onClick={() => redeemAmulet(amuletInput)}
                            disabled={busy || !amuletInput.trim()}
                            className="rounded-lg bg-rosewood px-3 py-1.5 text-xs font-semibold text-white disabled:opacity-50"
                          >
                            {tt.useBtn}
                          </button>
                        </div>
                        {amuletMsg && <p className="mt-1 text-[10px] text-red-500">{amuletMsg}</p>}
                      </div>
                    </>
                  ) : (
                    <a
                      href={IG_URL}
              target="_blank"
              rel="noreferrer"
                      className="mt-3 inline-block rounded-xl bg-rosewood px-6 py-2.5 text-sm font-semibold text-white"
                    >
                      {tt.dmBtn}
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
                  {/* Locked preview: repeat the teaser so the blur reflects the
                      real (long-form) length of the paid report. */}
                  {s.locked ? (s.body + " ").repeat(5) : s.body}
                </p>
              </div>
            </div>
          );
        })}
      </div>

      {pay && (
        <div className="fixed inset-0 z-10 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-xs rounded-3xl bg-white p-6 text-center">
            <h3 className="font-semibold text-rosewood">{tt.scanTitle}</h3>
            <p className="mt-1 text-sm text-ink/70">PromptPay · {pay.amount} THB</p>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={pay.qr} alt="PromptPay QR" className="mx-auto my-3 w-56" />
            <div className="mt-1 space-y-2 text-left">
              <label className="block text-xs text-ink/60">
                {tt.payer}
                <input
                  value={payerName}
                  onChange={(e) => setPayerName(e.target.value)}
                  placeholder="ชื่อบนสลิปโอนเงิน"
                  className="mt-1 w-full rounded-lg border border-peach/60 bg-cream px-3 py-2 text-sm outline-none focus:border-rosewood"
                />
              </label>
              <label className="block text-xs text-ink/60">
                {tt.email}
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
              {tt.transferred}
            </button>
            <button onClick={() => setPay(null)} className="mt-2 text-xs text-ink/40">
              {tt.close}
            </button>
          </div>
        </div>
      )}

      {claim && (
        <div className="fixed inset-0 z-10 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-xs rounded-3xl bg-white p-6 text-center">
            <h3 className="font-semibold text-rosewood">
              {claim.isPack ? tt.packCodeTitle : tt.claimTitle}
            </h3>
            <p className="mt-2 text-xs leading-relaxed text-ink/70">
              {tt.claimBody}
            </p>
            <p className="mt-2 rounded-lg bg-amber-50 px-3 py-2 text-[11px] leading-relaxed text-amber-700">
              {tt.claimWarn}
            </p>
            <button
              onClick={() => {
                navigator.clipboard?.writeText(claim.ref);
                setRefCopied(true);
                setTimeout(() => setRefCopied(false), 2000);
              }}
              className="mt-3 w-full rounded-lg bg-cream px-3 py-2 font-mono text-sm font-bold tracking-widest text-ink"
            >
              {claim.isPack ? claim.ref : claim.ref.slice(0, 8).toUpperCase() + "…"} 📋
            </button>
            {refCopied && <p className="mt-1 text-[10px] text-emerald-600">{tt.refCopied}</p>}
            {claim.isPack && (
              <p className="mt-1 text-[10px] text-ink/50">
                {tt.packKeep}
              </p>
            )}
            <a
              href={IG_URL}
              target="_blank"
              rel="noreferrer"
              className="mt-2 block w-full rounded-xl bg-rosewood py-2.5 text-sm font-semibold text-white"
            >
              {tt.dmSend}
            </a>
            <button
              onClick={checkStatus}
              disabled={busy}
              className="mt-2 w-full rounded-xl border border-peach/60 py-2 text-sm text-rosewood disabled:opacity-50"
            >
              {tt.check}
            </button>
            {claim.msg && <p className="mt-2 text-xs text-amber-600">{claim.msg}</p>}
            <button onClick={() => setClaim(null)} className="mt-2 text-xs text-ink/40">
              {tt.close}
            </button>
          </div>
        </div>
      )}

      <p className="mt-6 text-center text-xs text-ink/40">{disclaimer}</p>
    </section>
  );
}
