"use client";

import { useState } from "react";
import { STEM_STYLE, BRANCH_STYLE } from "./hanStyles";

const IG_URL = process.env.NEXT_PUBLIC_IG_URL ?? "https://instagram.com/duangsaju";

// Korean readings shown under each hanja (like classic 만세력 apps).
const STEM_KO: Record<string, string> = {
  "甲": "갑", "乙": "을", "丙": "병", "丁": "정", "戊": "무",
  "己": "기", "庚": "경", "辛": "신", "壬": "임", "癸": "계",
};
const BRANCH_KO: Record<string, string> = {
  "子": "자", "丑": "축", "寅": "인", "卯": "묘", "辰": "진", "巳": "사",
  "午": "오", "未": "미", "申": "신", "酉": "유", "戌": "술", "亥": "해",
};

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
  coworkers: "💼 เพื่อนร่วมงาน · Coworkers",
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
                  "flex h-10 flex-col items-center justify-center rounded-md leading-none " +
                  (p ? STEM_STYLE[p.gan] : "bg-cream text-ink/30")
                }
              >
                <span className="text-base font-bold">{p ? p.gan : "—"}</span>
                {p && <span className="text-[8px] opacity-80">{STEM_KO[p.gan]}</span>}
              </span>
              <span
                className={
                  "flex h-10 flex-col items-center justify-center rounded-md leading-none " +
                  (p ? BRANCH_STYLE[p.zhi] : "bg-cream text-ink/30")
                }
              >
                <span className="text-base font-bold">{p ? p.zhi : "—"}</span>
                {p && <span className="text-[8px] opacity-80">{BRANCH_KO[p.zhi]}</span>}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

type L3 = "th" | "en" | "ko";

const CTXT: Record<L3, Record<string, string>> = {
  th: {
    unlockTitle: "💞 อ่านผลวิเคราะห์คู่ฉบับเต็มของคุณสองคน",
    unlockSub: "ทุกจุดวิเคราะห์ + การแต่งงาน · ข้อควรระวัง · ระยะยาว",
    unlockBtn: "🔓 ปลดล็อกผลวิเคราะห์ — 89 ฿",
    dmBtn: "💬 สั่งซื้อทาง DM — 89 ฿",
    packBtn: "🧿 คุ้มกว่า! ยันต์ 3 ชิ้น — 79 ฿",
    packHint: "ซาจู 1 ยันต์ · ดวงคู่ 2 ยันต์",
    codePh: "มียันต์แล้ว? ใส่รหัส",
    useBtn: "ใช้ยันต์",
    share: "📤 แชร์ผลคู่นี้",
    copied: "คัดลอกลิงก์แล้ว ✓",
    intimateChip: "🔥 เคมีเชิงลึก (속궁합)",
    scanTitle: "สแกนเพื่อชำระ (PromptPay)",
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
    amuletErr: "รหัสไม่ถูกต้องหรือยันต์ไม่พอ (ดวงคู่ใช้ 2 ยันต์)",
    amuletReady: "✅ ยันต์พร้อมใช้แล้ว!",
  },
  en: {
    unlockTitle: "💞 Read the full written analysis for your pair",
    unlockSub: "every point + marriage · cautions · long-term",
    unlockBtn: "🔓 Unlock full analysis — 89 ฿",
    dmBtn: "💬 Order via DM — 89 ฿",
    packBtn: "🧿 Best value! 3 amulets — 79 ฿",
    packHint: "saju = 1 amulet · couple reading = 2",
    codePh: "Have a code? Enter it",
    useBtn: "Redeem",
    share: "📤 Share this result",
    copied: "Link copied ✓",
    intimateChip: "🔥 Intimate chemistry",
    scanTitle: "Scan to pay (PromptPay)",
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
    amuletErr: "Invalid code or not enough amulets (couple reading costs 2)",
    amuletReady: "✅ Amulets ready!",
  },
  ko: {
    unlockTitle: "💞 두 사람의 전체 해석 보기",
    unlockSub: "모든 분석 포인트 + 결혼운 · 주의점 · 장기 전망",
    unlockBtn: "🔓 전체 해석 잠금 해제 — 89밧",
    dmBtn: "💬 DM으로 주문 — 89밧",
    packBtn: "🧿 알뜰팩! 부적 3개 — 79밧",
    packHint: "사주 1개 · 궁합 2개 차감",
    codePh: "부적코드 입력",
    useBtn: "사용",
    share: "📤 결과 공유하기",
    copied: "링크 복사됨 ✓",
    intimateChip: "🔥 속궁합",
    scanTitle: "PromptPay QR 스캔 결제",
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
    amuletErr: "코드가 잘못됐거나 부적이 부족해요 (궁합은 2개 차감)",
    amuletReady: "✅ 부적 사용 가능!",
  },
};

