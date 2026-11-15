"use client";

import { useState } from "react";

// "Save QR" for the PromptPay modal: buyers can't scan a QR shown on their
// own phone, so they save it to Photos and pick it in the bank app
// (สแกน → เลือกรูป). Uses the Web Share sheet with the image file when
// available (iOS/Android → "Save Image"), otherwise a normal download.

const T: Record<string, { save: string; tip: string; done: string }> = {
  th: {
    save: "💾 บันทึก QR ลงเครื่อง",
    tip: "เปิดแอปธนาคาร → สแกน → เลือกรูป QR จากอัลบั้ม",
    done: "บันทึกแล้ว ✅",
  },
  en: {
    save: "💾 Save QR to phone",
    tip: "Open your bank app → Scan → pick the QR from your photos",
    done: "Saved ✅",
  },
  ko: {
    save: "💾 QR 이미지 저장",
    tip: "은행 앱 → 스캔 → 앨범에서 QR 사진 선택",
    done: "저장됨 ✅",
  },
};


export default function QrSave({ qr, amount, lang }: { qr: string; amount: number; lang: string }) {
  const t = T[lang] ?? T.th;
  const [done, setDone] = useState(false);

  async function save() {
    const name = `duangsaju-promptpay-${amount}THB.png`;
    try {
      const blob = await (await fetch(qr)).blob();
      const file = new File([blob], name, { type: "image/png" });
      const nav = navigator as Navigator & { canShare?: (d: unknown) => boolean };
      if (nav.canShare && nav.canShare({ files: [file] })) {
        await nav.share({ files: [file], title: "PromptPay QR" });
        setDone(true);
        return;
      }
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = name;
      document.body.appendChild(a);
      a.click();
      a.remove();
      setTimeout(() => URL.revokeObjectURL(url), 2000);
      setDone(true);
    } catch {
      /* user cancelled the share sheet */
    }
  }

  return (
    <div className="-mt-1 mb-2">
      <button
        onClick={save}
        className="w-full rounded-xl border-2 border-rosewood py-2 text-sm font-semibold text-rosewood"
      >
        {done ? t.done : t.save}
      </button>
      <p className="mt-1 text-[11px] text-ink/50">{t.tip}</p>
    </div>
  );
}
