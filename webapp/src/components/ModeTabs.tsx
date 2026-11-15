// 내 사주 ↔ 궁합 전환 탭 — 첫 화면과 궁합 화면 상단에 크게.
const L: Record<string, [string, string, string]> = {
  th: ["🔮 ดวงของฉัน", "💞 ดวงคู่ (궁합)", "ฟรี"],
  en: ["🔮 My Saju", "💞 Compatibility", "Free"],
  ko: ["🔮 내 사주", "💞 궁합", "무료"],
};

export default function ModeTabs({ active, lang }: { active: "saju" | "compat"; lang: string }) {
  const [a, b, free] = L[lang] ?? L.th;
  const base =
    "relative flex-1 rounded-full px-3 py-2.5 text-center text-sm font-bold transition";
  const on =
    "bg-gradient-to-r from-rosewood to-fuchsia-500 text-white shadow-[0_0_18px_rgba(232,93,158,0.6)]";
  const off = "text-[#ffe9b8] hover:bg-white/10";
  return (
    <nav className="mode-tabs mx-auto mt-4 flex max-w-sm gap-1 rounded-full border border-[#ffd98a]/50 bg-white/10 p-1 backdrop-blur">
      <a href="/" className={`${base} ${active === "saju" ? on : off}`}>
        {a}
      </a>
      <a href="/compat" className={`${base} ${active === "compat" ? on : off}`}>
        {b}
        <span className="absolute -right-1 -top-2 rounded-full bg-[#ffd98a] px-1.5 py-0.5 text-[9px] font-bold text-[#5b2a00]">
          {free}
        </span>
      </a>
    </nav>
  );
}
