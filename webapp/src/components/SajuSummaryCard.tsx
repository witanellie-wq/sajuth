"use client";

import { summarize, type RelKind } from "@/lib/summary";
import type { SajuChart, Element } from "@/lib/saju";
import type { Lang } from "@/lib/i18n";

const EMO: Record<Element, string> = { wood: "🌳", fire: "🔥", earth: "⛰️", metal: "💎", water: "🌊" };

const L: Record<Lang, Record<string, string>> = {
  th: {
    title: "🔮 ดวงของฉันในพริบตา",
    me: "ตัวตนของฉัน (일간)",
    strong: "ธาตุที่แรงที่สุด",
    after: "หลังคำนวณ รวม·ชน (합·충)",
    same: "ไม่เปลี่ยน",
    gyeok: "โครงดวง (격)",
    sub: "เสริม",
    yong: "ธาตุนำโชค (용신)",
    hee: "ธาตุหนุนโชค (희신)",
    gi: "ธาตุที่ควรเลี่ยง (기신)",
    rel: "การรวม·ชนในดวง",
    none: "ไม่มีการรวมหรือชนที่ชัดเจน",
    note: "* คำนวณตามมาตรฐานซาจูเกาหลี (억부·조후)",
  },
  en: {
    title: "🔮 My Chart at a Glance",
    me: "Who I am (Day Master)",
    strong: "Strongest element",
    after: "After combines & clashes",
    same: "unchanged",
    gyeok: "Chart structure (격)",
    sub: "sub:",
    yong: "Lucky element (용신)",
    hee: "Supporting element (희신)",
    gi: "Element to avoid (기신)",
    rel: "Combines & clashes",
    none: "No notable combines or clashes",
    note: "* Korean saju standard (억부·조후)",
  },
  ko: {
    title: "🔮 내 사주 한눈에 보기",
    me: "나 자신 (일간)",
    strong: "가장 강한 오행",
    after: "합·충 반영 후",
    same: "변화 없음",
    gyeok: "격(格)",
    sub: "보조",
    yong: "용신",
    hee: "희신",
    gi: "기신",
    rel: "원국의 합·충",
    none: "뚜렷한 합·충 없음",
    note: "* 한국 사주 표준(억부·조후) 기준",
  },
};

const REL: Record<RelKind, Record<Lang, string>> = {
  stemHapHwa: { th: "รวมแล้วแปลงธาตุ (합화)", en: "combine → transforms (합화)", ko: "천간합화" },
  stemHap: { th: "ผูกกัน (천간합)", en: "stems bound (천간합)", ko: "천간합(묶임)" },
  yukhap: { th: "คู่รวม (육합)", en: "six-harmony (육합)", ko: "육합" },
  samhap: { th: "รวมสามทิศ (삼합)", en: "three-harmony (삼합)", ko: "삼합국" },
  banhap: { th: "รวมครึ่ง (반합)", en: "half-harmony (반합)", ko: "반합" },
  banghap: { th: "รวมทิศ (방합)", en: "directional (방합)", ko: "방합" },
  chung: { th: "ชนกัน (충)", en: "clash (충)", ko: "충" },
};

export default function SajuSummaryCard({ chart, lang }: { chart: unknown; lang: Lang }) {
  let s;
  try {
    s = summarize(chart as SajuChart, lang);
  } catch {
    return null;
  }
  const t = L[lang];
  const el = (e: Element) => `${EMO[e]} ${s.elName[e]}`;

  const Row = ({ k, v, accent }: { k: string; v: string; accent?: string }) => (
    <div className="flex items-start justify-between gap-3 border-b border-peach/40 py-2 last:border-0">
      <span className="shrink-0 text-xs text-ink/60">{k}</span>
      <span className={"text-right text-sm font-semibold " + (accent ?? "text-ink")}>{v}</span>
    </div>
  );

  return (
    <div className="mt-4 rounded-3xl border-2 border-ink/80 bg-white p-5 shadow-[4px_4px_0_rgba(58,42,51,0.8)]">
      <h3 className="text-center font-bold text-rosewood">{t.title}</h3>
      <div className="mx-auto mt-3 flex w-fit items-center gap-3 rounded-2xl bg-peach/30 px-4 py-2">
        <span className="text-4xl">{s.dm.emoji}</span>
        <div>
          <div className="text-[10px] text-ink/50">{t.me}</div>
          <div className="text-base font-bold text-ink">
            {s.dm.stem} · {s.dm.image}
          </div>
        </div>
      </div>
      <div className="mt-3">
        <Row k={t.strong} v={`${el(s.strongest.element)} ${s.strongest.pct}%`} />
        <Row
          k={t.after}
          v={s.afterRel.changed ? `${el(s.afterRel.element)} ${s.afterRel.pct}%` : `${el(s.afterRel.element)} (${t.same})`}
        />
        <Row k={t.gyeok} v={s.gyeok.name + (s.gyeok.sub ? ` · ${t.sub} ${s.gyeok.sub.name}` : "")} accent="text-violet-700" />
        <Row k={t.yong} v={el(s.yong)} accent="text-emerald-600" />
        <Row k={t.hee} v={s.hee.map(el).join(" · ")} accent="text-emerald-600" />
        <Row k={t.gi} v={el(s.gi)} accent="text-rose-600" />
      </div>
      <div className="mt-3 rounded-xl bg-cream px-3 py-2">
        <div className="text-[11px] font-semibold text-ink/70">{t.rel}</div>
        {s.relations.length === 0 ? (
          <div className="text-xs text-ink/50">{t.none}</div>
        ) : (
          <ul className="mt-1 space-y-0.5 text-xs text-ink/80">
            {s.relations.map((r, i) => (
              <li key={i}>
                {r.chars} · {REL[r.kind][lang]}
                {r.element && r.kind !== "chung" ? ` → ${el(r.element)}` : ""}
              </li>
            ))}
          </ul>
        )}
      </div>
      <p className="mt-2 text-center text-[10px] text-ink/40">{t.note}</p>
    </div>
  );
}
