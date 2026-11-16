"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

interface Item {
  kind: "reading" | "compat";
  item_id: string;
  label: string;
  created_at: string;
  paid?: boolean;
}

// ดวงของฉัน — saved results for the logged-in user (Thai first, EN below).
export default function MyPage() {
  const [state, setState] = useState<{ loading: boolean; user: { name: string } | null; items: Item[]; providers: string[] }>({
    loading: true,
    user: null,
    items: [],
    providers: [],
  });
  const [err, setErr] = useState("");

  useEffect(() => {
    setErr(new URLSearchParams(window.location.search).get("login_error") ?? "");
    Promise.all([
      fetch("/api/me/items").then((r) => r.json()).catch(() => ({ user: null, items: [] })),
      fetch("/api/auth/me").then((r) => r.json()).catch(() => ({ providers: [] })),
    ]).then(([a, b]) => setState({ loading: false, user: a.user, items: a.items ?? [], providers: b.providers ?? [] }));
  }, []);

  async function logout() {
    await fetch("/api/auth/me", { method: "POST" });
    window.location.href = "/me";
  }

  const href = (p: string) => `/api/auth/${p}/start?next=/me`;

  return (
    <main className="mx-auto max-w-md px-4 py-10">
      <header className="mb-6 text-center">
        <Link href="/" className="text-3xl font-bold text-rose-500">ดวงซาจู</Link>
        <p className="mt-1 text-sm text-ink/60">ดวงของฉัน · My readings</p>
      </header>

      {state.loading ? (
        <p className="text-center text-sm text-ink/50">…</p>
      ) : !state.user ? (
        <div className="rounded-3xl bg-white p-6 text-center shadow">
          <p className="text-sm text-ink/70">เข้าสู่ระบบเพื่อดูผลดวงที่เคยซื้อ</p>
          <p className="text-xs text-ink/50">Log in to see your saved readings</p>
          {err && <p className="mt-2 text-xs text-red-500">เข้าสู่ระบบไม่สำเร็จ ลองใหม่อีกครั้ง ({err})</p>}
          <div className="mt-4 space-y-2">
            {state.providers.includes("line") && (
              <a href={href("line")} className="block w-full rounded-xl bg-[#06C755] py-2.5 text-sm font-semibold text-white">
                เข้าสู่ระบบด้วย LINE
              </a>
            )}
            {state.providers.includes("google") && (
              <a href={href("google")} className="block w-full rounded-xl border border-ink/20 bg-white py-2.5 text-sm font-semibold text-ink">
                เข้าสู่ระบบด้วย Google
              </a>
            )}
            {state.providers.length === 0 && <p className="text-xs text-ink/40">เร็วๆ นี้ · Coming soon</p>}
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          <div className="flex items-center justify-between rounded-2xl bg-white px-4 py-3 shadow-sm">
            <span className="text-sm text-ink/80">👋 {state.user.name}</span>
            <button onClick={logout} className="text-xs text-ink/50 underline">
              ออกจากระบบ · Log out
            </button>
          </div>
          {state.items.length === 0 && (
            <p className="rounded-2xl bg-white p-6 text-center text-sm text-ink/60 shadow-sm">
              ยังไม่มีผลดวง — <Link href="/" className="text-rosewood underline">ดูดวงเลย</Link>
            </p>
          )}
          {state.items.map((it) => (
            <Link
              key={it.kind + it.item_id}
              href={it.kind === "compat" ? `/compat/result/${it.item_id}` : `/result/${it.item_id}`}
              className="block rounded-2xl bg-white px-4 py-3 shadow-sm ring-1 ring-peach/40"
            >
              <span className="text-sm font-semibold text-rosewood">
                {it.kind === "compat" ? "💑 ดวงคู่ · " : "🔮 ดวงส่วนตัว · "}
                {it.label}
              </span>
              <span className="mt-0.5 flex items-center gap-2 text-[11px] text-ink/40">
                {it.paid ? (
                  <span className="rounded-full bg-emerald-50 px-2 py-0.5 font-semibold text-emerald-600">✅ ปลดล็อกแล้ว · Unlocked</span>
                ) : (
                  <span className="rounded-full bg-ink/5 px-2 py-0.5">ฟรี · Free</span>
                )}
                {new Date(it.created_at).toLocaleDateString("th-TH")}
              </span>
            </Link>
          ))}
        </div>
      )}
    </main>
  );
}
