"use client";

import { useEffect, useRef, useState } from "react";

type Lang = "th" | "en" | "ko";
type Kind = "reading" | "compat" | "pack";

const T: Record<Lang, Record<string, string>> = {
  th: {
    title: "⚡ ปลดล็อกทันที",
    hint: "โอนแล้ว แนบสลิป ระบบตรวจอัตโนมัติ ไม่ต้องรอ",
    btn: "📎 แนบสลิปโอนเงิน",
    checking: "กำลังตรวจสลิป…",
    ok: "✅ ชำระเงินสำเร็จ! กำลังเปิดผลดวง…",
    not_slip: "ไม่พบ QR บนรูปนี้ กรุณาแนบสลิปจากแอปธนาคาร",
    not_found: "ตรวจไม่พบรายการโอนนี้ กรุณาลองใหม่อีกครั้งในอีก 1 นาที",
    duplicate: "สลิปนี้ถูกใช้ไปแล้ว",
    amount: "ยอดโอนไม่ตรงกับราคา",
    receiver: "บัญชีผู้รับไม่ตรงกับ ดวงซาจู",
    too_old: "สลิปนี้เก่าเกินไป",
    error: "ตรวจอัตโนมัติไม่ได้ตอนนี้ กรุณากรอกชื่อผู้โอนด้านล่างแทน",
    or: "หรือแจ้งโอนแบบเดิม",
    pending: "📨 ได้รับสลิปแล้ว! กำลังตรวจยอดเข้า หน้านี้จะเปิดเองอัตโนมัติเมื่อยืนยัน (ไม่ต้องปิดหน้า)",
  },
  en: {
    title: "⚡ Instant unlock",
    hint: "Paid? Attach your slip — checked automatically, no waiting",
    btn: "📎 Attach transfer slip",
    checking: "Checking slip…",
    ok: "✅ Payment confirmed! Opening your reading…",
    not_slip: "No QR found — please attach the slip from your bank app",
    not_found: "Transfer not found yet — please try again in a minute",
    duplicate: "This slip was already used",
    amount: "Amount doesn't match the price",
    receiver: "Receiver isn't ดวงซาจู",
    too_old: "This slip is too old",
    error: "Auto-check unavailable — please use the form below",
    or: "or report the transfer manually",
    pending: "📨 Slip received! We're checking the transfer — this page opens by itself once confirmed.",
  },
  ko: {
    title: "⚡ 즉시 열기",
    hint: "이체 후 슬립만 올리면 자동 확인, 기다릴 필요 없어요",
    btn: "📎 이체 슬립 첨부",
    checking: "슬립 확인 중…",
    ok: "✅ 결제 확인! 결과를 여는 중…",
    not_slip: "QR을 찾지 못했어요. 은행 앱 슬립을 올려주세요",
    not_found: "이체 내역을 아직 찾지 못했어요. 1분 뒤 다시 시도해 주세요",
    duplicate: "이미 사용된 슬립이에요",
    amount: "금액이 가격과 달라요",
    receiver: "받는 계좌가 덩사주가 아니에요",
    too_old: "너무 오래된 슬립이에요",
    error: "지금은 자동 확인이 어려워요. 아래 양식으로 알려주세요",
    or: "또는 기존 방식으로 입금 알림",
    pending: "📨 슬립 접수 완료! 입금 확인 중이에요. 확인되면 이 페이지가 자동으로 열려요.",
  },
};

export default function SlipUpload({
  kind,
  id,
  lang,
  onPaid,
  onPending,
}: {
  kind: Kind;
  id?: string;
  lang: string;
  onPaid: (r: { code?: string }) => void;
  onPending?: (r: { code?: string }) => void;
}) {
  const t = T[(lang as Lang) in T ? (lang as Lang) : "th"];
  const [enabled, setEnabled] = useState(false);
  const [state, setState] = useState<"idle" | "busy" | "ok">("idle");
  const [msg, setMsg] = useState("");
  const input = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetch("/api/pay/slip")
      .then((r) => r.json())
      .then((d) => setEnabled(!!d.enabled))
      .catch(() => {});
  }, []);

  if (!enabled) return null;

  async function upload(f: File) {
    setState("busy");
    setMsg(t.checking);
    try {
      const fd = new FormData();
      fd.append("file", f);
      fd.append("kind", kind);
      if (id) fd.append("id", id);
      const res = await fetch("/api/pay/slip", { method: "POST", body: fd });
      const d = await res.json();
      if (d.ok) {
        setState("ok");
        setMsg(t.ok);
        onPaid({ code: d.code });
        return;
      }
      if (d.reason === "pending") {
        setState("ok");
        setMsg(t.pending);
        onPending?.({ code: d.code });
        return;
      }
      setMsg(t[d.reason] ?? t.error);
    } catch {
      setMsg(t.error);
    }
    setState("idle");
  }

  return (
    <div className="mt-1 rounded-2xl border-2 border-rosewood/40 bg-peach/30 p-3 text-center">
      <p className="text-sm font-semibold text-rosewood">{t.title}</p>
      <p className="mt-0.5 text-[11px] text-ink/60">{t.hint}</p>
      <input
        ref={input}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) upload(f);
          e.target.value = "";
        }}
      />
      <button
        onClick={() => input.current?.click()}
        disabled={state !== "idle"}
        className="mt-2 w-full rounded-xl bg-rosewood py-2.5 font-semibold text-white disabled:opacity-60"
      >
        {state === "busy" ? t.checking : t.btn}
      </button>
      {msg && state !== "busy" && (
        <p className={`mt-2 text-xs ${state === "ok" ? "text-emerald-600" : "text-amber-600"}`}>{msg}</p>
      )}
      <p className="mt-2 text-[11px] text-ink/40">— {t.or} —</p>
    </div>
  );
}
