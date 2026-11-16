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
    inapp: "Google ไม่อนุญาตให้เข้าสู่ระบบในแอปนี้ — เปิดในเบราว์เซอร์เพื่อใช้ Google",
    ios: "แตะ ⋯ มุมขวาบน แล้วเลือก “เปิดในเบราว์เซอร์”",
    open: "เปิดใน Chrome",
    copy: "คัดลอกลิงก์",
    copied: "คัดลอกแล้ว ✓ วางใน Safari/Chrome ได้เลย",
  },
  en: {
    title: "Log in before paying",
    sub: "Your paid readings are saved to your account — come back anytime",
    line: "Continue with LINE",
    google: "Continue with Google",
    close: "Close",
    inapp: "Google blocks sign-in inside this app — open in your browser to use Google",
    ios: "Tap ⋯ (top right) → “Open in browser”",
    open: "Open in Chrome",
    copy: "Copy link",
    copied: "Copied ✓ Paste it in Safari/Chrome",
  },
  ko: {
    title: "결제 전에 로그인해 주세요",
    sub: "결제한 결과는 계정에 저장돼 언제든 다시 볼 수 있어요",
    line: "LINE으로 로그인",
    google: "Google로 로그인",
    close: "닫기",
    inapp: "이 앱 안에서는 Google 로그인이 막혀 있어요 — 브라우저로 열어 주세요",
    ios: "오른쪽 위 ⋯ → ‘브라우저에서 열기’를 눌러 주세요",
    open: "Chrome으로 열기",
    copy: "링크 복사",
    copied: "복사됐어요 ✓ Safari/Chrome에 붙여넣기",
  },
};

/** Instagram / Facebook / TikTok / LINE in-app browsers — Google OAuth refuses these webviews. */
export function inAppBrowser(): null | "android" | "ios" {
  if (typeof navigator === "undefined") return null;
  const ua = navigator.userAgent || "";
  if (!/Instagram|FBAN|FBAV|FB_IAB|musical_ly|BytedanceWebview|TikTok|Line\/|KAKAOTALK|; wv\)/i.test(ua)) return null;
  return /Android/i.test(ua) ? "android" : "ios";
}

export function LoginModal({ lang, onClose }: { lang: L3; onClose: () => void }) {
  const t = LT[lang] ?? LT.th;
  const [providers, setProviders] = useState<string[]>([]);
  useEffect(() => {
    fetchMe().then((m) => setProviders(m.providers));
  }, []);
  const next = typeof window !== "undefined" ? window.location.pathname + window.location.search : "/me";
  const href = (p: string) => `/api/auth/${p}/start?next=${encodeURIComponent(next)}`;
  const [inApp, setInApp] = useState<null | "android" | "ios">(null);
  const [copied, setCopied] = useState(false);
  useEffect(() => setInApp(inAppBrowser()), []);
  const here = typeof window !== "undefined" ? window.location.href : "";
  const chromeIntent = here
    ? `intent://${here.replace(/^https?:\/\//, "")}#Intent;scheme=https;package=com.android.chrome;end`
    : "#";
  const copy = () => {
    navigator.clipboard?.writeText(here).then(() => setCopied(true)).catch(() => {});
  };
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
          {providers.includes("google") && inApp && (
            <div className="rounded-xl border border-ink/15 bg-ink/[0.03] p-3 text-xs text-ink/70">
              <p>{t.inapp}</p>
              {inApp === "android" ? (
                <a href={chromeIntent} className="mt-2 block w-full rounded-lg border border-ink/20 bg-white py-2 font-semibold text-ink">
                  {t.open}
                </a>
              ) : (
                <p className="mt-1 font-semibold text-ink/80">{t.ios}</p>
              )}
              <button onClick={copy} className="mt-2 w-full rounded-lg bg-white py-2 font-semibold text-rosewood">
                {copied ? t.copied : t.copy}
              </button>
            </div>
          )}
          {providers.includes("google") && !inApp && (
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
