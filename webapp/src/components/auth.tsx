"use client";

import { useEffect, useState } from "react";

type L3 = "th" | "en" | "ko";
export interface Me {
  user: { id: string; name: string; provider: string } | null;
  providers: string[];
}

let cache: Promise<Me> | null = null;
export function fetchMe(): Promise<Me> {
  if (!cache) {
    cache = fetch("/api/auth/me")
      .then((r) => r.json())
      .catch(() => ({ user: null, providers: [] }));
  }
  return cache;
}

/** True when the visitor may pay now (logged in, or login not configured yet). */
export async function canPay(): Promise<boolean> {
  const me = await fetchMe();
  return !!me.user || me.providers.length === 0;
}

/** Remember a result in the logged-in user's "내 기록" (no-op when logged out). */
export function useLinkMe(kind: "reading" | "compat", id: string | null | undefined, label: string) {
  useEffect(() => {
    if (!id) return;
    fetchMe().then((me) => {
      if (!me.user) return;
      fetch("/api/me/items", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ kind, id, label }),
      }).catch(() => {});
    });
  }, [kind, id, label]);
}

const LT: Record<L3, Record<string, string>> = {
  th: {
    title: "เข้าสู่ระบบก่อนชำระเงิน",
    sub: "ผลดวงที่ซื้อแล้วจะถูกเก็บไว้ในบัญชี กลับมาดูได้ทุกเมื่อ",
    line: "เข้าสู่ระบบด้วย LINE",
    google: "เข้าสู่ระบบด้วย Google",
    close: "ปิด",
  },
  en: {
    title: "Log in before paying",
    sub: "Your paid readings are saved to your account — come back anytime",
    line: "Continue with LINE",
    google: "Continue with Google",
    close: "Close",
  },
  ko: {
    title: "결제 전에 로그인해 주세요",
    sub: "결제한 결과는 계정에 저장돼 언제든 다시 볼 수 있어요",
    line: "LINE으로 로그인",
    google: "Google로 로그인",
    close: "닫기",
  },
};

export function LoginModal({ lang, onClose }: { lang: L3; onClose: () => void }) {
  const t = LT[lang] ?? LT.th;
  const [providers, setProviders] = useState<string[]>([]);
  useEffect(() => {
    fetchMe().then((m) => setProviders(m.providers));
  }, []);
  const next = typeof window !== "undefined" ? window.location.pathname + window.location.search : "/me";
  const href = (p: string) => `/api/auth/${p}/start?next=${encodeURIComponent(next)}`;
  return (
    <div className="fixed inset-0 z-20 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-xs rounded-3xl bg-white p-6 text-center">
        <h3 className="font-semibold text-rosewood">{t.title}</h3>
        <p className="mt-1 text-xs text-ink/60">{t.sub}</p>
        <div className="mt-4 space-y-2">
          {providers.includes("line") && (
            <a href={href("line")} className="block w-full rounded-xl bg-[#06C755] py-2.5 text-sm font-semibold text-white">
              {t.line}
            </a>
          )}
          {providers.includes("google") && (
            <a href={href("google")} className="block w-full rounded-xl border border-ink/20 bg-white py-2.5 text-sm font-semibold text-ink">
              {t.google}
            </a>
          )}
        </div>
        <button onClick={onClose} className="mt-3 text-xs text-ink/40">
          {t.close}
        </button>
      </div>
    </div>
  );
}
