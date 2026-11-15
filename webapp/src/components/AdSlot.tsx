"use client";

import { useEffect, useRef } from "react";

// 구글 애드센스 디스플레이 광고 한 칸. 환경변수가 없으면 아무것도 그리지 않는다
// (승인 전·로컬에서는 광고 없이 그대로 동작).
const CLIENT = process.env.NEXT_PUBLIC_ADSENSE_CLIENT; // ca-pub-XXXXXXXXXXXXXXXX
const SLOT = process.env.NEXT_PUBLIC_ADSENSE_SLOT; // 디스플레이 광고 단위 ID

declare global {
  interface Window {
    adsbygoogle?: unknown[];
  }
}

export default function AdSlot({ className = "" }: { className?: string }) {
  const pushed = useRef(false);
  useEffect(() => {
    if (!CLIENT || pushed.current) return;
    pushed.current = true;
    try {
      (window.adsbygoogle = window.adsbygoogle || []).push({});
    } catch {
      /* 광고 차단기 등 — 무시 */
    }
  }, []);
  if (!CLIENT) return null;
  return (
    <div className={`mt-6 overflow-hidden rounded-2xl bg-white/80 p-2 ${className}`}>
      <p className="mb-1 text-center text-[10px] uppercase tracking-wider text-ink/30">โฆษณา · Ad</p>
      <ins
        className="adsbygoogle"
        style={{ display: "block" }}
        data-ad-client={CLIENT}
        {...(SLOT ? { "data-ad-slot": SLOT } : {})}
        data-ad-format="auto"
        data-full-width-responsive="true"
      />
    </div>
  );
}