export default function CompatView({ data }: { data: CompatData }) {
  const { id, charts, profiles, relationship, disclaimer } = data;
  const [sections] = useState<CompatSection[]>(data.result.sections);
  const [pay, setPay] = useState<{ qr: string; amount: number } | null>(null);
  const [payerName, setPayerName] = useState("");
  const [contact, setContact] = useState("");
  const [claim, setClaim] = useState<{ ref: string; msg?: string; isPack?: boolean } | null>(null);
  const [payKind, setPayKind] = useState<"compat" | "pack">("compat");
  const [amuletInput, setAmuletInput] = useState("");
  const [amuletMsg, setAmuletMsg] = useState("");
  const [busy, setBusy] = useState(false);
  const [copied, setCopied] = useState(false);
  const { score, intimate, bandTh, headline } = data.result;
  const uiLang: L3 = data.result.lang === "en" ? "en" : data.result.lang === "ko" ? "ko" : "th";
  const tt = CTXT[uiLang];

  async function redeemAmulet(code: string) {
    if (!id || !code.trim()) return;
    setBusy(true);
    setAmuletMsg("");
    try {
      const res = await fetch("/api/amulet", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "redeem", code: code.trim(), id, kind: "compat" }),
      });
      const d = await res.json();
      if (d.ok) {
        window.location.href = `/compat/result/${id}`;
      } else {
        setAmuletMsg(tt.amuletErr);
      }
    } finally {
      setBusy(false);
    }
  }

  function share() {
    if (!id) return;
    const url = `${window.location.origin}/compat/result/${id}`;
    navigator.clipboard?.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  async function openPayment(kind: "compat" | "pack" = "compat") {
    setBusy(true);
    setPayKind(kind);
    try {
      const q = kind === "pack" ? "kind=pack" : `kind=compat${id ? `&id=${id}` : ""}`;
      const res = await fetch(`/api/pay?${q}`);
      const d = await res.json();
      setPay({ qr: d.qr, amount: d.amount });
    } finally {
      setBusy(false);
    }
  }

  // Report the transfer → reference code; unlock only after the owner
  // verifies the credit (admin confirm) — then the share page renders open.
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
        const d = await res.json();
        if (d.code) {
          setPay(null);
          setClaim({ ref: d.code, isPack: true });
        }
        return;
      }
      if (!id) return;
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
    setBusy(true);
    try {
      if (claim?.isPack) {
        const res = await fetch(`/api/amulet?code=${claim.ref}`);
        const d = await res.json();
        if (d.paid && id) {
          await redeemAmulet(claim.ref);
        } else if (d.paid) {
          setClaim((c) => (c ? { ...c, msg: tt.amuletReady } : c));
        } else {
          setClaim((c) => (c ? { ...c, msg: tt.notYet } : c));
        }
        return;
      }
      if (!id) return;
      const res = await fetch(`/api/pay?kind=compat&id=${id}`);
      const d = await res.json();
      if (d.paid) {
        window.location.href = `/compat/result/${id}`;
      } else {
        setClaim((c) =>
          c ? { ...c, msg: tt.notYet } : c
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
            {tt.intimateChip} {intimate}%
          </div>
        )}
        <p className="mt-1 text-sm text-ink/70">{headline}</p>

        <div className="mt-4 grid grid-cols-2 gap-2">
          <PersonChart chart={charts.a} profile={profiles?.a} fallbackName="คุณ · You" />
          <PersonChart chart={charts.b} profile={profiles?.b} fallbackName="อีกฝ่าย · Partner" />
        </div>

        {id && (
          <button
            onClick={share}
            className="mt-4 w-full rounded-xl border border-peach/60 py-2 text-sm text-rosewood transition hover:bg-peach/20"
          >
            {copied ? tt.copied : tt.share}
          </button>
        )}
      </div>

      {/* Full written analysis sits behind ONE 89฿ unlock */}
      {sections.some((s) => s.locked) && (
        <div className="mt-4 rounded-3xl bg-gradient-to-r from-rose-100 via-amber-50 to-yellow-100 p-5 text-center ring-1 ring-amber-200">
          <p className="text-sm font-semibold text-ink">{tt.unlockTitle}</p>
          <p className="mt-0.5 text-xs text-ink/60">{tt.unlockSub}</p>
          {id ? (
            <>
              <button
                onClick={() => openPayment("compat")}
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
              className="mt-3 inline-block rounded-xl bg-rosewood px-6 py-2.5 text-sm font-semibold text-white"
            >
              {tt.dmBtn}
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
                {tt.packKeep}
              </p>
            )}
            <a
              href={IG_URL}
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
